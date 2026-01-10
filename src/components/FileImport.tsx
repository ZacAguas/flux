/**
 * File import component with drag-and-drop support
 */

import { useState } from 'react';
import { parseNifti } from '../utils/niftiParser';
import { createVolumeTexture, calculateTextureMemory } from '../utils/volumeTextureConverter';
import { useViewerStore } from '../store/viewerStore';

export function FileImport() {
  const setVolume = useViewerStore((state) => state.setVolume);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    // Validate file extension
    if (!file.name.match(/\.(nii|nii\.gz)$/i)) {
      setError('Please select a valid NIfTI file (.nii or .nii.gz)');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const volume = await parseNifti(file);
      const texture = createVolumeTexture(volume, 0);
      setVolume(volume, texture, file.name);

      // Log 4D dataset info
      if (volume.dimensions.t && volume.dimensions.t > 1) {
        const singleTextureMB = calculateTextureMemory(texture);
        const windowMemoryMB = singleTextureMB * 3; // Window cache size

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${isDragging ? '#4CAF50' : '#ccc'}`,
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center',
        backgroundColor: isDragging ? '#f0f8f0' : '#fafafa',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      }}
    >
      <input
        type="file"
        // 'accept' doesn't support double extensions like .nii.gz, so we validate in handleFile instead
        onChange={handleFileInput}
        style={{ display: 'none' }}
        id="file-input"
        disabled={isLoading}
      />
      <label
        htmlFor="file-input"
        style={{
          cursor: isLoading ? 'not-allowed' : 'pointer',
          display: 'block',
        }}
      >
        {isLoading ? (
          <div>
            <p style={{ fontSize: '18px', marginBottom: '8px', color: '#666' }}>Loading...</p>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Parsing NIfTI file...
            </p>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '18px', marginBottom: '8px', color: '#666' }}>
              Drop NIfTI file here or click to browse
            </p>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Supports .nii and .nii.gz files
            </p>
          </div>
        )}
      </label>

      {error && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#ffebee',
            color: '#c62828',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
