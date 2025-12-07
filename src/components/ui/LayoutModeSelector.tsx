/**
 * Layout Mode Selector
 *
 * UI overlay for switching between different layout modes.
 * Supports 'single', 'slices', and 'quad' modes.
 */

import { useViewerStore } from '../../store/viewerStore';
import type { LayoutMode } from '../../types/layout';

export function LayoutModeSelector() {
  const layoutMode = useViewerStore((state) => state.layoutMode);
  const setLayoutMode = useViewerStore((state) => state.setLayoutMode);

  const handleModeChange = (mode: LayoutMode) => {
    setLayoutMode(mode);
  };

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      zIndex: 100,
      display: 'flex',
      gap: '8px',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: '8px',
      borderRadius: '4px',
    }}>
      <button
        onClick={() => handleModeChange('single')}
        style={{
          padding: '8px 16px',
          backgroundColor: layoutMode === 'single' ? '#4a9eff' : '#333',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: layoutMode === 'single' ? 'bold' : 'normal',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          if (layoutMode !== 'single') {
            e.currentTarget.style.backgroundColor = '#444';
          }
        }}
        onMouseLeave={(e) => {
          if (layoutMode !== 'single') {
            e.currentTarget.style.backgroundColor = '#333';
          }
        }}
      >
        Single
      </button>
      <button
        onClick={() => handleModeChange('slices')}
        style={{
          padding: '8px 16px',
          backgroundColor: layoutMode === 'slices' ? '#4a9eff' : '#333',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: layoutMode === 'slices' ? 'bold' : 'normal',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          if (layoutMode !== 'slices') {
            e.currentTarget.style.backgroundColor = '#444';
          }
        }}
        onMouseLeave={(e) => {
          if (layoutMode !== 'slices') {
            e.currentTarget.style.backgroundColor = '#333';
          }
        }}
      >
        Slices
      </button>
      <button
        onClick={() => handleModeChange('quad')}
        style={{
          padding: '8px 16px',
          backgroundColor: layoutMode === 'quad' ? '#4a9eff' : '#333',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: layoutMode === 'quad' ? 'bold' : 'normal',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          if (layoutMode !== 'quad') {
            e.currentTarget.style.backgroundColor = '#444';
          }
        }}
        onMouseLeave={(e) => {
          if (layoutMode !== 'quad') {
            e.currentTarget.style.backgroundColor = '#333';
          }
        }}
      >
        Quad
      </button>
    </div>
  );
}
