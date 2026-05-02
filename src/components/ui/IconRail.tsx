import {
  DocumentIcon,
  CubeIcon,
  ScissorsIcon,
  PhotoIcon,
  EyeIcon,
  SwatchIcon,
  CalculatorIcon,
  FilmIcon,
  QuestionMarkCircleIcon,
  WindowIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { useViewerStore } from '../../store/viewerStore';
import type { LayoutMode } from '../../types/layout';
import { inject4D, ACCENT_COLOR } from '../../utils/uiLayout';
import type { SectionId } from '../../utils/uiLayout';

type SectionEntry = { id: SectionId; icon: typeof DocumentIcon; label: string };

const SECTIONS: SectionEntry[] = [
  { id: 'file',     icon: DocumentIcon,          label: 'File'        },
  { id: 'volume',   icon: CubeIcon,              label: 'Volume'      },
  { id: 'crop',     icon: ScissorsIcon,          label: 'Crop'        },
  { id: 'slices',   icon: PhotoIcon,             label: 'Slices'      },
  { id: 'display',  icon: EyeIcon,               label: 'Display'     },
  { id: 'transfer', icon: SwatchIcon,            label: 'Transfer Fn' },
  { id: 'measure',  icon: CalculatorIcon,        label: 'Measure'     },
];

const SECTION_4D: SectionEntry = { id: 'playback', icon: FilmIcon, label: 'Playback' };

const LAYOUT_MODES: { id: LayoutMode; icon: typeof WindowIcon; label: string }[] = [
  { id: 'single', icon: WindowIcon,      label: 'Single' },
  { id: 'slices', icon: ViewColumnsIcon, label: 'Slices' },
  { id: 'quad',   icon: Squares2X2Icon,  label: 'Quad'   },
];

export function IconRail() {
  const activeSections = useViewerStore((state) => state.activeSections);
  const volume  = useViewerStore((state) => state.volume);
  const is4D    = Boolean(volume?.dimensions.t && volume.dimensions.t > 1);
  const toggleSection  = useViewerStore((state) => state.toggleSection);
  const layoutMode     = useViewerStore((state) => state.layoutMode);
  const setLayoutMode  = useViewerStore((state) => state.setLayoutMode);
  const setHelpModalOpen = useViewerStore((state) => state.setHelpModalOpen);

  const sections = inject4D(SECTIONS, SECTION_4D, is4D, 4);

  return (
    <div className="w-12 flex-shrink-0 flex flex-col bg-black/30 border-r border-white/8 z-10 select-none">
      {/* Logo */}
      <div className="flex items-center justify-center py-3 border-b border-white/8">
        <img src="/logo.svg" alt="Flux" draggable={false} className="w-6 h-6" />
      </div>

      {/* Layout modes */}
      <div className="flex flex-col border-b border-white/8 py-1">
        {LAYOUT_MODES.map(({ id, icon: Icon, label }) => {
          const isActive = layoutMode === id;
          return (
            <button
              key={id}
              onClick={() => setLayoutMode(id)}
              title={label}
              className={`!p-0 !border-0 w-full h-9 flex items-center justify-center transition-colors ${
                isActive
                  ? 'text-white/85 bg-white/10'
                  : 'text-white/35 hover:text-white/60 hover:bg-white/5'
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
            </button>
          );
        })}
      </div>

      {/* Section toggles */}
      <div className="flex flex-col flex-1 py-1 overflow-y-auto overflow-x-hidden">
        {sections.map(({ id, icon: Icon, label }) => {
          const isActive = activeSections.includes(id);
          return (
            <button
              key={id}
              onClick={() => toggleSection(id)}
              title={label}
              style={{ padding: '11px 0' }}
              className={`relative w-full flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive
                  ? 'text-[var(--accent)] bg-[rgba(19,221,209,0.09)]'
                  : 'text-white/40 hover:text-white/65 hover:bg-white/5'
              }`}
            >
              {/* Active accent bar */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r" style={{ backgroundColor: ACCENT_COLOR }} />
              )}
              <Icon className="w-[17px] h-[17px] flex-shrink-0" />
              <span className="text-[7px] font-semibold uppercase tracking-wide leading-none">
                {label.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Help */}
      <div className="border-t border-white/8 py-1">
        <button
          onClick={() => setHelpModalOpen(true)}
          title="Help"
          className="!p-0 !border-0 w-full flex items-center justify-center py-2.5 text-white/35 hover:text-white/60 hover:bg-white/5 transition-colors"
        >
          <QuestionMarkCircleIcon className="w-[17px] h-[17px]" />
        </button>
      </div>
    </div>
  );
}
