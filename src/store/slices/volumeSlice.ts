import type { StateCreator } from 'zustand';
import type { ViewerStore, VolumeSlice } from '../storeTypes';
import { defaultSliceCamera } from '../constants';
import type { SliceIndices, WindowLevel } from '../../types/layout';

export const createVolumeSlice: StateCreator<ViewerStore, [], [], VolumeSlice> = (set, get) => ({
  volume: null,
  volumeTexture: null,
  volumeFileName: null,
  volumeFileMetadata: null,
  timeStep: 0,
  isLoadingTimeStep: false,
  textureCache: new Map(),

  setVolume: (volume, texture, fileName, metadata) => {
    // Dispose old texture if it exists
    const oldTexture = get().volumeTexture;
    if (oldTexture) {
      oldTexture.dispose();
    }

    // Clear texture cache when loading new volume
    const cache = get().textureCache;
    cache.forEach(tex => tex.dispose());
    cache.clear();

    // Calculate initial slice indices (middle of each dimension)
    const sliceIndices: SliceIndices = {
      axial: Math.floor(volume.dimensions.z / 2),
      coronal: Math.floor(volume.dimensions.y / 2),
      sagittal: Math.floor(volume.dimensions.x / 2),
    };

    // Calculate initial window/level (full range)
    const windowLevel: WindowLevel = {
      center: (volume.dataRange.min + volume.dataRange.max) / 2,
      width: volume.dataRange.max - volume.dataRange.min,
    };

    set({
      volume,
      volumeTexture: texture,
      sliceIndices,
      sliceCameraState: {
        axial: { ...defaultSliceCamera },
        coronal: { ...defaultSliceCamera },
        sagittal: { ...defaultSliceCamera },
      },
      windowLevel,
      timeStep: 0,
      isLoadingTimeStep: false,
      textureCache: new Map(),
      volumeFileName: fileName || null,
      volumeFileMetadata: metadata || null,
    });
  },

  setVolumeTexture: (texture) => {
    const oldTexture = get().volumeTexture;
    if (oldTexture) {
      oldTexture.dispose();
    }
    set({ volumeTexture: texture });
  },

  setTimeStep: (step) => {
    const volume = get().volume;
    if (!volume?.dimensions.t) return;
    const clamped = Math.max(0, Math.min(step, volume.dimensions.t - 1));
    set({ timeStep: clamped });
  },

  setIsLoadingTimeStep: (loading) => set({ isLoadingTimeStep: loading }),

  addTextureToCache: (timeStep, texture) => {
    const cache = get().textureCache;

    // Limit cache size to 3 textures
    if (cache.size >= 3) {
      // Find oldest entry (furthest from current timeStep)
      let furthestKey = -1;
      let maxDistance = -1;

      cache.forEach((_, key) => {
        const distance = Math.abs(key - get().timeStep);
        if (distance > maxDistance) {
          maxDistance = distance;
          furthestKey = key;
        }
      });

      // Evict furthest entry
      if (furthestKey !== -1) {
        const oldTexture = cache.get(furthestKey);
        oldTexture?.dispose();
        cache.delete(furthestKey);
      }
    }

    cache.set(timeStep, texture);
    set({ textureCache: new Map(cache) });
  },

  clearTextureCache: () => {
    const cache = get().textureCache;
    cache.forEach(texture => texture.dispose());
    set({ textureCache: new Map() });
  },
});