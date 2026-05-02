import type { StateCreator } from 'zustand';
import type { ViewerStore, LayoutSlice } from '../storeTypes';
import type { SectionId } from '../../utils/uiLayout';

// Canonical rail order for sections (used to sort activeSections)
const RAIL_ORDER: readonly SectionId[] = ['file', 'volume', 'crop', 'slices', 'playback', 'display', 'transfer', 'measure'];

export const createLayoutSlice: StateCreator<ViewerStore, [], [], LayoutSlice> = (set, get) => ({
  layoutMode: 'single',
  activeSections: ['slices'],
  sidePanelPinned: false,
  popoverOpen: false,
  helpModalOpen: false,

  setLayoutMode: (mode) => set({ layoutMode: mode }),

  setPopoverOpen: (open) => set({ popoverOpen: open }),

  setHelpModalOpen: (open) => set({ helpModalOpen: open }),

  setActiveSections: (sections) => set({ activeSections: sections }),

  toggleSection: (id) => {
    const current = get().activeSections;
    if (current.includes(id)) {
      set({ activeSections: current.filter(s => s !== id) });
    } else {
      const next = [...current, id];
      // Keep rail order
      set({ activeSections: RAIL_ORDER.filter(s => next.includes(s)) });
    }
  },

  setSidePanelPinned: (pinned) => set({ sidePanelPinned: pinned }),
});
