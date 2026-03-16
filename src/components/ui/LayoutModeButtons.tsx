/**
 * Layout Mode Buttons Component
 *
 * Tabs for switching between different layout modes (Single, Slices, Quad).
 */

import { Tabs } from '@heroui/react';
import { WindowIcon, ViewColumnsIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import { useViewerStore } from '../../store/viewerStore';
import type { LayoutMode } from '../../types/layout';

export function LayoutModeButtons() {
  const layoutMode = useViewerStore((state) => state.layoutMode);
  const setLayoutMode = useViewerStore((state) => state.setLayoutMode);

  return (
    <Tabs
      orientation="vertical"
      selectedKey={layoutMode}
      onSelectionChange={(key) => setLayoutMode(key.valueOf() as LayoutMode)}
    >
      <Tabs.ListContainer>
        <Tabs.List
          aria-label="Layout Mode"
          className="bg-transparent *:px-2.5 *:py-1.5 *:text-white/70 *:transition-all *:duration-200 *:data-[selected=true]:text-white *:rounded-md *:bg-transparent gap-1"
        >
          <Tabs.Tab id="single">
            <WindowIcon className="w-4 h-4" />
            <Tabs.Indicator className="bg-white/15 backdrop-blur-sm transition-all duration-300 ease-out rounded-md" />
          </Tabs.Tab>
          <Tabs.Tab id="slices">
            <ViewColumnsIcon className="w-4 h-4" />
            <Tabs.Indicator className="bg-white/15 backdrop-blur-sm transition-all duration-300 ease-out rounded-md" />
          </Tabs.Tab>
          <Tabs.Tab id="quad">
            <Squares2X2Icon className="w-4 h-4" />
            <Tabs.Indicator className="bg-white/15 backdrop-blur-sm transition-all duration-300 ease-out rounded-md" />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
    </Tabs>
  );
}
