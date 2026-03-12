import type { StateCreator } from 'zustand';
import type { ViewerStore, LayoutSlice, ControlPanelSections } from '../storeTypes';

export const createLayoutSlice: StateCreator<ViewerStore, [], [], LayoutSlice> = (set, get) => ({
  layoutMode: 'single',
  controlPanelOpen: true,
  controlPanelPinned: true,
  controlPanelContentHeight: 0,
  controlPanelSections: {
    sliceNavigation: true,
    playback: false,
    display: false,
    volumeRendering: true,
    clippingPlanes: false,
    transferFunction: false,
    measurements: false,
  },
  popoverOpen: false,
  helpModalOpen: false,

  setLayoutMode: (mode) => {
    const currentMode = get().layoutMode;

    // Auto collapse/expand sections based on layout mode
    if (mode !== currentMode) {
      const sections = get().controlPanelSections;

      if (mode === 'single') {
        // Single mode: collapse slice navigation (slices disabled), expand volume rendering
        set({
          layoutMode: mode,
          controlPanelSections: {
            ...sections,
            sliceNavigation: false,
            measurements: false,
            volumeRendering: true,
          },
        });
      } else if (mode === 'slices') {
        // Slices mode: expand slice navigation, collapse volume rendering
        set({
          layoutMode: mode,
          controlPanelSections: {
            ...sections,
            sliceNavigation: true,
            volumeRendering: false,
          },
        });
      } else if (mode === 'quad') {
        // Quad mode: expand slice navigation and volume rendering
        set({
          layoutMode: mode,
          controlPanelSections: {
            ...sections,
            sliceNavigation: true,
            volumeRendering: true,
          },
        });
      } else {
        set({ layoutMode: mode });
      }
    } else {
      set({ layoutMode: mode });
    }
  },

  setControlPanelOpen: (open) => set({ controlPanelOpen: open }),

  setControlPanelPinned: (isPinned) => set({ controlPanelPinned: isPinned }),

  setControlPanelContentHeight: (height) => set({ controlPanelContentHeight: height }),

  setControlPanelSectionExpanded: (sectionId, expanded) =>
    set((state) => ({
      controlPanelSections: {
        ...state.controlPanelSections,
        [sectionId]: expanded,
      },
    })),

  setPopoverOpen: (open) => set({ popoverOpen: open }),

  setHelpModalOpen: (open) => set({ helpModalOpen: open }),

  toggleAllSections: (expanded) =>
    set((state) => ({
      controlPanelSections: {
        ...Object.keys(state.controlPanelSections).reduce(
          (acc, key) => ({ ...acc, [key]: expanded }),
          {} as ControlPanelSections
        ),
      },
    })),
});