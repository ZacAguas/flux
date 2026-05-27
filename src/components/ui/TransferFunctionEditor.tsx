/**
 * Transfer Function Editor Component
 *
 * Main container for the transfer function editor. Manages preset selection
 * and integrates the visualization canvas and control point editor panel.
 */

import { Select, Label, ListBox } from '@heroui/react';
import { useViewerStore } from '../../store/viewerStore';
import { TRANSFER_FUNCTION_PRESETS } from '../../data/transferFunctionPresets';
import { TransferFunctionCanvas } from './TransferFunctionCanvas';
import { ControlPointEditor } from './ControlPointEditor';
import { useState } from 'react';

export function TransferFunctionEditor() {
  const activePreset = useViewerStore((state) => state.activeTransferFunctionPreset);
  const applyPreset = useViewerStore((state) => state.applyTransferFunctionPreset);
  const setPopoverOpen = useViewerStore((state) => state.setPopoverOpen);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {/* Preset Selector */}
      <div className="flex flex-col gap-1">
        <Select
          className="w-full"
          value={activePreset}
          onChange={(value) => {
            if (value) {
              applyPreset(String(value));
              setSelectedPointIndex(null); // Clear selection when changing presets
            }
          }}
          onOpenChange={setPopoverOpen}
        >
          <Label className="text-black/50 dark:text-white/50 text-xs font-medium">Preset</Label>
          <Select.Trigger className="!bg-black/8 dark:!bg-white/10 backdrop-blur-sm !border-black/15 dark:!border-white/20 text-black dark:text-white text-xs">
            <Select.Value>
              {TRANSFER_FUNCTION_PRESETS.find((p) => p.name === activePreset)
                ?.name.replace(/-/g, ' ').toUpperCase() || 'Custom'}
            </Select.Value>
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover className="bg-white/90 dark:bg-black/70 backdrop-blur-sm border border-black/15 dark:border-white/20 rounded-md shadow-lg">
            <ListBox>
              {TRANSFER_FUNCTION_PRESETS.map((preset) => (
                <ListBox.Item
                  key={preset.name}
                  id={preset.name}
                  textValue={preset.name}
                  className="text-black dark:text-white text-xs px-3 py-2 hover:bg-black/8 dark:hover:bg-white/10 cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {preset.name.replace(/-/g, ' ').toUpperCase()}
                    </span>
                    <span className="text-black/50 dark:text-white/50 text-xs">
                      {preset.description}
                    </span>
                  </div>
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      {/* Visualization Canvas */}
      <TransferFunctionCanvas
        selectedPointIndex={selectedPointIndex}
        onSelectPoint={setSelectedPointIndex}
      />

      {/* Control Point Editor Panel */}
      <ControlPointEditor
        selectedPointIndex={selectedPointIndex}
        onSelectPoint={setSelectedPointIndex}
      />
    </div>
  );
}
