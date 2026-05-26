import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  XMarkIcon,
  ChevronDownIcon,
  Bars2Icon,
} from '@heroicons/react/24/outline';
import { useViewerStore } from '../../store/viewerStore';
import { getSectionContent, getSectionLabel } from './sectionContent';
import { PANEL_WIDTH, ACCENT_COLOR, selectIs4D } from '../../utils/uiLayout';
import type { SectionId } from '../../utils/uiLayout';


interface SidePanelProps {
  overlayMode?: boolean;
}

const springWidth = { type: 'spring' as const, stiffness: 420, damping: 38, mass: 0.7 };

export function SidePanel({ overlayMode }: SidePanelProps) {
  const activeSections = useViewerStore((state) => state.activeSections);
  const setActiveSections = useViewerStore((state) => state.setActiveSections);

  const isOpen = activeSections.length > 0;

  const closeAll = () => setActiveSections([]);

  if (overlayMode) {
    return (
      <>
        {/* Backdrop */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="absolute inset-0 z-[19]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ background: 'rgba(0,0,0,0.3)' }}
              onClick={closeAll}
            />
          )}
        </AnimatePresence>

        {/* Overlay panel */}
        <motion.div
          className="absolute top-0 bottom-0 left-12 bg-black/40 backdrop-blur-sm border-r border-white/8 z-20 flex flex-col overflow-hidden"
          animate={{ width: isOpen ? PANEL_WIDTH : 0 }}
          transition={springWidth}
          style={{ boxShadow: isOpen ? '6px 0 28px rgba(0,0,0,0.4)' : 'none' }}
        >
          <PanelContents />
        </motion.div>
      </>
    );
  }

  return (
    <motion.div
      className="flex-shrink-0 bg-black/20 border-r border-white/8 flex flex-col overflow-hidden"
      animate={{ width: isOpen ? PANEL_WIDTH : 0 }}
      transition={springWidth}
    >
      <PanelContents />
    </motion.div>
  );
}

function PanelContents() {
  const activeSections = useViewerStore((state) => state.activeSections);
  const setActiveSections = useViewerStore((state) => state.setActiveSections);
  const is4D = useViewerStore(selectIs4D);

  const [collapsedSections, setCollapsedSections] = useState<Set<SectionId>>(new Set());

  const [dragOverId, setDragOverId] = useState<SectionId | null>(null);
  const dragOverRef = useRef<SectionId | null>(null);
  const sectionEls = useRef<Map<SectionId, HTMLDivElement>>(new Map());

  const closeAll = () => setActiveSections([]);

  const closeOne = (id: SectionId) => {
    setActiveSections(activeSections.filter(s => s !== id));
  };

  const toggleCollapse = (id: SectionId) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const setOver = (id: SectionId | null) => {
    dragOverRef.current = id;
    setDragOverId(id);
  };

  const findIdAtY = (y: number, excludeId: SectionId): SectionId | null => {
    for (const [id, el] of sectionEls.current) {
      if (id === excludeId) continue;
      const r = el.getBoundingClientRect();
      if (y >= r.top && y <= r.bottom) return id;
    }
    return null;
  };

  return (
    <div style={{ width: PANEL_WIDTH }} className="flex flex-col h-full min-h-0 select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/8 flex-shrink-0 min-h-[40px]">
        <span className="text-[9px] font-semibold text-white/30 uppercase tracking-[0.1em]">Controls</span>
        <div className="flex gap-0.5">
          <motion.button
            onClick={closeAll}
            title="Close all"
            className="!p-0 !border-0 w-6 h-6 flex items-center justify-center rounded text-white/30 hover:text-white/60 hover:bg-white/8"
            whileTap={{ scale: 0.88 }}
          >
            <XMarkIcon className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>

      {/* Stacked sections */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'thin' }}>
        <AnimatePresence initial={false}>
          {activeSections.map((id, idx) => {
            const isCollapsed = collapsedSections.has(id);
            const label = getSectionLabel(id);

            return (
              <motion.div
                key={id}
                ref={(el) => { if (el) sectionEls.current.set(id, el); else sectionEls.current.delete(id); }}
                className={idx > 0 ? 'border-t border-white/6' : ''}
                style={{ outline: dragOverId === id ? '1px solid rgba(19,221,209,0.4)' : 'none' }}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12, height: 0, overflow: 'hidden' }}
                transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                layout
              >
                {/* Section header */}
                <div className="sticky top-0 z-[1] flex items-center gap-1.5 px-2 py-1.5 bg-black/20 backdrop-blur-[6px] border-b border-white/6">
                  {/* Drag grip */}
                  <div
                    className="cursor-grab active:cursor-grabbing text-white/20 hover:text-white/40 flex-shrink-0 flex items-center"
                    style={{ touchAction: 'none' }}
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      setOver(null);
                    }}
                    onPointerMove={(e) => {
                      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                      const over = findIdAtY(e.clientY, id);
                      if (over !== dragOverRef.current) setOver(over);
                    }}
                    onPointerUp={(e) => {
                      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                      e.currentTarget.releasePointerCapture(e.pointerId);
                      const to = dragOverRef.current;
                      setOver(null);
                      if (!to || to === id) return;
                      const next = [...activeSections];
                      const fi = next.indexOf(id);
                      const ti = next.indexOf(to);
                      if (fi === -1 || ti === -1) return;
                      next.splice(fi, 1);
                      next.splice(ti, 0, id);
                      setActiveSections(next);
                    }}
                    onPointerCancel={(e) => {
                      e.currentTarget.releasePointerCapture(e.pointerId);
                      setOver(null);
                    }}
                  >
                    <Bars2Icon className="w-3 h-3" />
                  </div>

                  {/* Accent pip */}
                  <div className="w-0.5 h-3 rounded-full opacity-70 flex-shrink-0" style={{ backgroundColor: ACCENT_COLOR }} />

                  {/* Title */}
                  <span className="flex-1 text-xs font-semibold text-white/80 tracking-[0.01em] min-w-0 truncate">
                    {label}
                  </span>

                  {/* Collapse chevron */}
                  <motion.button
                    onClick={() => toggleCollapse(id)}
                    className="!p-0 !border-0 w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-white/60 hover:bg-white/8 flex-shrink-0"
                    animate={{ rotate: isCollapsed ? -90 : 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    whileTap={{ scale: 0.88 }}
                  >
                    <ChevronDownIcon className="w-3.5 h-3.5" />
                  </motion.button>

                  {/* Close */}
                  <motion.button
                    onClick={() => closeOne(id)}
                    className="!p-0 !border-0 w-5 h-5 flex items-center justify-center rounded text-white/25 hover:text-white/55 hover:bg-white/8 flex-shrink-0"
                    whileTap={{ scale: 0.88 }}
                  >
                    <XMarkIcon className="w-3.5 h-3.5" />
                  </motion.button>
                </div>

                {/* Collapsible content */}
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="px-4 py-3.5">
                        {getSectionContent(id, is4D)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {activeSections.length === 0 && (
          <motion.div
            className="p-7 text-center text-xs text-white/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Select a section from the sidebar
          </motion.div>
        )}
      </div>
    </div>
  );
}
