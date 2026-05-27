import { motion } from 'motion/react';
import { useViewerStore } from '../../store/viewerStore';
import { inject4D, ACCENT_COLOR, selectIs4D } from '../../utils/uiLayout';
import type { SectionId } from '../../utils/uiLayout';
import { NAV_SECTIONS, NAV_SECTION_4D, NAV_LAYOUTS } from '../../utils/navConstants';

export function MobileBar() {
  const activeSections    = useViewerStore((state) => state.activeSections);
  const setActiveSections = useViewerStore((state) => state.setActiveSections);
  const layoutMode        = useViewerStore((state) => state.layoutMode);
  const setLayoutMode     = useViewerStore((state) => state.setLayoutMode);
  const is4D              = useViewerStore(selectIs4D);

  const tabs = inject4D(NAV_SECTIONS, NAV_SECTION_4D, is4D, 4);

  const activeId = activeSections[0] ?? null;

  const handleSelect = (id: SectionId) => {
    setActiveSections(activeId === id ? [] : [id]);
  };

  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-[60px] bg-black/90 backdrop-blur-[14px] border-t border-white/8 flex z-30 overflow-x-auto"
      style={{ scrollbarWidth: 'none' }}
    >
      {NAV_LAYOUTS.map(({ id, icon: Icon, label }) => {
        const isActive = layoutMode === id;
        return (
          <motion.button
            key={id}
            onClick={() => setLayoutMode(id)}
            className="!p-0 !border-0 rounded-none flex-shrink-0 w-[60px] flex flex-col items-center justify-center gap-1 relative"
            whileTap={{ scale: 0.88 }}
          >
            {isActive && (
              <motion.div
                className="absolute top-0 left-3 right-3 h-0.5 rounded-b"
                layoutId="mobile-layout-indicator"
                style={{ backgroundColor: ACCENT_COLOR }}
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <motion.div
              animate={{ color: isActive ? ACCENT_COLOR : 'rgba(255,255,255,0.4)', scale: isActive ? 1 : 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <Icon className="w-5 h-5" />
            </motion.div>
            <motion.span
              className="text-[9px] font-semibold uppercase tracking-wider"
              animate={{ color: isActive ? ACCENT_COLOR : 'rgba(255,255,255,0.3)' }}
            >
              {label}
            </motion.span>
          </motion.button>
        );
      })}

      <div className="flex-shrink-0 w-px bg-white/20 my-3" />

      {tabs.map(({ id, icon: Icon, label }) => {
        const isActive = activeId === id;
        return (
          <motion.button
            key={id}
            onClick={() => handleSelect(id)}
            className="!p-0 !border-0 rounded-none flex-shrink-0 w-[72px] flex flex-col items-center justify-center gap-1 relative"
            whileTap={{ scale: 0.88 }}
          >
            {isActive && (
              <motion.div
                className="absolute top-0 left-4 right-4 h-0.5 rounded-b"
                layoutId={`mobile-tab-indicator-${id}`}
                style={{ backgroundColor: ACCENT_COLOR }}
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <motion.div
              animate={{ color: isActive ? ACCENT_COLOR : 'rgba(255,255,255,0.4)', scale: isActive ? 1 : 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <Icon className="w-5 h-5" />
            </motion.div>
            <motion.span
              className="text-[9px] font-semibold uppercase tracking-wider"
              animate={{ color: isActive ? ACCENT_COLOR : 'rgba(255,255,255,0.3)' }}
            >
              {label}
            </motion.span>
          </motion.button>
        );
      })}
    </div>
  );
}
