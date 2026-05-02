import {
  DocumentIcon,
  CubeIcon,
  ScissorsIcon,
  PhotoIcon,
  EyeIcon,
  SwatchIcon,
  CalculatorIcon,
  FilmIcon,
  WindowIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { useViewerStore } from '../../store/viewerStore';
import { inject4D, ACCENT_COLOR } from '../../utils/uiLayout';
import type { SectionId } from '../../utils/uiLayout';
import type { LayoutMode } from '../../types/layout';

type TabEntry = { id: SectionId; icon: typeof PhotoIcon; label: string };

const TABS: TabEntry[] = [
  { id: 'file',     icon: DocumentIcon,    label: 'File'     },
  { id: 'volume',   icon: CubeIcon,        label: 'Volume'   },
  { id: 'crop',     icon: ScissorsIcon,    label: 'Crop'     },
  { id: 'slices',   icon: PhotoIcon,       label: 'Slices'   },
  { id: 'display',  icon: EyeIcon,         label: 'Display'  },
  { id: 'transfer', icon: SwatchIcon,      label: 'Transfer' },
  { id: 'measure',  icon: CalculatorIcon,  label: 'Measure'  },
];

const TAB_4D: TabEntry = { id: 'playback', icon: FilmIcon, label: 'Playback' };

type LayoutEntry = { mode: LayoutMode; icon: typeof WindowIcon; label: string };

const LAYOUT_TABS: LayoutEntry[] = [
  { mode: 'single', icon: WindowIcon,       label: 'Single' },
  { mode: 'slices', icon: ViewColumnsIcon,  label: 'Slices' },
  { mode: 'quad',   icon: Squares2X2Icon,   label: 'Quad'   },
];

export function MobileBar() {
  const activeSections = useViewerStore((state) => state.activeSections);
  const setActiveSections = useViewerStore((state) => state.setActiveSections);
  const layoutMode = useViewerStore((state) => state.layoutMode);
  const setLayoutMode = useViewerStore((state) => state.setLayoutMode);
  const volume = useViewerStore((state) => state.volume);
  const is4D = Boolean(volume?.dimensions.t && volume.dimensions.t > 1);

  const tabs = inject4D(TABS, TAB_4D, is4D, 4);

  const activeId = activeSections[0] ?? null;

  const handleSelect = (id: string) => {
    setActiveSections(activeId === id ? [] : [id]);
  };

  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-[60px] bg-black/90 backdrop-blur-[14px] border-t border-white/8 flex z-30 overflow-x-auto"
      style={{ scrollbarWidth: 'none' }}
    >
      {LAYOUT_TABS.map(({ mode, icon: Icon, label }) => {
        const isActive = layoutMode === mode;
        return (
          <button
            key={mode}
            onClick={() => setLayoutMode(mode)}
            className="!p-0 !border-0 flex-shrink-0 w-[60px] flex flex-col items-center justify-center gap-1 relative transition-colors"
          >
            {isActive && (
              <div className="absolute top-0 left-3 right-3 h-0.5 rounded-b" style={{ backgroundColor: ACCENT_COLOR }} />
            )}
            <Icon className="w-5 h-5 transition-colors" style={{ color: isActive ? ACCENT_COLOR : undefined }} />
            <span className={`text-[9px] font-semibold uppercase tracking-wider transition-colors ${isActive ? '' : 'text-white/30'}`} style={{ color: isActive ? ACCENT_COLOR : undefined }}>
              {label}
            </span>
          </button>
        );
      })}
      <div className="flex-shrink-0 w-px bg-white/20 my-3" />
      {tabs.map(({ id, icon: Icon, label }) => {
        const isActive = activeId === id;
        return (
          <button
            key={id}
            onClick={() => handleSelect(id)}
            className="!p-0 !border-0 flex-shrink-0 w-[72px] flex flex-col items-center justify-center gap-1 relative transition-colors"
          >
            {isActive && (
              <div className="absolute top-0 left-4 right-4 h-0.5 rounded-b" style={{ backgroundColor: ACCENT_COLOR }} />
            )}
            <Icon className="w-5 h-5 transition-colors" style={{ color: isActive ? ACCENT_COLOR : undefined }} />
            <span className={`text-[9px] font-semibold uppercase tracking-wider transition-colors ${isActive ? '' : 'text-white/30'}`} style={{ color: isActive ? ACCENT_COLOR : undefined }}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
