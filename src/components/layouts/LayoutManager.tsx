/**
 * Layout Manager
 *
 * PERF: This unmounts/remounts when switching modes, should be refactored to keep viewports alive.
 */

import { useViewerStore } from '../../store/viewerStore';
import { LayoutSingle } from './LayoutSingle';
import { LayoutQuad } from './LayoutQuad';

export function LayoutManager() {
  const layoutMode = useViewerStore((state) => state.layoutMode);

  return (
    <>
      {layoutMode === 'single' && <LayoutSingle />}
      {layoutMode === 'quad' && <LayoutQuad />}
      {/* NOTE: 'slices' mode not implemented yet */}
    </>
  );
}
