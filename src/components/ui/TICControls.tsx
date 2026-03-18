/**
 * TICControls Component
 *
 * Control panel section for Time Intensity Curve tools:
 * - Activate TIC ROI placement tool
 * - List placed ROIs with delete option
 * - TICChart rendered below the list
 */

import { Button } from '@heroui/react';
import { ArrowsPointingOutIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { useState, useRef } from 'react';
import { useViewerStore } from '../../store/viewerStore';
import { TICChart } from './TICChart';
import type { TICChartHandle } from './TICChart';
import { TICChartModal } from './TICChartModal';

const ROIIcon = (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
);

export function TICControls() {
  const [chartModalOpen, setChartModalOpen] = useState(false);
  const [isChartZoomed, setIsChartZoomed] = useState(false);
  const chartRef = useRef<TICChartHandle>(null);
  const volume = useViewerStore((state) => state.volume);
  const ticToolActive = useViewerStore((state) => state.ticToolActive);
  const setTicToolActive = useViewerStore((state) => state.setTicToolActive);
  const ticRois = useViewerStore((state) => state.ticRois);
  const ticCurves = useViewerStore((state) => state.ticCurves);
  const deleteTicRoi = useViewerStore((state) => state.deleteTicRoi);
  const clearTicRois = useViewerStore((state) => state.clearTicRois);

  const is4D = Boolean(volume?.dimensions.t && volume.dimensions.t > 1);

  if (!is4D) {
    return (
      <p className="text-[10px] text-white/40 italic">
        4D volume required for TIC analysis.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Tool toggle */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-white/60">ROI Placement</span>
        <Button
          size="sm"
          variant={ticToolActive ? 'primary' : 'secondary'}
          onPress={() => setTicToolActive(!ticToolActive)}
          className={`!px-3 !py-1.5 ${ticToolActive ? '!ring-2 !ring-white/30' : ''}`}
        >
          {ROIIcon}
          <span className="text-xs ml-1">Place ROI</span>
        </Button>
        {ticToolActive && (
          <p className="text-[10px] text-white/40 italic text-wrap break-words">
            Click and drag on a slice to draw a circular ROI
          </p>
        )}
      </div>

      {/* ROI List */}
      {ticRois.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/60">ROIs ({ticRois.length})</span>
            <Button
              size="sm"
              variant="secondary"
              onPress={clearTicRois}
              className="!px-2 !py-0.5 !text-[10px] text-white/60 hover:text-red-400"
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-col gap-1 max-h-28 overflow-y-auto">
            {ticRois.map((roi) => (
              <div
                key={roi.id}
                className="flex items-center justify-between p-1.5 rounded hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2 text-xs text-white/80 min-w-0 overflow-hidden">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0 border border-white/20"
                    style={{ backgroundColor: roi.color }}
                  />
                  <span className="truncate">{roi.label}</span>
                  <span className="text-white/40 shrink-0 text-[10px]">
                    ({roi.orientation.charAt(0).toUpperCase()}:{roi.sliceIndex})
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="!px-2 !py-1 !min-w-6 !h-6 !text-[10px] text-white/60 hover:text-red-400"
                  onPress={() => deleteTicRoi(roi.id)}
                >
                  X
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      {ticRois.length > 0 && (
        <div className="border-t border-white/10 pt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-white/60">Chart</span>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="secondary"
                isDisabled={!isChartZoomed}
                onPress={() => chartRef.current?.reset()}
                className="!px-1.5 !py-1 !min-w-6 !h-6 text-white/50 hover:text-white/80"
                aria-label="Reset zoom"
              >
                <ArrowUturnLeftIcon className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onPress={() => setChartModalOpen(true)}
                className="!px-1.5 !py-1 !min-w-6 !h-6 text-white/50 hover:text-white/80"
                aria-label="Expand chart"
              >
                <ArrowsPointingOutIcon className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <TICChart
            ref={chartRef}
            rois={ticRois}
            curves={ticCurves}
            onZoomChange={setIsChartZoomed}
          />
        </div>
      )}

      <TICChartModal
        isOpen={chartModalOpen}
        onClose={() => setChartModalOpen(false)}
        rois={ticRois}
        curves={ticCurves}
      />

      {/* Empty state */}
      {ticRois.length === 0 && !ticToolActive && (
        <p className="text-[10px] text-white/40 italic">
          Activate the tool and drag on a slice to place a ROI.
        </p>
      )}
    </div>
  );
}
