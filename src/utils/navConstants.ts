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
import type { SectionId } from './uiLayout';
import type { LayoutMode } from '../types/layout';

export type NavSection = { id: SectionId; icon: React.ComponentType<{ className?: string }>; label: string };
export type NavLayout  = { id: LayoutMode; icon: React.ComponentType<{ className?: string }>; label: string };

export const NAV_SECTIONS: NavSection[] = [
  { id: 'file',     icon: DocumentIcon,   label: 'File'        },
  { id: 'volume',   icon: CubeIcon,       label: 'Volume'      },
  { id: 'crop',     icon: ScissorsIcon,   label: 'Crop'        },
  { id: 'slices',   icon: PhotoIcon,      label: 'Slices'      },
  { id: 'display',  icon: EyeIcon,        label: 'Display'     },
  { id: 'transfer', icon: SwatchIcon,     label: 'Transfer Fn' },
  { id: 'measure',  icon: CalculatorIcon, label: 'Measure'     },
];

export const NAV_SECTION_4D: NavSection = { id: 'playback', icon: FilmIcon, label: 'Playback' };

export const NAV_LAYOUTS: NavLayout[] = [
  { id: 'single', icon: WindowIcon,      label: 'Single' },
  { id: 'slices', icon: ViewColumnsIcon, label: 'Slices' },
  { id: 'quad',   icon: Squares2X2Icon,  label: 'Quad'   },
];
