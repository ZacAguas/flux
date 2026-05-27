import { motion, useAnimation } from 'motion/react';
import { useEffect } from 'react';
import type { PanInfo } from 'motion/react';
import { useViewerStore } from '../../store/viewerStore';
import { selectIs4D } from '../../utils/uiLayout';
import { getSectionContent, getSectionLabel } from './sectionContent';

const DISMISS_THRESHOLD_PX = 80;
const DISMISS_VELOCITY = 400;

export function MobileSheet() {
  const activeSections    = useViewerStore((state) => state.activeSections);
  const setActiveSections = useViewerStore((state) => state.setActiveSections);
  const is4D              = useViewerStore(selectIs4D);

  const activeId = activeSections[0] ?? null;
  const isOpen = activeId !== null;
  const label = activeId ? getSectionLabel(activeId) : '';

  const controls = useAnimation();

  useEffect(() => {
    void controls.start({ y: isOpen ? 0 : '100%' });
  }, [isOpen, controls]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > DISMISS_THRESHOLD_PX || info.velocity.y > DISMISS_VELOCITY) {
      setActiveSections([]);
    } else {
      void controls.start({ y: 0 });
    }
  };

  return (
    <motion.div
      className="absolute left-0 right-0 bottom-[60px] bg-neutral-50 dark:bg-neutral-900 border-t border-black/10 dark:border-white/10 z-20 flex flex-col"
      style={{
        height: '64vh',
        borderRadius: '14px 14px 0 0',
        y: '100%',  // initial position (closed)
      }}
      animate={controls}
      drag={isOpen ? 'y' : false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.35 }}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      transition={{ type: 'spring', stiffness: 380, damping: 38 }}
    >
      {/* Drag handle */}
      <div className="flex justify-center pt-3 pb-2 flex-shrink-0 cursor-grab active:cursor-grabbing touch-none">
        <motion.div
          className="w-8 h-1 rounded-full bg-black/20 dark:bg-white/20"
          whileHover={{ width: 40 }}
          transition={{ duration: 0.15 }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center px-4 py-2 border-b border-black/8 dark:border-white/8 flex-shrink-0">
        <span className="text-sm font-semibold text-black/85 dark:text-white/90">{label}</span>
      </div>

      {/* Content */}
      <div key={activeId} className="flex-1 overflow-y-auto px-4 py-4" style={{ scrollbarWidth: 'thin' }}>
        {activeId && getSectionContent(activeId, is4D)}
      </div>
    </motion.div>
  );
}
