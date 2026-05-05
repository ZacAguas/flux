import { useState, useRef } from 'react';
import {
  MapPinIcon,
  XMarkIcon,
  ChevronDownIcon,
  Bars2Icon,
} from '@heroicons/react/24/outline';
import { useViewerStore } from '../../store/viewerStore';
import { getSectionContent, getSectionLabel } from './sectionContent';
import { PANEL_WIDTH, ACCENT_COLOR } from '../../utils/uiLayout';
import type { SectionId } from '../../utils/uiLayout';


interface SidePanelProps {
  overlayMode?: boolean;
  onBackdropClick?: () => void;
}

export function SidePanel({ overlayMode, onBackdropClick }: SidePanelProps) {
  const activeSections = useViewerStore((state) => state.activeSections);
  const setActiveSections = useViewerStore((state) => state.setActiveSections);
  const setSidePanelPinned = useViewerStore((state) => state.setSidePanelPinned);

  const isOpen = activeSections.length > 0;

  const closeAll = () => {
    setActiveSections([]);
    setSidePanelPinned(false);
  };

  if (overlayMode) {
    return (
      <>
        {/* Backdrop */}
        {isOpen && (
          <div
            className="absolute inset-0 bg-black/30 z-[19]"
            onClick={onBackdropClick ?? closeAll}
          />
        )}
        {/* Overlay panel */}
        <div
          className="absolute top-0 bottom-0 left-12 bg-black/40 backdrop-blur-sm border-r border-white/8 z-20 flex flex-col overflow-hidden transition-[width] duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ width: isOpen ? PANEL_WIDTH : 0, boxShadow: isOpen ? '6px 0 28px rgba(0,0,0,0.4)' : 'none' }}
        >
          <PanelContents showPin={false} />
        </div>
      </>
    );
  }

  return (
    <div
      className="flex-shrink-0 bg-black/20 border-r border-white/8 flex flex-col overflow-hidden transition-[width] duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
      style={{ width: isOpen ? PANEL_WIDTH : 0 }}
    >
      <PanelContents showPin />
    </div>
  );
}

interface PanelContentsProps {
  showPin: boolean;
}

function PanelContents({ showPin }: PanelContentsProps) {
  const activeSections = useViewerStore((state) => state.activeSections);
  const setActiveSections = useViewerStore((state) => state.setActiveSections);
  const sidePanelPinned = useViewerStore((state) => state.sidePanelPinned);
  const setSidePanelPinned = useViewerStore((state) => state.setSidePanelPinned);
  const volume = useViewerStore((state) => state.volume);
  const is4D = Boolean(volume?.dimensions.t && volume.dimensions.t > 1);

  const [collapsedSections, setCollapsedSections] = useState<Set<SectionId>>(new Set());

  // Pointer-events based drag-to-reorder.
  // dragOverId drives the highlight; dragOverRef gives the pointerup handler a
  // synchronous read of the current value without a stale closure.
  const [dragOverId, setDragOverId] = useState<SectionId | null>(null);
  const dragOverRef = useRef<SectionId | null>(null);
  const sectionEls = useRef<Map<SectionId, HTMLDivElement>>(new Map());

  const closeAll = () => {
    setActiveSections([]);
    setSidePanelPinned(false);
  };

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
          {showPin && (
            <button
              onClick={() => setSidePanelPinned(!sidePanelPinned)}
              title={sidePanelPinned ? 'Unpin' : 'Pin open'}
              className={`!p-0 !border-0 w-6 h-6 flex items-center justify-center rounded transition-colors ${sidePanelPinned
                  ? 'bg-[rgba(19,221,209,0.1)]'
                  : 'text-white/30 hover:text-white/60 hover:bg-white/8'
                }`}
              style={sidePanelPinned ? { color: ACCENT_COLOR } : undefined}
            >
              <MapPinIcon className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={closeAll}
            title="Close all"
            className="!p-0 !border-0 w-6 h-6 flex items-center justify-center rounded text-white/30 hover:text-white/60 hover:bg-white/8 transition-colors"
          >
            <XMarkIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stacked sections */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'thin' }}>
        {activeSections.map((id, idx) => {
          const isCollapsed = collapsedSections.has(id);
          const label = getSectionLabel(id);

          return (
            <div
              key={id}
              ref={(el) => { if (el) sectionEls.current.set(id, el); else sectionEls.current.delete(id); }}
              className={idx > 0 ? 'border-t border-white/6' : ''}
              style={{ outline: dragOverId === id ? '1px solid rgba(19,221,209,0.4)' : 'none' }}
            >
              {/* Section header */}
              <div className="sticky top-0 z-[1] flex items-center gap-1.5 px-2 py-1.5 bg-black/20 backdrop-blur-[6px] border-b border-white/6">
                {/* Drag grip — pointer capture keeps move/up on this element even when cursor leaves */}
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
                <button
                  onClick={() => toggleCollapse(id)}
                  className="!p-0 !border-0 w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-white/60 hover:bg-white/8 transition-all flex-shrink-0"
                  style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
                >
                  <ChevronDownIcon className="w-3.5 h-3.5" />
                </button>
                {/* Close */}
                <button
                  onClick={() => closeOne(id)}
                  className="!p-0 !border-0 w-5 h-5 flex items-center justify-center rounded text-white/25 hover:text-white/55 hover:bg-white/8 transition-colors flex-shrink-0"
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Content — CSS Grid collapse avoids fixed max-height sentinel */}
              <div
                className="grid transition-[grid-template-rows,opacity] duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{ gridTemplateRows: isCollapsed ? '0fr' : '1fr', opacity: isCollapsed ? 0 : 1 }}
              >
                <div className="overflow-hidden">
                  <div className="px-4 py-3.5">
                    {getSectionContent(id, is4D)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {activeSections.length === 0 && (
          <div className="p-7 text-center text-xs text-white/20">
            Select a section from the sidebar
          </div>
        )}
      </div>
    </div>
  );
}
