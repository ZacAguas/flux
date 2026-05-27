/**
 * Help Modal
 *
 * Tabbed reference guide. Uses a sidebar on desktop and a scrollable
 * horizontal tab bar on mobile.
 */

import {
  CalculatorIcon,
  ChartBarSquareIcon,
  CircleStackIcon,
  CommandLineIcon,
  CubeIcon,
  CursorArrowRaysIcon,
  FilmIcon,
  PhotoIcon,
  PresentationChartLineIcon,
  QuestionMarkCircleIcon,
  RocketLaunchIcon,
  ScissorsIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { Button, Kbd } from '@heroui/react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { AppModal, ModalHeader, ModalIcon, ModalTitle, ModalFooter } from './AppModal';
import { useBreakpoint } from '../../utils/uiLayout';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const TABS: Tab[] = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    icon: <RocketLaunchIcon className="w-4 h-4" />,
    content: (
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-black dark:text-white">Getting Started</h3>
        <p className="text-sm text-black/60 dark:text-white/70">
          Flux is a 4D medical imaging viewer for NIfTI files. It renders volumetric data in 3D using GPU-accelerated raymarching and provides 2D slice views for detailed inspection.
        </p>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-black/80 dark:text-white/90">Importing a file</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-black/60 dark:text-white/70">
            <li>Drag a <code className="bg-black/8 dark:bg-white/10 px-1 rounded text-xs">.nii</code> or <code className="bg-black/8 dark:bg-white/10 px-1 rounded text-xs">.nii.gz</code> file anywhere on the page, or click the import zone on the home screen to browse.</li>
            <li>The volume will be parsed and loaded into the 3D viewer automatically.</li>
            <li>For 4D volumes (e.g. dynamic MRIs, fMRIs) time controls will appear in the Playback section.</li>
          </ol>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-black/80 dark:text-white/90">First steps after loading</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-black/60 dark:text-white/70">
            <li>Use the Layout buttons in the control panel to switch between Single, Slices, and Quad views.</li>
            <li>Open the Transfer Function section to adjust how intensity values map to color and opacity.</li>
            <li>Use the Volume Rendering section to change quality and step size.</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'navigation',
    label: 'Navigation',
    icon: <CursorArrowRaysIcon className="w-4 h-4" />,
    content: (
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-black dark:text-white">Navigation</h3>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-black/80 dark:text-white/90">3D Volume View</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-black/60 dark:text-white/70">
            <li><span className="text-black/80 dark:text-white/90">Rotate:</span> Left-click and drag</li>
            <li><span className="text-black/80 dark:text-white/90">Pan:</span> Right-click and drag, or <Kbd className="text-[10px] text-black/60 dark:text-white/70 bg-black/5 dark:bg-white/5 backdrop-blur-sm rounded-md px-2 py-1"><Kbd.Abbr keyValue="shift" /><Kbd.Content>Click</Kbd.Content></Kbd> and drag</li>
            <li><span className="text-black/80 dark:text-white/90">Zoom:</span> Scroll wheel</li>
          </ul>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-black/80 dark:text-white/90">Slice Views</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-black/60 dark:text-white/70">
            <li><span className="text-black/80 dark:text-white/90">Move crosshair:</span> Left-click and drag</li>
            <li><span className="text-black/80 dark:text-white/90">Pan view:</span> Middle-click drag, or <Kbd className="text-[10px] text-black/60 dark:text-white/70 bg-black/5 dark:bg-white/5 backdrop-blur-sm rounded-md px-2 py-1"><Kbd.Abbr keyValue="ctrl" /><Kbd.Content>Click</Kbd.Content></Kbd> and drag</li>
            <li><span className="text-black/80 dark:text-white/90">Zoom:</span> Scroll wheel</li>
            <li><span className="text-black/80 dark:text-white/90">Window / Level:</span> Right-click and drag</li>
          </ul>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-black/80 dark:text-white/90">Control Panel</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-black/60 dark:text-white/70">
            <li>The panel slides open when you hover over the top edge of the screen.</li>
            <li>Click the pin icon to keep it open permanently.</li>
            <li>Click the pin icon again (shown as an up arrow) to unpin and let it auto-hide.</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'layouts',
    label: 'Layouts',
    icon: <Squares2X2Icon className="w-4 h-4" />,
    content: (
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-black dark:text-white">Layouts</h3>
        <p className="text-sm text-black/60 dark:text-white/70">
          Use the Layout buttons in the control panel to switch between three viewing modes.
        </p>
        <div className="space-y-3">
          <div className="p-3 bg-black/5 dark:bg-white/5 rounded border border-black/10 dark:border-white/10">
            <h4 className="text-sm font-medium text-black/80 dark:text-white/90 mb-1">Single</h4>
            <p className="text-xs text-black/55 dark:text-white/60">Full-screen 3D volume rendering. Best for overall structural examination and transfer function tuning.</p>
          </div>
          <div className="p-3 bg-black/5 dark:bg-white/5 rounded border border-black/10 dark:border-white/10">
            <h4 className="text-sm font-medium text-black/80 dark:text-white/90 mb-1">Slices</h4>
            <p className="text-xs text-black/55 dark:text-white/60">Three orthogonal slice views (axial, coronal, sagittal) side by side. Best for precise anatomical navigation and measurement.</p>
          </div>
          <div className="p-3 bg-black/5 dark:bg-white/5 rounded border border-black/10 dark:border-white/10">
            <h4 className="text-sm font-medium text-black/80 dark:text-white/90 mb-1">Quad</h4>
            <p className="text-xs text-black/55 dark:text-white/60">All three slice views plus the 3D volume rendering in a four-panel grid. Best for correlating 2D slices with the 3D structure simultaneously.</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'slice-views',
    label: 'Slice Views',
    icon: <PhotoIcon className="w-4 h-4" />,
    content: (
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-black dark:text-white">Slice Views</h3>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-black/80 dark:text-white/90">Slice Navigation</h4>
          <p className="text-sm text-black/60 dark:text-white/70">
            Use the Slice Navigation section in the control panel to set the axial, coronal, and sagittal slice positions precisely. You can also scroll over each slice panel directly.
          </p>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-black/80 dark:text-white/90">Window / Level (Contrast)</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-black/60 dark:text-white/70">
            <li><span className="text-black/80 dark:text-white/90">Window:</span> Controls the range of intensities displayed. A narrower window increases contrast.</li>
            <li><span className="text-black/80 dark:text-white/90">Level:</span> Sets the center intensity value. Adjusting this shifts the displayed range up or down.</li>
          </ul>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-black/80 dark:text-white/90">Crosshairs</h4>
          <p className="text-sm text-black/60 dark:text-white/70">
            Toggle crosshairs from the Display section. Crosshairs show the intersection point across all three slice views, helping you correlate positions.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'volume-rendering',
    label: 'Volume Rendering',
    icon: <CubeIcon className="w-4 h-4" />,
    content: (
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-black dark:text-white">Volume Rendering</h3>
        <p className="text-sm text-black/60 dark:text-white/70">
          Volume rendering uses GPU-accelerated raymarching to visualize the full 3D dataset.
        </p>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-black/80 dark:text-white/90">Quality Presets</h4>
          <p className="text-sm text-black/60 dark:text-white/70">
            Choose from Low, Medium, High, or Ultra quality. Higher quality uses more ray samples per pixel for smoother rendering but is more demanding on the GPU.
          </p>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-black/80 dark:text-white/90">Step Size</h4>
          <p className="text-sm text-black/60 dark:text-white/70">
            Controls how far apart samples are taken along each ray. Smaller step sizes produce more accurate results but increase rendering cost.
          </p>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-black/80 dark:text-white/90">Shading</h4>
          <p className="text-sm text-black/60 dark:text-white/70">
            Toggles whether or not volume shading is applied (Blinn-Phong). NOTE: requires WebGPU.
          </p>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-black/80 dark:text-white/90">Threshold</h4>
          <p className="text-sm text-black/60 dark:text-white/70">
            Sets the minimum opacity threshold for early ray termination. Rays stop accumulating once this threshold is reached, improving performance.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'transfer-function',
    label: 'Transfer Function',
    icon: <ChartBarSquareIcon className="w-4 h-4" />,
    content: (
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-black dark:text-white">Transfer Function</h3>
        <p className="text-sm text-black/60 dark:text-white/70">
          The transfer function maps voxel intensity values to colors and opacity. It controls which tissues are visible and how they are colored in the 3D view.
        </p>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-black/80 dark:text-white/90">Presets</h4>
          <p className="text-sm text-black/60 dark:text-white/70">
            Select from built-in presets such as CT-Bone, CT-AAA, and MRI-Default.
          </p>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-black/80 dark:text-white/90">Control Points</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-black/60 dark:text-white/70">
            <li><span className="text-black/80 dark:text-white/90">Add a point:</span> Double-click on an empty area of the editor.</li>
            <li><span className="text-black/80 dark:text-white/90">Move a point:</span> Click and drag an existing control point.</li>
            <li><span className="text-black/80 dark:text-white/90">Change color:</span> Click the color swatch on a control point.</li>
            <li><span className="text-black/80 dark:text-white/90">Remove a point:</span> <Kbd className="text-[10px] text-black/60 dark:text-white/70 bg-black/5 dark:bg-white/5 backdrop-blur-sm rounded-md px-2 py-1"><Kbd.Abbr keyValue="alt" /></Kbd> + click (minimum 2 points required).</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'clipping-planes',
    label: 'Clipping Planes',
    icon: <ScissorsIcon className="w-4 h-4" />,
    content: (
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-black dark:text-white">Clipping Planes</h3>
        <p className="text-sm text-black/60 dark:text-white/70">
          Clipping planes cut away portions of the volume to reveal internal structures. Up to three axis-aligned planes can be active simultaneously.
        </p>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-black/80 dark:text-white/90">Enabling a Plane</h4>
          <p className="text-sm text-black/60 dark:text-white/70">
            Toggle the checkbox next to the X, Y, or Z axis. Once enabled, use the position slider to move the cut.
          </p>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-black/80 dark:text-white/90">Invert</h4>
          <p className="text-sm text-black/60 dark:text-white/70">
            Flips which side of the plane is clipped.
          </p>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-black/80 dark:text-white/90">Gizmos</h4>
          <p className="text-sm text-black/60 dark:text-white/70">
            Enable gizmos to display interactive handles in the 3D view.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'measurements',
    label: 'Measurements',
    icon: <CalculatorIcon className="w-4 h-4" />,
    content: (
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-black dark:text-white">Measurements</h3>
        <p className="text-sm text-black/60 dark:text-white/70">
          Place distance and angle markers directly on slice views.
        </p>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-black/80 dark:text-white/90">Distance Tool</h4>
          <p className="text-sm text-black/60 dark:text-white/70">
            Press <Kbd className="text-[10px] text-black/60 dark:text-white/70 bg-black/5 dark:bg-white/5 backdrop-blur-sm rounded-md px-2 py-1"><Kbd.Content>D</Kbd.Content></Kbd> or click Distance. Click two points to measure in millimetres.
          </p>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-black/80 dark:text-white/90">Angle Tool</h4>
          <p className="text-sm text-black/60 dark:text-white/70">
            Press <Kbd className="text-[10px] text-black/60 dark:text-white/70 bg-black/5 dark:bg-white/5 backdrop-blur-sm rounded-md px-2 py-1"><Kbd.Content>A</Kbd.Content></Kbd> or click Angle. Click three points to measure degrees.
          </p>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-black/80 dark:text-white/90">Managing Measurements</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-black/60 dark:text-white/70">
            <li>Press <Kbd className="text-[10px] text-black/60 dark:text-white/70 bg-black/5 dark:bg-white/5 backdrop-blur-sm rounded-md px-2 py-1"><Kbd.Content>Esc</Kbd.Content></Kbd> to cancel in-progress.</li>
            <li>Select and press <Kbd className="text-[10px] text-black/60 dark:text-white/70 bg-black/5 dark:bg-white/5 backdrop-blur-sm rounded-md px-2 py-1"><Kbd.Content>Delete</Kbd.Content></Kbd> to remove.</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'tic',
    label: 'Time Intensity Curves',
    icon: <PresentationChartLineIcon className="w-4 h-4" />,
    content: (
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-black dark:text-white">Time Intensity Curves (4D)</h3>
        <p className="text-sm text-black/60 dark:text-white/70">
          Plots mean voxel intensity inside a circular ROI across every time step.
          Available only when a 4D volume is loaded.
        </p>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-black/80 dark:text-white/90">Placing a ROI</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-black/60 dark:text-white/70">
            <li>Open the Time Intensity Curves section and click Place ROI.</li>
            <li>Click and drag on any slice view to draw a circular ROI.</li>
            <li>Release to confirm — the curve appears immediately.</li>
          </ol>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-black/80 dark:text-white/90">Chart axes</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-black/60 dark:text-white/70">
            <li><span className="text-black/80 dark:text-white/90">X:</span> Time in seconds (or step index if TR is absent).</li>
            <li><span className="text-black/80 dark:text-white/90">Y:</span> Raw mean voxel intensity inside the ROI.</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'playback',
    label: 'Playback (4D)',
    icon: <FilmIcon className="w-4 h-4" />,
    content: (
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-black dark:text-white">Playback (4D)</h3>
        <p className="text-sm text-black/60 dark:text-white/70">
          Appears automatically when a 4D NIfTI file is loaded.
        </p>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-black/80 dark:text-white/90">Controls</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-black/60 dark:text-white/70">
            <li><span className="text-black/80 dark:text-white/90">Play / Pause:</span> Start or stop automatic time step progression.</li>
            <li><span className="text-black/80 dark:text-white/90">Loop:</span> Restart from the first frame after the last.</li>
            <li><span className="text-black/80 dark:text-white/90">FPS:</span> Set the playback speed in frames per second.</li>
            <li><span className="text-black/80 dark:text-white/90">Time Slider:</span> Scrub to any specific time step.</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'sessions',
    label: 'Sessions',
    icon: <CircleStackIcon className="w-4 h-4" />,
    content: (
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-black dark:text-white">Sessions</h3>
        <p className="text-sm text-black/60 dark:text-white/70">
          Save and restore the complete viewer state: volume, camera, transfer function, clipping planes, measurements, and display settings.
        </p>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-black/80 dark:text-white/90">Saving</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-black/60 dark:text-white/70">
            <li><span className="text-black/80 dark:text-white/90">Save</span> (<Kbd className="text-[10px] text-black/60 dark:text-white/70 bg-black/5 dark:bg-white/5 backdrop-blur-sm rounded-md px-2 py-1"><Kbd.Abbr keyValue="command" /><Kbd.Content>S</Kbd.Content></Kbd>): Overwrite or name on first save.</li>
            <li><span className="text-black/80 dark:text-white/90">Save As</span> (<Kbd className="text-[10px] text-black/60 dark:text-white/70 bg-black/5 dark:bg-white/5 backdrop-blur-sm rounded-md px-2 py-1"><Kbd.Abbr keyValue="shift" /><Kbd.Abbr keyValue="command" /><Kbd.Content>S</Kbd.Content></Kbd>): Save to a new named session.</li>
          </ul>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-black/80 dark:text-white/90">Import / Export</h4>
          <p className="text-sm text-black/60 dark:text-white/70">
            Export to a portable <code className="bg-black/8 dark:bg-white/10 px-1 rounded text-xs">.flux</code> file. Import to restore on any machine.
          </p>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-black/80 dark:text-white/90">Auto-Save</h4>
          <p className="text-sm text-black/60 dark:text-white/70">
            Flux auto-saves periodically. If closed unexpectedly, you will be offered a restore prompt on next launch.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'shortcuts',
    label: 'Keyboard Shortcuts',
    icon: <CommandLineIcon className="w-4 h-4" />,
    content: (
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-black dark:text-white">Keyboard Shortcuts</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 dark:border-white/10">
              <th className="text-left py-2 pr-4 text-xs font-semibold text-black/50 dark:text-white/50 uppercase tracking-wide">Action</th>
              <th className="text-left py-2 text-xs font-semibold text-black/50 dark:text-white/50 uppercase tracking-wide">Shortcut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/5">
            {(
              [
                ['New Volume', <Kbd className="text-[10px] text-black/60 dark:text-white/70 bg-black/5 dark:bg-white/5 backdrop-blur-sm rounded-md px-2 py-1"><Kbd.Abbr keyValue="command" /><Kbd.Content>N</Kbd.Content></Kbd>],
                ['Save Session', <Kbd className="text-[10px] text-black/60 dark:text-white/70 bg-black/5 dark:bg-white/5 backdrop-blur-sm rounded-md px-2 py-1"><Kbd.Abbr keyValue="command" /><Kbd.Content>S</Kbd.Content></Kbd>],
                ['Save Session As', <Kbd className="text-[10px] text-black/60 dark:text-white/70 bg-black/5 dark:bg-white/5 backdrop-blur-sm rounded-md px-2 py-1"><Kbd.Abbr keyValue="shift" /><Kbd.Abbr keyValue="command" /><Kbd.Content>S</Kbd.Content></Kbd>],
                ['Load Session', <Kbd className="text-[10px] text-black/60 dark:text-white/70 bg-black/5 dark:bg-white/5 backdrop-blur-sm rounded-md px-2 py-1"><Kbd.Abbr keyValue="command" /><Kbd.Content>O</Kbd.Content></Kbd>],
                ['Distance Measurement', <Kbd className="text-[10px] text-black/60 dark:text-white/70 bg-black/5 dark:bg-white/5 backdrop-blur-sm rounded-md px-2 py-1"><Kbd.Content>D</Kbd.Content></Kbd>],
                ['Angle Measurement', <Kbd className="text-[10px] text-black/60 dark:text-white/70 bg-black/5 dark:bg-white/5 backdrop-blur-sm rounded-md px-2 py-1"><Kbd.Content>A</Kbd.Content></Kbd>],
                ['Cancel Measurement', <Kbd className="text-[10px] text-black/60 dark:text-white/70 bg-black/5 dark:bg-white/5 backdrop-blur-sm rounded-md px-2 py-1"><Kbd.Content>Esc</Kbd.Content></Kbd>],
                ['Delete Measurement', <Kbd className="text-[10px] text-black/60 dark:text-white/70 bg-black/5 dark:bg-white/5 backdrop-blur-sm rounded-md px-2 py-1"><Kbd.Content>Delete</Kbd.Content></Kbd>],
              ] as [string, React.ReactNode][]
            ).map(([action, shortcut]) => (
              <tr key={action}>
                <td className="py-2 pr-4 text-black/60 dark:text-white/70">{action}</td>
                <td className="py-2">{shortcut}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
];

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [activeTabId, setActiveTabId] = useState(TABS[0].id);
  const [prevTabId, setPrevTabId] = useState(TABS[0].id);
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';

  const activeTab = TABS.find((t) => t.id === activeTabId) ?? TABS[0];
  const activeIdx = TABS.findIndex((t) => t.id === activeTabId);
  const prevIdx = TABS.findIndex((t) => t.id === prevTabId);
  const direction = activeIdx >= prevIdx ? 1 : -1;

  const switchTab = (id: string) => {
    setPrevTabId(activeTabId);
    setActiveTabId(id);
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-3xl"
      heightClass={isMobile ? undefined : 'h-[80vh]'}
      showClose
    >
      <ModalHeader>
        <ModalIcon className="bg-black/8 dark:bg-white/10 text-black/60 dark:text-white/70">
          <QuestionMarkCircleIcon className="size-4" />
        </ModalIcon>
        <ModalTitle>Help</ModalTitle>
      </ModalHeader>

      {/* Body — sidebar layout on desktop, stacked on mobile */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {isMobile ? (
          /* Mobile: horizontal scrolling tab strip */
          <div className="flex flex-col min-h-0 w-full">
            <div
              className="flex overflow-x-auto border-b border-black/10 dark:border-white/10 shrink-0"
              style={{ scrollbarWidth: 'none' }}
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => switchTab(tab.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-xs whitespace-nowrap border-b-2 transition-colors ${
                    activeTabId === tab.id
                      ? 'border-[#13ddd1] text-black dark:text-white'
                      : 'border-transparent text-black/45 dark:text-white/45 hover:text-black/70 dark:hover:text-white/70'
                  }`}
                >
                  <span className="shrink-0">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-hidden relative">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={activeTabId}
                  custom={direction}
                  variants={{
                    enter: (d: number) => ({ x: d * 32, opacity: 0 }),
                    center: { x: 0, opacity: 1 },
                    exit: (d: number) => ({ x: d * -24, opacity: 0 }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 480, damping: 42 }}
                  className="absolute inset-0 overflow-y-auto px-5 py-5"
                  style={{ scrollbarWidth: 'thin' }}
                >
                  {activeTab.content}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        ) : (
          /* Desktop: sidebar + content */
          <>
            <nav className="w-48 shrink-0 border-r border-black/10 dark:border-white/10 py-2 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {TABS.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => switchTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2 text-left text-xs transition-colors ${
                    activeTabId === tab.id
                      ? 'bg-black/8 dark:bg-white/10 text-black dark:text-white'
                      : 'text-black/50 dark:text-white/50 hover:text-black/80 dark:hover:text-white/80 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="shrink-0">{tab.icon}</span>
                  <span>{tab.label}</span>
                </motion.button>
              ))}
            </nav>

            <div className="flex-1 overflow-hidden relative">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={activeTabId}
                  custom={direction}
                  variants={{
                    enter: (d: number) => ({ y: d * 12, opacity: 0 }),
                    center: { y: 0, opacity: 1 },
                    exit: (d: number) => ({ y: d * -8, opacity: 0 }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  className="absolute inset-0 overflow-y-auto px-6 py-5"
                  style={{ scrollbarWidth: 'thin' }}
                >
                  {activeTab.content}
                </motion.div>
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      <ModalFooter>
        <Button size="sm" variant="secondary" onPress={onClose}
          className="!bg-black/8 dark:!bg-white/10 !border-black/15 dark:!border-white/20 !text-black dark:!text-white text-xs">
          Close
        </Button>
      </ModalFooter>
    </AppModal>
  );
}
