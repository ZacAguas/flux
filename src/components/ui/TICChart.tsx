/**
 * TICChart Component
 *
 * Renders Time Intensity Curves for all TIC ROIs using @visx.
 */

import { useRef, useState, useEffect } from 'react';
import { LinePath } from '@visx/shape';
import { scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import type { TicROI, TicCurve } from '../../types/tic';

interface TICChartProps {
  rois: TicROI[];
  curves: Record<string, TicCurve>;
}

const MARGIN = { top: 10, right: 15, bottom: 36, left: 52 };
const CHART_HEIGHT = 180;

const TICK_LABEL_PROPS = {
  fill: 'rgba(255,255,255,0.6)',
  fontSize: 9,
  fontFamily: 'monospace',
} as const;

export function TICChart({ rois, curves }: TICChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(260);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width && width > 0) setContainerWidth(width);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const svgWidth = containerWidth;
  const innerWidth = svgWidth - MARGIN.left - MARGIN.right;
  const innerHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;

  // Gather all data points to define axis domains
  const allIntensities: number[] = [];
  const allTimes: number[] = [];

  for (const roi of rois) {
    const curve = curves[roi.id];
    if (!curve) continue;
    for (const v of curve.intensities) allIntensities.push(v);
    for (const t of curve.timeAxis) allTimes.push(t);
  }

  if (allTimes.length === 0) return null;

  const xMin = Math.min(...allTimes);
  const xMax = Math.max(...allTimes);
  const yMin = Math.min(...allIntensities);
  const yMax = Math.max(...allIntensities);

  const xScale = scaleLinear<number>({
    domain: [xMin, xMax],
    range: [0, innerWidth],
  });

  const yPad = (yMax - yMin) * 0.05 || 1;
  const yScale = scaleLinear<number>({
    domain: [yMin - yPad, yMax + yPad],
    range: [innerHeight, 0],
  });

  // Determine axis label
  const firstCurve = curves[rois[0]?.id ?? ''];
  const usesSeconds = firstCurve && firstCurve.timeAxis.length > 1 && firstCurve.timeAxis[1] !== 1;
  const xLabel = usesSeconds ? 'Time (s)' : 'Time step';

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <svg width={svgWidth} height={CHART_HEIGHT}>
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {/* Grid lines */}
          {yScale.ticks(4).map((tick) => (
            <line
              key={tick}
              x1={0}
              x2={innerWidth}
              y1={yScale(tick)}
              y2={yScale(tick)}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={1}
            />
          ))}

          {/* Curves */}
          {rois.map((roi) => {
            const curve = curves[roi.id];
            if (!curve || curve.intensities.length === 0) return null;
            const points = curve.timeAxis.map((t, i) => ({
              t,
              v: curve.intensities[i] as number,
            }));
            return (
              <LinePath
                key={roi.id}
                data={points}
                x={(d) => xScale(d.t)}
                y={(d) => yScale(d.v)}
                stroke={roi.color}
                strokeWidth={1.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}

          {/* Axes */}
          <AxisBottom
            scale={xScale}
            top={innerHeight}
            stroke="rgba(255,255,255,0.3)"
            tickStroke="rgba(255,255,255,0.3)"
            tickLabelProps={TICK_LABEL_PROPS}
            numTicks={4}
            label={xLabel}
            labelProps={{
              fill: 'rgba(255,255,255,0.5)',
              fontSize: 9,
              fontFamily: 'monospace',
              textAnchor: 'middle',
            }}
          />
          <AxisLeft
            scale={yScale}
            stroke="rgba(255,255,255,0.3)"
            tickStroke="rgba(255,255,255,0.3)"
            tickLabelProps={TICK_LABEL_PROPS}
            numTicks={4}
          />
        </g>
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 px-1">
        {rois.map((roi) => (
          <div key={roi.id} className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-0.5 rounded"
              style={{ backgroundColor: roi.color }}
            />
            <span className="text-[9px] text-white/50">{roi.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
