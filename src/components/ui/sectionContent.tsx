import { FilePanel } from './FilePanel';
import { RenderingControls } from './RenderingControls';
import { ClippingPlaneControls } from './ClippingPlaneControls';
import { SliceControls } from './SliceControls';
import { WindowLevelControls } from './WindowLevelControls';
import { TimeStepControls } from './TimeStepControls';
import { TimePlaybackControls } from './TimePlaybackControls';
import { ViewOptionsControls } from './ViewOptionsControls';
import { TransferFunctionEditor } from './TransferFunctionEditor';
import { MeasurementControls } from './MeasurementControls';
import { TICControls } from './TICControls';

export const SECTION_LABELS: Record<string, string> = {
  file:     'Session',
  volume:   'Volume Rendering',
  crop:     'Crop Box',
  slices:   'Slice Navigation',
  playback: 'Playback',
  display:  'Display',
  transfer: 'Transfer Function',
  measure:  'Measurements',
};

export function getSectionLabel(id: string): string {
  return SECTION_LABELS[id] ?? id;
}

export function getSectionContent(id: string, is4D: boolean) {
  switch (id) {
    case 'file':     return <FilePanel />;
    case 'volume':   return <RenderingControls />;
    case 'crop':     return <ClippingPlaneControls />;
    case 'slices':   return (
      <div className="flex flex-col gap-3">
        <SliceControls />
        <hr className="border-t border-black/8 dark:border-white/8" />
        <WindowLevelControls />
      </div>
    );
    case 'playback': return (
      <div className="flex flex-col gap-3">
        <TimeStepControls />
        <TimePlaybackControls />
        {is4D && <><hr className="border-t border-black/8 dark:border-white/8" /><TICControls /></>}
      </div>
    );
    case 'display':  return <ViewOptionsControls />;
    case 'transfer': return <TransferFunctionEditor />;
    case 'measure':  return <MeasurementControls />;
    default:         return null;
  }
}
