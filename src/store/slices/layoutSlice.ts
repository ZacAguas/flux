import type { StateCreator } from 'zustand';
import type { ViewerStore, LayoutSlice, ControlPanelSections } from '../storeTypes';

export const createLayoutSlice: StateCreator<ViewerStore, [], [], LayoutSlice> = (set, get) => ({
  layoutMode: 'single',
  controlPanelOpen: true,
  controlPanelPinned: true,
  controlPanelContentHeight: 0,
  controlPanelSections: {
    viewSettings: true,
    viewOptions: false,
    rendering3D: true,
    transferFunction: false,
    measurementsTools: false,
    presetsSettings: false,
  },
  popoverOpen: false,

  setLayoutMode: (mode) => {
    const currentMode = get().layoutMode;

    // Auto collapse/expand sections based on layout mode
    if (mode !== currentMode) {
      const sections = get().controlPanelSections;

      if (mode === 'single') {
        // Single mode: collapse view settings (slices disabled), expand 3D rendering
        set({
          layoutMode: mode,
          controlPanelSections: {
            ...sections,
            viewSettings: false,
            rendering3D: true,
          },
        });
      } else if (mode === 'slices') {
        // Slices mode: expand view settings, collapse 3D rendering
        set({
          layoutMode: mode,
          controlPanelSections: {
            ...sections,
            viewSettings: true,
            rendering3D: false,
          },
        });
      } else if (mode === 'quad') {
        // Quad mode: expand both view settings and 3D rendering
        set({
          layoutMode: mode,
          controlPanelSections: {
            ...sections,
            viewSettings: true,
            rendering3D: true,
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