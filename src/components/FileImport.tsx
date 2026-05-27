/**
 * File import component — click to browse for a NIfTI file.
 * Drag-and-drop is handled globally by useGlobalDropHandler.
 */

import { useRef, useState } from 'react';
import { parseNifti } from '../utils/niftiParser';
import { createVolumeTexture, calculateTextureMemory } from '../utils/volumeTextureConverter';
import { createVolumeReference } from '../utils/volumeReference';
import { useViewerStore } from '../store/viewerStore';

export function FileImport() {
  const setVolume = useViewerStore((state) => state.setVolume);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File, fileHandle?: FileSystemFileHandle) => {
    if (!file.name.match(/\.(nii|nii\.gz)$/i)) {
      setError('Please select a valid NIfTI file (.nii or .nii.gz)');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // PERF: Computing file hash adds ~50-200ms to load time for typical NIfTI files
      // Future optimization: Move hash computation to Web Worker to avoid blocking main thread
      const volumeReference = await createVolumeReference(file, fileHandle);
      const metadata = {
        fileName: volumeReference.fileName,
        fileSize: volumeReference.fileSize,
        fileHash: volumeReference.fileHash,
        lastModified: volumeReference.lastModified,
        fileHandle: volumeReference.fileHandle,
      };

      const volume = await parseNifti(file);
      const texture = createVolumeTexture(volume, 0);
      setVolume(volume, texture, metadata);

      if (volume.dimensions.t && volume.dimensions.t > 1) {
        const singleTextureMB = calculateTextureMemory(texture);
        const windowMemoryMB = singleTextureMB * 3;

        console.log(`4D dataset: ${volume.dimensions.t} time steps`);
        console.log(`Single texture: ${singleTextureMB.toFixed(1)} MB`);
        console.log(`Window cache (3 textures): ${windowMemoryMB.toFixed(1)} MB`);

        // NOTE: Window loading auto-disabled in useVolumeSetup if texture >512MB
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load file';
      setError(message);
      console.error('Error loading NIfTI file:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // NOTE: Must stay synchronous — async chains lose the user gesture trust required
  // for showOpenFilePicker and input.click() to open a file dialog in browsers.
  const handleBrowseClick = () => {
    if (isLoading) return;

    if ('showOpenFilePicker' in window && typeof window.showOpenFilePicker === 'function') {
      void (async () => {
        try {
          const [fileHandle] = await (window.showOpenFilePicker as (options?: unknown) => Promise<FileSystemFileHandle[]>)({
            types: [{ description: 'NIfTI Files', accept: { 'application/octet-stream': ['.nii', '.gz'] } }],
            multiple: false,
          });
          const file = await fileHandle.getFile();
          handleFile(file, fileHandle);
        } catch (err) {
          if ((err as Error).name !== 'AbortError') {
            setError((err as Error).message);
          }
        }
      })();
    } else {
      inputRef.current?.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
      // Reset so the same file can be re-selected
      e.target.value = '';
    }
  };

  return (
    <div
      onClick={handleBrowseClick}
      className={`border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.03] rounded-[0.625rem] py-12 px-13 text-center transition-all duration-300 ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".nii,.nii.gz"
        onChange={handleInputChange}
        className="hidden"
      />
      {isLoading ? (
        <div>
          <p className="text-[1.05rem] text-black/55 dark:text-white/55 mb-2">Loading...</p>
          <p className="text-[0.85rem] text-black/30 dark:text-white/30 m-0">Parsing NIfTI file...</p>
        </div>
      ) : (
        <div>
          <p className="text-[1.05rem] text-black/55 dark:text-white/55 mb-2">
            Click to browse or drop a file
          </p>
          <p className="text-[0.85rem] text-black/25 dark:text-white/25 m-0">.nii/.nii.gz</p>
        </div>
      )}

      {error && (
        <div className="mt-4 py-2.5 px-3.5 bg-red-500/10 text-red-300/90 rounded-md text-[0.85rem] border border-red-500/25">
          {error}
        </div>
      )}
    </div>
  );
}
