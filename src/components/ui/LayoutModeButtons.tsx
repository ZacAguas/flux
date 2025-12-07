/**
 * Layout Mode Buttons Component
 *
 * Buttons for switching between different layout modes (Single, Slices, Quad).
 * Replaces the old LayoutModeSelector with HeroUI-styled buttons.
 */

import { Button } from '@heroui/react';
import { useViewerStore } from '../../store/viewerStore';
import type { LayoutMode } from '../../types/layout';

export function LayoutModeButtons() {
  const layoutMode = useViewerStore((state) => state.layoutMode);
  const setLayoutMode = useViewerStore((state) => state.setLayoutMode);

  const modes: { value: LayoutMode; label: string }[] = [
    { value: 'single', label: 'Single' },
    { value: 'slices', label: 'Slices' },
    { value: 'quad', label: 'Quad' },
  ];

  return (
    <div className="flex gap-1">
      {modes.map(({ value, label }) => (
        <Button
          key={value}
          variant={layoutMode === value ? 'primary' : 'secondary'}
          size="sm"
          onPress={() => setLayoutMode(value)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
