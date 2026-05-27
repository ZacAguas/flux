/**
 * MeasurementControls Component
 *
 * UI controls for measurement tools including:
 * - Tool selection buttons (distance, angle)
 * - Measurement visibility toggle
 * - List of measurements with delete option
 */

import type { JSX } from 'react';
import { Button, Checkbox, Label } from '@heroui/react';
import { useViewerStore } from '../../store/viewerStore';
import { formatDistance, formatAngle } from '../../utils/measurementUtils';
import type { MeasurementTool, Measurement, DistanceMeasurement as DistanceMeasurementType, AngleMeasurement as AngleMeasurementType } from '../../types/measurement';

const DistanceIcon = (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" />
    <circle cx="4" cy="12" r="2" fill="currentColor" />
    <circle cx="20" cy="12" r="2" fill="currentColor" />
  </svg>
);

const AngleIcon = (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <path d="M6 18 L12 6 L18 18" stroke="currentColor" strokeWidth="2" fill="none" />
    <circle cx="6" cy="18" r="2" fill="currentColor" />
    <circle cx="12" cy="6" r="2" fill="currentColor" />
    <circle cx="18" cy="18" r="2" fill="currentColor" />
  </svg>
);

interface ToolButtonProps {
  tool: MeasurementTool;
  label: string;
  icon: JSX.Element;
  activeTool: MeasurementTool;
  onSelect: (tool: MeasurementTool) => void;
}

function ToolButton({ tool, label, icon, activeTool, onSelect }: ToolButtonProps) {
  const isActive = activeTool === tool;

  return (
    <Button
      size="sm"
      variant={isActive ? 'primary' : 'secondary'}
      onPress={() => onSelect(isActive ? 'none' : tool)}
      className={`!px-3 !py-1.5 ${isActive ? '!ring-2 !ring-white/30' : ''}`}
    >
      {icon}
      <span className="text-xs ml-1">{label}</span>
    </Button>
  );
}

interface MeasurementListItemProps {
  measurement: Measurement;
  isSelected: boolean;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
}

function MeasurementListItem({ measurement, isSelected, onSelect, onDelete }: MeasurementListItemProps) {
  let valueText = '';
  let icon: JSX.Element;

  if (measurement.type === 'distance') {
    const dm = measurement as DistanceMeasurementType;
    icon = DistanceIcon;
    valueText = dm.distance !== undefined ? formatDistance(dm.distance) : 'Incomplete';
  } else {
    const am = measurement as AngleMeasurementType;
    icon = AngleIcon;
    valueText = am.angle !== undefined ? formatAngle(am.angle) : 'Incomplete';
  }

  const orientationLabel = measurement.orientation.charAt(0).toUpperCase();

  return (
    <div
      className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition-colors ${isSelected ? 'bg-black/12 dark:bg-white/20' : 'hover:bg-black/8 dark:hover:bg-white/10'
        }`}
      onClick={() => onSelect(isSelected ? null : measurement.id)}
    >
      <div className="flex items-center gap-2 text-xs text-black/75 dark:text-white/80 min-w-0 overflow-hidden">
        <span
          className="w-3 h-3 rounded-sm flex-shrink-0"
          style={{ backgroundColor: measurement.color }}
        />
        {icon}
        <span className="truncate">{valueText}</span>
        <span className="text-black/40 dark:text-white/40 shrink-0">({orientationLabel}:{measurement.sliceIndex})</span>
      </div>
      <div>
        <Button
          size="sm"
          variant="secondary"
          className="!px-2 !py-1 !min-w-6 !h-6 !text-[10px] text-black/55 dark:text-white/60 hover:text-red-400"
          onPress={() => onDelete(measurement.id)}
        >
          X
        </Button>
      </div>
    </div>
  );
}

export function MeasurementControls() {
  const activeTool = useViewerStore((state) => state.activeTool);
  const setActiveTool = useViewerStore((state) => state.setActiveTool);
  const measurements = useViewerStore((state) => state.measurements);
  const showMeasurements = useViewerStore((state) => state.showMeasurements);
  const setShowMeasurements = useViewerStore((state) => state.setShowMeasurements);
  const selectedMeasurementId = useViewerStore((state) => state.selectedMeasurementId);
  const setSelectedMeasurement = useViewerStore((state) => state.setSelectedMeasurement);
  const deleteMeasurement = useViewerStore((state) => state.deleteMeasurement);
  const clearAllMeasurements = useViewerStore((state) => state.clearAllMeasurements);

  // Filter to only show complete measurements in the list
  const completeMeasurements = measurements.filter((m) => m.status === 'complete');

  return (
    <div className="flex flex-col gap-3">
      {/* Tool Selection */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-black/55 dark:text-white/60">Tools</span>
        <div className="flex gap-2">
          <ToolButton
            tool="distance"
            label="Distance"
            icon={DistanceIcon}
            activeTool={activeTool}
            onSelect={setActiveTool}
          />
          <ToolButton
            tool="angle"
            label="Angle"
            icon={AngleIcon}
            activeTool={activeTool}
            onSelect={setActiveTool}
          />
        </div>
        {activeTool !== 'none' && (
          <p className="text-[10px] text-black/40 dark:text-white/40 italic text-wrap break-words">
            {activeTool === 'distance'
              ? 'Click two points to measure distance'
              : 'Click three points to measure angle'}
          </p>
        )}
      </div>

      {/* Visibility Toggle */}
      <div className="flex items-center gap-2">
        <Checkbox
          isSelected={showMeasurements}
          onChange={(isSelected: boolean) => setShowMeasurements(isSelected)}
        >
          <Checkbox.Control className="backdrop-blur-sm">
            <Checkbox.Indicator />
          </Checkbox.Control>
          <Checkbox.Content>
            <Label className="text-black/75 dark:text-white/80 text-xs font-medium">Show Measurements</Label>
          </Checkbox.Content>
        </Checkbox>
      </div>

      {/* Measurement List */}
      {completeMeasurements.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-black/55 dark:text-white/60">
              Measurements ({completeMeasurements.length})
            </span>
            <Button
              size="sm"
              variant="secondary"
              onPress={clearAllMeasurements}
              className="!px-2 !py-0.5 !text-[10px] text-black/55 dark:text-white/60 hover:text-red-400"
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
            {completeMeasurements.map((measurement) => (
              <MeasurementListItem
                key={measurement.id}
                measurement={measurement}
                isSelected={measurement.id === selectedMeasurementId}
                onSelect={setSelectedMeasurement}
                onDelete={deleteMeasurement}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {completeMeasurements.length === 0 && (
        <p className="text-[10px] text-black/40 dark:text-white/40 italic">
          No measurements yet. Select a tool and click on a slice view to start measuring.
        </p>
      )}

      {/* Keyboard Shortcuts Hint */}
      <div className="text-[10px] text-black/30 dark:text-white/30 border-t border-black/10 dark:border-white/10 pt-2 mt-1 text-wrap break-words">
        <span className="font-medium">Shortcuts:</span> D = Distance, A = Angle, Esc = Cancel, Del = Delete
      </div>
    </div>
  );
}
