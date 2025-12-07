/**
 ** @deprecated This utility is unused.
 * See LayoutQuad.tsx and LayoutSingle.tsx for the actual implementation.
 *
 * Shared WebGPU Renderer Utility
 *
 * Creates a single WebGPURenderer instance that can render to multiple canvas elements
 * using the CanvasTarget API (Three.js r181+).
 *
 * Pattern based on webgpu_multiple_canvas.html example:
 * - ONE renderer instance (guaranteed texture sharing)
 * - Multiple canvas elements in DOM
 * - CanvasTarget for each additional canvas
 * - Renderer switches between targets when rendering different scenes
 */

import * as THREE from 'three/webgpu';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

// Singleton renderer instance
let sharedRenderer: THREE.WebGPURenderer | null = null;

/**
 * Create or get the shared WebGPU renderer
 *
 * @param canvas - Primary canvas element for the renderer
 * @returns Initialized WebGPURenderer instance
 */
export async function createSharedWebGPURenderer(
  canvas: HTMLCanvasElement
): Promise<THREE.WebGPURenderer> {
  // Return existing renderer if already created
  if (sharedRenderer) {
    return sharedRenderer;
  }

  // Create new renderer with primary canvas
  sharedRenderer = new THREE.WebGPURenderer({ canvas });

  // Add Inspector in dev mode
  if (import.meta.env.DEV) {
    sharedRenderer.inspector = new Inspector();
  }

  // Initialize WebGPU
  await sharedRenderer.init();

  return sharedRenderer;
}

/**
 * Get the existing shared renderer (if created)
 *
 * @returns Shared renderer or null if not yet created
 */
export function getSharedRenderer(): THREE.WebGPURenderer | null {
  return sharedRenderer;
}

/**
 * Create a CanvasTarget for rendering to an additional canvas
 *
 * @param canvas - Canvas element to render to
 * @returns CanvasTarget instance
 */
export function createCanvasTarget(canvas: HTMLCanvasElement): THREE.CanvasTarget {
  return new THREE.CanvasTarget(canvas);
}

/**
 * Dispose of the shared renderer and reset singleton
 */
export function disposeSharedRenderer(): void {
  if (sharedRenderer) {
    sharedRenderer.dispose();
    sharedRenderer = null;
  }
}
