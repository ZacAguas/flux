import { create } from 'zustand';
import type { ViewerStore } from './storeTypes';
import { createVolumeSlice } from './slices/volumeSlice';
import { createLayoutSlice } from './slices/layoutSlice';
import { createViewSlice } from './slices/viewSlice';
import { createRenderingSlice } from './slices/renderingSlice';
import { createSessionSlice } from './slices/sessionSlice';

// Re-export types for backward compatibility
export * from './storeTypes';

export const useViewerStore = create<ViewerStore>((...a) => ({
  ...createVolumeSlice(...a),
  ...createLayoutSlice(...a),
  ...createViewSlice(...a),
  ...createRenderingSlice(...a),
  ...createSessionSlice(...a),
}));
