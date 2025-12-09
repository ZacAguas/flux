/**
 * Single Layout Component
 *
 * Displays a single large 3D volume view.
 * Uses BaseLayout and VolumeRenderer.
 */

import { OrbitControls } from '@react-three/drei';
import { BaseLayout } from './BaseLayout';
import { VolumeRenderer } from '../VolumeRenderer';
import { useLayoutDimensions } from '../../hooks/useLayoutDimensions';

/**
 * Layout showing only the 3D volume with orbit controls.
 */
export function LayoutSingle() {
  const { panelHeight, controlPanelContentHeight, controlPanelOpen } = useLayoutDimensions();
  const labelOffset = controlPanelOpen ? controlPanelContentHeight : 0;

  return (
    <BaseLayout panelHeight={panelHeight} overlays={
      <div style={{
        position: 'absolute',
        top: `${labelOffset + 10}px`,
        left: '10px',
        color: 'white',
        fontSize: '14px',
        fontWeight: 'bold',
        pointerEvents: 'none',
        transition: 'top 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        3D Volume
      </div>
    }>
      <VolumeRenderer />
      <OrbitControls makeDefault enableDamping dampingFactor={0.05} minDistance={2} maxDistance={10} />
    </BaseLayout>
  );
}