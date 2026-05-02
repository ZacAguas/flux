/**
 * Session Types
 *
 * Type definitions for session save/load functionality.
 * Sessions store viewer state (camera, transfer function, settings)
 * and a reference to the volume file (not the file data itself).
 */

import type {
  LayoutMode,
  SliceIndices,
  WindowLevel,
  SliceCameraState,
} from './layout';
import type {
  RaymarchSettings,
  TransferFunction,
} from './volume';
import type { CropBox } from './clipping';
import type {
  VolumeCameraState,
  CrosshairSettings,
  SlicePlaneSettings,
} from '../store/storeTypes';
import type { Measurement } from './measurement';
import type { TicROI } from './tic';

/**
 * Reference to the original NIfTI volume file.
 * Stores metadata for validation, not the actual file data.
 */
export interface VolumeFileReference {
  fileName: string;
  fileSize: number;
  lastModified: number;
  fileHash: string; // Multi-chunk hash (header + middle + end)
  fileHandle?: FileSystemFileHandle; // File System Access API handle (if available)
}

/**
 * Result of validating a volume file against a reference.
 */
export interface VolumeValidationResult {
  isValid: boolean;
  expected: {
    fileName: string;
    fileSize: number;
    lastModified: number;
    fileHash: string;
  };
  actual: {
    fileName: string;
    fileSize: number;
    lastModified: number;
    fileHash: string;
  };
}

/**
 * All persistable viewer state (no textures, no volume data).
 * This represents a complete "session" that can be saved and restored.
 */
export interface SerializableViewerState {
  // Volume metadata
  timeStep: number;

  // Layout state
  layoutMode: LayoutMode;

  // View state
  sliceIndices: SliceIndices;
  sliceCameraState: SliceCameraState;
  volumeCameraState: VolumeCameraState;
  windowLevel: WindowLevel;
  showCrosshairs: boolean;
  crosshairSettings: CrosshairSettings;
  showMetricOverlays: boolean;

  // Rendering state
  showSlicePlanes: boolean;
  slicePlaneSettings: SlicePlaneSettings;
  raymarchSettings: RaymarchSettings;
  transferFunction: TransferFunction;
  activeTransferFunctionPreset: string;
  cropBox: CropBox;

  // Measurement state
  measurements: Measurement[];
  showMeasurements: boolean;

  // TIC state (curves are re-derived from volume data on restore)
  ticRois?: TicROI[];
}

/**
 * Complete viewer session with version and volume reference.
 * This is the format saved to IndexedDB or exported as JSON.
 */
export interface ViewerSession {
  version: string; // Schema version (e.g., "1.0.0")
  timestamp: number; // Unix timestamp (ms) when session was saved
  volumeReference: VolumeFileReference;
  viewerState: SerializableViewerState;
}

/**
 * Metadata for a saved session (stored separately in IndexedDB for listing).
 */
export interface SavedSessionMetadata {
  id: string; // UUID
  name: string; // Provided by user
  volumeFileName: string; // For display/filtering
  timestamp: number; // Unix timestamp (ms)
  isAutoSave: boolean;
  thumbnail?: string; // Base64 JPEG thumbnail of the canvas
}

/**
 * Complete saved session with full data (metadata + session data).
 */
export interface SavedSession extends SavedSessionMetadata {
  session: ViewerSession;
}

/**
 * Error types for session operations.
 */
export type SessionErrorType =
  | 'file-not-found'
  | 'file-mismatch'
  | 'indexeddb-error'
  | 'serialization-error'
  | 'deserialization-error'
  | 'quota-exceeded'
  | 'version-mismatch'
  | 'permission-denied'
  | 'permission-dismissed'
  | 'handle-invalid'
  | 'unknown';

/**
 * Error information for session operations.
 */
export interface SessionError {
  type: SessionErrorType;
  message: string;
  details?: unknown;
}
