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
  const { panelHeight, controlPanelOpen } = useLayoutDimensions();
  const labelOffset = controlPanelOpen ? 204 : 0;

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
        transition: 'top 0.3s ease-in-out',
      }}>
        3D Volume
      </div>
    }>
      <VolumeRenderer />
      <OrbitControls makeDefault enableDamping dampingFactor={0.05} minDistance={2} maxDistance={10} />
    </BaseLayout>
  );
}