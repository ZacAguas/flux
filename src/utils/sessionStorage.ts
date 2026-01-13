/**
 * Session Storage Utilities
 *
 * IndexedDB wrapper for persisting viewer sessions.
 * Provides CRUD operations, auto-save management, and JSON export/import.
 */

import type {
  ViewerSession,
  SavedSession,
  SavedSessionMetadata,
  SessionError,
} from '../types/session';

const DB_NAME = 'medical-viewer-sessions';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';
const AUTO_SAVE_ID = '__autosave__';

/**
 * Initialize IndexedDB with schema.
 * Should be called once when the app starts.
 */
export async function initializeSessionDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      request.result.close();
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create sessions object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });

        // Create indexes for querying
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        objectStore.createIndex('volumeFileName', 'volumeFileName', { unique: false });
        objectStore.createIndex('isAutoSave', 'isAutoSave', { unique: false });
      }
    };
  });
}

/**
 * Save a session to IndexedDB.
 */
export async function saveSession(
  session: ViewerSession,
  name: string,
  isAutoSave = false,
  id?: string,
): Promise<SavedSessionMetadata> {
  try {
    const savedSession: SavedSession = {
      id: id || (isAutoSave ? AUTO_SAVE_ID : crypto.randomUUID()),
      name,
      volumeFileName: session.volumeReference.fileName,
      timestamp: session.timestamp,
      isAutoSave,
      session,
    };

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(createSessionError('indexeddb-error', 'Failed to open database'));
      };

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        const putRequest = objectStore.put(savedSession);

        putRequest.onerror = () => {
          reject(createSessionError('indexeddb-error', 'Failed to save session'));
        };

        putRequest.onsuccess = () => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { session: _, ...metadata } = savedSession;
          resolve(metadata);
        };

        transaction.oncomplete = () => {
          db.close();
        };
      };
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      throw createSessionError('quota-exceeded', 'Browser storage quota exceeded');
    }
    throw createSessionError('indexeddb-error', 'Failed to save session', error);
  }
}

/**
 * Load a session from IndexedDB by ID.
 */
export async function loadSession(id: string): Promise<ViewerSession> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(createSessionError('indexeddb-error', 'Failed to open database'));
    };

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const getRequest = objectStore.get(id);

      getRequest.onerror = () => {
        reject(createSessionError('indexeddb-error', 'Failed to load session'));
      };

      getRequest.onsuccess = () => {
        const savedSession = getRequest.result as SavedSession | undefined;
        if (!savedSession) {
          reject(createSessionError('file-not-found', `Session with ID ${id} not found`));
        } else {
          resolve(savedSession.session);
        }
      };

      transaction.oncomplete = () => {
        db.close();
      };
    };
  });
}

/**
 * List all saved sessions (excluding auto-save by default).
 */
export async function listSessions(includeAutoSave = false): Promise<SavedSessionMetadata[]> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(createSessionError('indexeddb-error', 'Failed to open database'));
    };

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const getAllRequest = objectStore.getAll();

      getAllRequest.onerror = () => {
        reject(createSessionError('indexeddb-error', 'Failed to list sessions'));
      };

      getAllRequest.onsuccess = () => {
        const sessions = getAllRequest.result as SavedSession[];

        // Filter and extract metadata
        const metadata = sessions
          .filter(s => includeAutoSave || !s.isAutoSave)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .map(({ session: _, ...meta }) => meta)
          .sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first

        resolve(metadata);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    };
  });
}

/**
 * Delete a session from IndexedDB.
 */
export async function deleteSession(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(createSessionError('indexeddb-error', 'Failed to open database'));
    };

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const deleteRequest = objectStore.delete(id);

      deleteRequest.onerror = () => {
        reject(createSessionError('indexeddb-error', 'Failed to delete session'));
      };

      deleteRequest.onsuccess = () => {
        resolve();
      };

      transaction.oncomplete = () => {
        db.close();
      };
    };
  });
}

/**
 * Get the auto-save session if it exists.
 */
export async function getAutoSave(): Promise<ViewerSession | null> {
  try {
    return await loadSession(AUTO_SAVE_ID);
  } catch (error) {
    // Auto-save not found is not an error
    if ((error as SessionError).type === 'file-not-found') {
      return null;
    }
    throw error;
  }
}

/**
 * Save to auto-save slot (overwrites existing auto-save).
 */
export async function autoSaveSession(session: ViewerSession): Promise<SavedSessionMetadata> {
  return saveSession(session, 'Auto-save', true, AUTO_SAVE_ID);
}

/**
 * Delete the auto-save session.
 */
export async function clearAutoSave(): Promise<void> {
  try {
    await deleteSession(AUTO_SAVE_ID);
  } catch (error) {
    // Auto-save not found is not an error
    if ((error as SessionError).type !== 'file-not-found') {
      throw error;
    }
  }
}

/**
 * Export a session as a downloadable JSON file.
 */
export function exportSessionToJSON(session: ViewerSession, fileName: string): void {
  try {
    // Create a clean copy without FileSystemFileHandle (can't be serialized)
    const exportSession: ViewerSession = {
      ...session,
      volumeReference: {
        ...session.volumeReference,
        fileHandle: undefined, // Remove non-serializable handle
      },
    };

    const json = JSON.stringify(exportSession, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    throw createSessionError('serialization-error', 'Failed to export session', error);
  }
}

/**
 * Import a session from an uploaded JSON file.
 */
export async function importSessionFromJSON(file: File): Promise<ViewerSession> {
  try {
    const text = await file.text();
    const session = JSON.parse(text) as ViewerSession;

    // Validate session structure
    if (!session.version || !session.timestamp || !session.volumeReference || !session.viewerState) {
      throw new Error('Invalid session file format');
    }

    return session;
  } catch (error) {
    throw createSessionError('deserialization-error', 'Failed to import session', error);
  }
}

/**
 * Helper to create standardized error objects.
 */
function createSessionError(type: SessionError['type'], message: string, details?: unknown): SessionError {
  return { type, message, details };
}
