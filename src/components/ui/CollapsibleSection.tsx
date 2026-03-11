import { type ReactNode } from 'react';
import { useViewerStore } from '../../store/viewerStore';
import type { LayoutMode } from '../../types/layout';

interface CollapsibleSectionProps {
  id: string
  title: string
  icon?: ReactNode
  defaultExpanded?: boolean
  autoCollapseOn?: LayoutMode[]
  autoExpandOn?: LayoutMode[]
  badge?: string
  className?: string
  children: ReactNode
}

export function CollapsibleSection({
  id,
  title,
  icon,
  badge,
  className,
  children,
}: CollapsibleSectionProps) {
  const isExpanded = useViewerStore((state) => state.controlPanelSections[id as keyof typeof state.controlPanelSections] ?? false);
  const setExpanded = useViewerStore((state) => state.setControlPanelSectionExpanded);

  const handleToggle = () => {
    setExpanded(id, !isExpanded);
  };

  return (
    <div className={`flex flex-col transition-all duration-300 min-w-0 shrink ${className ?? ''}`}>
      <button
        onClick={handleToggle}
        className="flex items-center gap-1.5 !text-sm font-semibold text-white/60 uppercase tracking-wide hover:text-white/90 transition-colors duration-200 cursor-pointer py-1 px-2 rounded whitespace-nowrap"
      >
        {icon && <span className="text-white/50">{icon}</span>}
        <span>{title}</span>
        {badge && (
          <span className="text-[9px] font-normal text-white/50 normal-case">
            ({badge})
          </span>
        )}
        <svg
          className={`w-2.5 h-2.5 text-white/50 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${isExpanded ? 'max-h-[2000px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}
      >
        <div className={`flex flex-col gap-3 ${isExpanded ? 'bg-white/5 rounded-md p-3' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
