import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import {
  WindowIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  SwatchIcon,
  CubeIcon,
  CalculatorIcon,
  ArrowDownTrayIcon,
  ScissorsIcon,
} from '@heroicons/react/24/outline';
import { useViewerStore } from '../../store/viewerStore';
import { useSessionActions } from '../../context/SessionActionsContext';
import { ACCENT_COLOR } from '../../utils/uiLayout';
import type { LayoutMode } from '../../types/layout';
import type { SectionId } from '../../utils/uiLayout';

const RADIUS = 78;
const ITEM_SIZE = 38;

type ActionType =
  | { type: 'layout'; mode: LayoutMode }
  | { type: 'section'; id: SectionId }
  | { type: 'save' };

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  angle: number;
  action: ActionType;
  accent?: boolean;
}

// Angles in standard math convention: 0°=right, CCW positive, CSS y-inverted when rendering
const ITEMS: MenuItem[] = [
  { icon: WindowIcon,        label: 'Single',   angle: 112, action: { type: 'layout',  mode: 'single'   } },
  { icon: ViewColumnsIcon,   label: 'Slices',   angle:  67, action: { type: 'layout',  mode: 'slices'   } },
  { icon: Squares2X2Icon,    label: 'Quad',     angle:  22, action: { type: 'layout',  mode: 'quad'     } },
  { icon: CubeIcon,          label: 'Volume',   angle: 337, action: { type: 'section', id: 'volume'     } },
  { icon: SwatchIcon,        label: 'Transfer', angle: 292, action: { type: 'section', id: 'transfer'   } },
  { icon: ScissorsIcon,      label: 'Crop',     angle: 247, action: { type: 'section', id: 'crop'       } },
  { icon: CalculatorIcon,    label: 'Measure',  angle: 202, action: { type: 'section', id: 'measure'    } },
  { icon: ArrowDownTrayIcon, label: 'Save',     angle: 157, action: { type: 'save' },  accent: true      },
];

interface RadialMenuProps {
  x: number;
  y: number;
  onClose: () => void;
}

export function RadialMenu({ x, y, onClose }: RadialMenuProps) {
  const setLayoutMode  = useViewerStore((state) => state.setLayoutMode);
  const toggleSection  = useViewerStore((state) => state.toggleSection);
  const { onSaveSession } = useSessionActions();

  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleAction = (item: MenuItem) => {
    onClose();
    const { action } = item;
    if (action.type === 'layout')  setLayoutMode(action.mode);
    else if (action.type === 'section') toggleSection(action.id);
    else if (action.type === 'save')    void onSaveSession();
  };

  // Clamp so items don't overflow the viewport
  const pad = RADIUS + ITEM_SIZE;
  const cx = Math.min(Math.max(x, pad), window.innerWidth  - pad);
  const cy = Math.min(Math.max(y, pad), window.innerHeight - pad);

  return (
    <>
      {/* Invisible backdrop to close on click-outside */}
      <div
        className="fixed inset-0 z-[9998]"
        onMouseDown={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      />

      {/* Radial items */}
      <div
        className="fixed z-[9999] pointer-events-none"
        style={{ left: cx, top: cy }}
      >
        {/* Center pip */}
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 7,
            height: 7,
            left: -3.5,
            top: -3.5,
            background: ACCENT_COLOR,
            boxShadow: `0 0 10px ${ACCENT_COLOR}90`,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 600, damping: 28, delay: 0 }}
        />

        {/* Center hover label */}
        <motion.div
          className="absolute text-[10px] font-semibold whitespace-nowrap pointer-events-none select-none text-center"
          style={{
            color: 'var(--c-fg-80)',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            textShadow: '0 1px 6px rgba(0,0,0,0.9)',
            minWidth: 48,
          }}
          animate={{ opacity: hoveredLabel ? 1 : 0, scale: hoveredLabel ? 1 : 0.85 }}
          transition={{ duration: 0.12 }}
        >
          {hoveredLabel}
        </motion.div>

        {/* Items */}
        {ITEMS.map((item, i) => {
          const rad = (item.angle * Math.PI) / 180;
          const tx = Math.cos(rad) * RADIUS;
          const ty = -Math.sin(rad) * RADIUS;
          const Icon = item.icon;

          return (
            <motion.div
              key={item.label}
              className="absolute pointer-events-auto"
              style={{
                width: ITEM_SIZE,
                height: ITEM_SIZE,
                left: -ITEM_SIZE / 2,
                top: -ITEM_SIZE / 2,
              }}
              initial={{ x: 0, y: 0, scale: 0.2, opacity: 0 }}
              animate={{ x: tx, y: ty, scale: 1, opacity: 1 }}
              exit={{ x: 0, y: 0, scale: 0.2, opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 520,
                damping: 26,
                delay: i * 0.022,
              }}
            >
              <motion.button
                className="w-full h-full flex items-center justify-center rounded-full border select-none focus:outline-none"
                style={{
                  background: 'var(--c-bg-glass)',
                  backdropFilter: 'blur(14px)',
                  borderColor: item.accent ? `${ACCENT_COLOR}4d` : 'var(--c-fg-08)',
                  color: item.accent ? ACCENT_COLOR : 'var(--c-fg-65)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
                }}
                whileHover={{
                  scale: 1.18,
                  borderColor: item.accent ? ACCENT_COLOR : 'var(--c-fg-30)',
                  color: item.accent ? ACCENT_COLOR : 'var(--c-fg-85)',
                  boxShadow: item.accent
                    ? `0 0 18px ${ACCENT_COLOR}40, 0 2px 12px rgba(0,0,0,0.35)`
                    : '0 4px 18px rgba(0,0,0,0.25)',
                }}
                whileTap={{ scale: 0.9 }}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseEnter={() => setHoveredLabel(item.label)}
                onMouseLeave={() => setHoveredLabel(null)}
                onClick={() => handleAction(item)}
                title={item.label}
              >
                <Icon className="w-[15px] h-[15px] flex-shrink-0" />
              </motion.button>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}
