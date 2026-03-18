/**
 * TICChart Component
 *
 * Zoomable/pannable TIC chart used in both the control panel and modal.
 * Uses @visx/zoom for interaction and derives updated scale domains from the
 * transform matrix so axes stay in sync with the data on pan/zoom.
 * Uses @visx/tooltip to show coordinates when hovering over the chart.
 *
 * Interactions:
 *   - Scroll wheel: zoom (centred on cursor)
 *   - Click + drag: pan
 *   - Double-click: reset zoom
 *   - Hover: crosshair + tooltip showing time and intensity per ROI
 *
 * Expose a reset() method via ref prop so parent components can reset zoom
 */

import { useRef, useState, useEffect, useId, useImperativeHandle } from 'react';
import { Zoom } from '@visx/zoom';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import { LinePath } from '@visx/shape';
import { scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import type { TicROI, TicCurve } from '../../types/tic';

export interface TICChartHandle {
  reset: () => void;
}

interface TICChartProps {
  ref?: React.Ref<TICChartHandle>;
  rois: TicROI[];
  curves: Record<string, TicCurve>;
  height?: number;
  onZoomChange?: (isZoomed: boolean) => void;
}

interface TooltipData {
  timeValue: number;
  usesSeconds: boolean;
  points: Array<{ roiId: string; label: string; color: string; intensity: number }>;
}

const WHEEL_ZOOM_STEP = 0.025;

const TOOLTIP_STYLES: React.CSSProperties = {
  ...defaultStyles,
  background: 'rgba(15,15,15,0.95)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 4,
  color: 'white',
  fontSize: 11,
  padding: '6px 8px',
  pointerEvents: 'none',
  boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
};

export function TICChart({ ref, rois, curves, height = 180, onZoomChange }: TICChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(260);
  const uid = useId();
  const CLIP_ID = `tic-zoom-clip-${uid.replace(/:/g, '')}`;

  // Stable ref to zoom.reset so useImperativeHandle doesn't need to re-run
  const zoomResetRef = useRef<(() => void) | null>(null);
  const prevIsZoomedRef = useRef(false);

  useImperativeHandle(ref, () => ({ reset: () => zoomResetRef.current?.() }));

  const { tooltipOpen, tooltipLeft, tooltipTop, tooltipData, showTooltip, hideTooltip } =
    useTooltip<TooltipData>();

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setContainerWidth(w);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const isCompact = height <= 200;
  const MARGIN = isCompact
    ? { top: 5, right: 10, bottom: 40, left: 35 }
    : { top: 16, right: 0, bottom: 48, left: 40 };
  const TICK_FONT_SIZE = isCompact ? 9 : 11;
  const NUM_TICKS_X = isCompact ? 4 : 6;
  const NUM_TICKS_Y = isCompact ? 4 : 5;
  const CURVE_WIDTH = isCompact ? 1.5 : 2;

  const TICK_LABEL_PROPS = {
    fill: 'rgba(255,255,255,0.6)',
    fontSize: TICK_FONT_SIZE,
    fontFamily: 'monospace',
  } as const;

  const svgWidth = containerWidth;
  const innerWidth = svgWidth - MARGIN.left - MARGIN.right;
  const innerHeight = height - MARGIN.top - MARGIN.bottom;

  const allIntensities: number[] = [];
  const allTimes: number[] = [];
  for (const roi of rois) {
    const curve = curves[roi.id];
    if (!curve) continue;
    for (const v of curve.intensities) allIntensities.push(v);
    for (const t of curve.timeAxis) allTimes.push(t);
  }

  if (allTimes.length === 0) return null;

  const xDataMin = Math.min(...allTimes);
  const xDataMax = Math.max(...allTimes);
  const yDataMin = Math.min(...allIntensities);
  const yDataMax = Math.max(...allIntensities);

  const yPad = (yDataMax - yDataMin) * 0.05 || 1;
  const baseXScale = scaleLinear<number>({ domain: [xDataMin, xDataMax], range: [0, innerWidth] });
  const baseYScale = scaleLinear<number>({
    domain: [yDataMin - yPad, yDataMax + yPad],
    range: [innerHeight, 0],
  });

  const firstCurve = curves[rois[0]?.id ?? ''];
  const usesSeconds = Boolean(
    firstCurve && firstCurve.timeAxis.length > 1 && firstCurve.timeAxis[1] !== 1,
  );
  const xLabel = usesSeconds ? 'Time (s)' : 'Time step';

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <Zoom<SVGSVGElement>
        width={svgWidth}
        height={height}
        scaleXMin={0.5}
        scaleXMax={50}
        scaleYMin={0.5}
        scaleYMax={50}
        wheelDelta={(e) =>
          e.deltaY < 0
            ? { scaleX: 1 + WHEEL_ZOOM_STEP, scaleY: 1 + WHEEL_ZOOM_STEP }
            : { scaleX: 1 - WHEEL_ZOOM_STEP, scaleY: 1 - WHEEL_ZOOM_STEP }
        }
      >
        {(zoom) => {
          // Keep zoomResetRef current so the imperative handle always calls the latest reset
          zoomResetRef.current = zoom.reset;

          const { scaleX, scaleY, translateX, translateY } = zoom.transformMatrix;

          // Derive visible data range from transform matrix.
          // Zoom maps inner SVG coords: newP = oldP * scale + translate
          // Visible inner range [0, innerWidth] → invert to get data range.
          const visXMin = baseXScale.invert(-translateX / scaleX);
          const visXMax = baseXScale.invert((innerWidth - translateX) / scaleX);
          // Y is inverted in SVG (0 = top), so top = higher data value
          const visYMax = baseYScale.invert(-translateY / scaleY);
          const visYMin = baseYScale.invert((innerHeight - translateY) / scaleY);

          const xScale = scaleLinear<number>({ domain: [visXMin, visXMax], range: [0, innerWidth] });
          const yScale = scaleLinear<number>({
            domain: [visYMin, visYMax],
            range: [innerHeight, 0],
          });

          const isZoomed =
            zoom.transformMatrix.scaleX !== 1 ||
            zoom.transformMatrix.scaleY !== 1 ||
            zoom.transformMatrix.translateX !== 0 ||
            zoom.transformMatrix.translateY !== 0;

          if (prevIsZoomedRef.current !== isZoomed) {
            prevIsZoomedRef.current = isZoomed;
            onZoomChange?.(isZoomed);
          }

          const handleOverlayMouseMove = (event: React.MouseEvent<SVGRectElement>) => {
            if (zoom.isDragging) {
              hideTooltip();
              return;
            }

            // offsetX is unreliable for SVG elements with transforms, use clientX
            // relative to the SVG bounding rect instead.
            const svgRect = zoom.containerRef.current?.getBoundingClientRect();
            if (!svgRect) return;
            const innerX = event.clientX - svgRect.left - MARGIN.left;
            const innerY = event.clientY - svgRect.top - MARGIN.top;
            const timeValue = xScale.invert(innerX);

            const refCurve = curves[rois[0]?.id ?? ''];
            if (!refCurve || refCurve.timeAxis.length === 0) return;

            let nearestIdx = 0;
            let minDist = Infinity;
            for (let i = 0; i < refCurve.timeAxis.length; i++) {
              const dist = Math.abs((refCurve.timeAxis[i] as number) - timeValue);
              if (dist < minDist) {
                minDist = dist;
                nearestIdx = i;
              }
            }

            const snappedTime = refCurve.timeAxis[nearestIdx] as number;
            const points = rois
              .filter((roi) => Boolean(curves[roi.id]))
              .map((roi) => ({
                roiId: roi.id,
                label: roi.label,
                color: roi.color,
                intensity: (curves[roi.id]?.intensities[nearestIdx] ?? 0) as number,
              }));

            showTooltip({
              tooltipLeft: MARGIN.left + xScale(snappedTime),
              tooltipTop: MARGIN.top + innerY,
              tooltipData: { timeValue: snappedTime, usesSeconds, points },
            });
          };

          const crosshairX =
            tooltipOpen && tooltipData ? xScale(tooltipData.timeValue) : null;

          return (
            <svg
              ref={zoom.containerRef}
              width={svgWidth}
              height={height}
              onWheel={zoom.handleWheel}
              onMouseDown={zoom.dragStart}
              onMouseMove={zoom.isDragging ? zoom.dragMove : undefined}
              onMouseUp={zoom.dragEnd}
              onMouseLeave={() => {
                zoom.dragEnd();
                hideTooltip();
              }}
              onDoubleClick={zoom.reset}
              style={{ cursor: zoom.isDragging ? 'grabbing' : 'crosshair', display: 'block' }}
            >
              <defs>
                <clipPath id={CLIP_ID}>
                  <rect x={0} y={0} width={innerWidth} height={innerHeight} />
                </clipPath>
              </defs>

              <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
                {/* Grid lines (clipped) */}
                <g clipPath={`url(#${CLIP_ID})`}>
                  {yScale.ticks(NUM_TICKS_Y).map((tick) => (
                    <line
                      key={`hy-${tick}`}
                      x1={0}
                      x2={innerWidth}
                      y1={yScale(tick)}
                      y2={yScale(tick)}
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth={1}
                    />
                  ))}
                  {xScale.ticks(NUM_TICKS_X).map((tick) => (
                    <line
                      key={`vx-${tick}`}
                      x1={xScale(tick)}
                      x2={xScale(tick)}
                      y1={0}
                      y2={innerHeight}
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth={1}
                    />
                  ))}
                </g>

                {/* Curves (clipped) */}
                <g clipPath={`url(#${CLIP_ID})`}>
                  {rois.map((roi) => {
                    const curve = curves[roi.id];
                    if (!curve || curve.intensities.length === 0) return null;
                    const pts = curve.timeAxis.map((t, i) => ({
                      t,
                      v: curve.intensities[i] as number,
                    }));
                    return (
                      <LinePath
                        key={roi.id}
                        data={pts}
                        x={(d) => xScale(d.t)}
                        y={(d) => yScale(d.v)}
                        stroke={roi.color}
                        strokeWidth={CURVE_WIDTH}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    );
                  })}
                </g>

                {/* Crosshair + dots (clipped, non-interactive) */}
                {crosshairX !== null && tooltipData && (
                  <g clipPath={`url(#${CLIP_ID})`} style={{ pointerEvents: 'none' }}>
                    <line
                      x1={crosshairX}
                      x2={crosshairX}
                      y1={0}
                      y2={innerHeight}
                      stroke="rgba(255,255,255,0.35)"
                      strokeWidth={1}
                      strokeDasharray="4 3"
                    />
                    {tooltipData.points.map((p) => (
                      <circle
                        key={p.roiId}
                        cx={crosshairX}
                        cy={yScale(p.intensity)}
                        r={isCompact ? 3 : 4}
                        fill={p.color}
                        stroke="rgba(255,255,255,0.8)"
                        strokeWidth={1.5}
                      />
                    ))}
                  </g>
                )}

                {/* Invisible overlay, must be last to sit on top for mouse events */}
                <rect
                  x={0}
                  y={0}
                  width={innerWidth}
                  height={innerHeight}
                  fill="transparent"
                  onMouseMove={handleOverlayMouseMove}
                  onMouseLeave={hideTooltip}
                />

                {/* Axes */}
                <AxisBottom
                  scale={xScale}
                  top={innerHeight}
                  stroke="rgba(255,255,255,0.3)"
                  tickStroke="rgba(255,255,255,0.3)"
                  tickLabelProps={TICK_LABEL_PROPS}
                  numTicks={NUM_TICKS_X}
                  label={xLabel}
                  labelProps={{
                    fill: 'rgba(255,255,255,0.5)',
                    fontSize: TICK_FONT_SIZE,
                    fontFamily: 'monospace',
                    textAnchor: 'middle',
                  }}
                />
                <AxisLeft
                  scale={yScale}
                  stroke="rgba(255,255,255,0.3)"
                  tickStroke="rgba(255,255,255,0.3)"
                  tickLabelProps={TICK_LABEL_PROPS}
                  numTicks={NUM_TICKS_Y}
                />
              </g>
            </svg>
          );
        }}
      </Zoom>

      {/* Tooltip, positioned relative to the container div */}
      {tooltipOpen && tooltipData && (
        <TooltipWithBounds left={tooltipLeft} top={tooltipTop} style={TOOLTIP_STYLES}>
          <div style={{ marginBottom: 4, color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>
            {tooltipData.usesSeconds
              ? `t = ${tooltipData.timeValue.toFixed(2)} s`
              : `step ${tooltipData.timeValue}`}
          </div>
          {tooltipData.points.map((p) => (
            <div
              key={p.roiId}
              style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: p.color,
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>{p.label}:</span>
              <span style={{ color: 'white', fontFamily: 'monospace' }}>
                {p.intensity.toFixed(2)}
              </span>
            </div>
          ))}
        </TooltipWithBounds>
      )}

      {/* Legend */}
      <div
        className={`flex flex-wrap gap-y-1 mt-1 px-1 ${isCompact ? 'gap-x-3' : 'gap-x-4 mt-2'}`}
      >
        {rois.map((roi) => (
          <div key={roi.id} className="flex items-center gap-1">
            <span
              className={`inline-block h-0.5 rounded ${isCompact ? 'w-3' : 'w-4'}`}
              style={{ backgroundColor: roi.color }}
            />
            <span className={`text-white/50 ${isCompact ? 'text-[9px]' : 'text-[10px]'}`}>
              {roi.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
