/**
 * Base Layout Component
 *
 * Provides the common structure for all viewer layouts.
 * Sets up the R3F Canvas with WebGPU renderer and handles the main layout container.
 */

import type { ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three/webgpu';
import { InspectorControls } from '../debug/InspectorControls';

interface BaseLayoutProps {
  children: ReactNode;
  overlays?: ReactNode;
  panelHeight: number;
}

/**
 * Wrapper component that sets up the Canvas and layout container.
 *
 * @param props.children - 3D content to render inside the Canvas
 * @param props.overlays - UI overlays to render on top of the Canvas
 * @param props.panelHeight - Height of the control panel to offset the Canvas
 */
export function BaseLayout({ children, overlays, panelHeight }: BaseLayoutProps) {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      position: 'relative',
    }}>
      <Canvas
        orthographic
        camera={{ zoom: 100, position: [0, 0, 5] }}
        style={{
          position: 'absolute',
          top: `${panelHeight}px`,
          left: 0,
          width: '100%',
          height: `calc(100% - ${panelHeight}px)`,
          transition: 'top 0.3s ease-in-out, height 0.3s ease-in-out',
        }}
        gl={async (props) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const renderer = new THREE.WebGPURenderer(props as any);
          if (import.meta.env.DEV) {
            renderer.inspector = new (await import('three/examples/jsm/inspector/Inspector.js')).Inspector();
          }
          await renderer.init();
          return renderer;
        }}
      >
        {children}
        <InspectorControls />
      </Canvas>
      {overlays}
    </div>
  );
}
