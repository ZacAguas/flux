# Session Management Architecture

This document explains the session management system, enabling users to persist and restore viewer state (camera positions, transfer functions, settings).

## Concept

A **session** is a lightweight snapshot of the viewer state, excluding the volume data itself.

**Persisted State:**

- **Camera:** 3D/2D positions, zoom, rotation.
- **Visualisation:** Transfer function (colours, opacity), rendering quality, clipping planes.
- **UI:** Layout mode, window/level, crosshairs.
- **Reference:** Metadata to identify and validate the original NIfTI file.

**Not Persisted:**

- Volume voxel data (avoids duplication).
- GPU resources (textures).
- Transient UI state (hover states, temporary panels).

## Architecture

### Storage: IndexedDB + File References

We use **IndexedDB** to store session metadata and a reference to the original volume file.

- **Why IndexedDB?** Supports large datasets (>100MB), asynchronous, browser-native.
- **File References:** We store a handle/reference to the file, not the file itself. This keeps sessions small (<1MB) and avoids quota issues.
- **Fallback:** If the `FileSystemFileHandle` API is unavailable or permission is lost, the system gracefully falls back to a file picker.

### Dirty State Tracking

To track unsaved changes without performance penalties, we use a hybrid approach:

- **Immediate:** Transfer function, layout, raymarch settings.
- **On Interaction End:** Window/level, slice indices (updates state when drag ends).
- **Excluded:** Camera movements (to avoid excessive dirty states).

### Volume Validation

To ensure the correct volume is loaded for a session, we use a **multi-chunk hash**:

1. **Header (1KB):** Fast check for metadata.
2. **Middle & End:** Ensures data integrity if headers are identical.

```typescript
interface VolumeFileReference {
  fileName: string;
  fileSize: number;
  lastModified: number;
  fileHash: string; // SHA-256 of header + chunks
  fileHandle?: FileSystemFileHandle;
}
```

## Data Flow

### Saving

1. **Trigger:** User saves (or auto-save fires).
2. **Serialise:** Extract state from Zustand store (deep clone).
3. **Reference:** specific file metadata is generated/updated.
4. **Persist:** Write to IndexedDB (`medical-viewer-sessions`).
5. **Clean:** Mark state as "clean" (not dirty).

### Loading

1. **Select:** User chooses a session from the picker.
2. **Fetch:** Session data loaded from IndexedDB.
3. **Resolve File:**
    - Attempt to use stored `FileSystemFileHandle`.
    - If failed/missing, prompt user to select the file.
4. **Validate:** Compare selected file hash with stored reference.
    - *Mismatch?* Warn user, but allow forced load (useful for applying settings to different subjects).
5. **Restore:** Parse NIfTI, generate textures, apply serialised state.

### Auto-Save

- Runs every 2 minutes if changes exist.
- Saves to a dedicated `__autosave__` slot (overwrites previous).
- Silent operation.
- Restorable on app launch.

## Component Architecture

The system is modular, separating logic (hooks) from UI (components).

**Core Hooks:**

- `useSessionManager`: Orchestrates high-level flows.
- `useSaveSession` / `useLoadSession`: Handle specific I/O operations.
- `useAutoSave`: Background timer.
- `useStateChangeTracking`: Monitors store changes.

**UI Components:**

- `SessionManager`: Main integration point (modals, file menu).
- `SessionPickerModal`: Lists sessions with thumbnails.
- `UnsavedChangesModal`: Intercepts navigation/action when dirty.

## State Management (Zustand)

`SessionSlice` manages session-specific state within the main viewer store:

```typescript
interface SessionSlice {
  isDirty: boolean;
  currentSessionId: string | null;
  lastAutoSave: number | null;
  // ... actions
}
```

## Serialisation

We use a specific `serializeViewerState` function to extract only persistable data.

**Key Behaviour:**

- **Deep Cloning:** Prevents mutation bugs.
- **Exclusion:** Runtime objects (textures, large arrays) are omitted.
- **Versioned:** Sessions include a schema version for future migrations.

## Error Handling

- **Quota Exceeded:** Prompts user to delete old sessions.
- **File Missing/Moved:** Falls back to manual file selection.
- **Version Mismatch:** Basic validation ensures schema compatibility.

## Future Enhancements

- **Undo/Redo:** Extend dirty tracking to a full history stack.
- **Comparison:** Split-view loading of two sessions.

