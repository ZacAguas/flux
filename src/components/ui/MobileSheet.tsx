import { useRef } from 'react';
import { useViewerStore } from '../../store/viewerStore';
import { getSectionContent, getSectionLabel } from './sectionContent';

const DISMISS_THRESHOLD_PX = 80;

export function MobileSheet() {
  const activeSections = useViewerStore((state) => state.activeSections);
  const setActiveSections = useViewerStore((state) => state.setActiveSections);
  const volume = useViewerStore((state) => state.volume);
  const is4D = Boolean(volume?.dimensions.t && volume.dimensions.t > 1);

  const activeId = activeSections[0] ?? null;
  const isOpen = activeId !== null;
  const label = activeId ? getSectionLabel(activeId) : '';

  // Drag-to-dismiss via pointer capture
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const dragOffset = useRef(0);

  const onDragPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartY.current = e.clientY;
    dragOffset.current = 0;
    if (sheetRef.current) sheetRef.current.style.transition = 'none';
  };

  const onDragPointerMove = (e: React.PointerEvent) => {
    if (dragStartY.current === null || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const delta = Math.max(0, e.clientY - dragStartY.current);
    dragOffset.current = delta;
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${delta}px)`;
  };

  const onDragPointerUp = (e: React.PointerEvent) => {
    if (dragStartY.current === null) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragStartY.current = null;
    if (sheetRef.current) sheetRef.current.style.transition = '';
    if (dragOffset.current > DISMISS_THRESHOLD_PX) {
      setActiveSections([]);
    } else {
      if (sheetRef.current) sheetRef.current.style.transform = 'translateY(0)';
    }
    dragOffset.current = 0;
  };

  return (
    <div
      ref={sheetRef}
      className="absolute left-0 right-0 bottom-[60px] bg-neutral-900 border-t border-white/10 z-20 flex flex-col transition-transform duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
      style={{
        height: '64vh',
        borderRadius: '14px 14px 0 0',
        transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
      }}
    >
      {/* Drag handle */}
      <div
        className="flex justify-center pt-3 pb-2 flex-shrink-0 cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
        onPointerDown={onDragPointerDown}
        onPointerMove={onDragPointerMove}
        onPointerUp={onDragPointerUp}
        onPointerCancel={onDragPointerUp}
      >
        <div className="w-8 h-1 rounded-full bg-white/20" />
      </div>

      {/* Header */}
      <div className="flex items-center px-4 py-2 border-b border-white/8 flex-shrink-0">
        <span className="text-sm font-semibold text-white/90">{label}</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ scrollbarWidth: 'thin' }}>
        {activeId && getSectionContent(activeId, is4D)}
      </div>
    </div>
  );
}
