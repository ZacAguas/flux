/**
 * TICChartModal Component
 *
 * Displays the TIC chart in a full-size modal with zoom/pan support.
 */

import { Modal } from '@heroui/react';
import { PresentationChartLineIcon } from '@heroicons/react/24/outline';
import { TICChart } from './TICChart';
import type { TicROI, TicCurve } from '../../types/tic';

interface TICChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  rois: TicROI[];
  curves: Record<string, TicCurve>;
}

export function TICChartModal({ isOpen, onClose, rois, curves }: TICChartModalProps) {
  return (
    <Modal isOpen={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <Modal.Backdrop variant="blur" isDismissable>
        <Modal.Container>
          <Modal.Dialog className="max-w-3xl bg-neutral-900 border border-white/20">
            <Modal.Header className="px-6 py-4 border-b border-white/10 bg-transparent !flex-row !items-center gap-3">
              <Modal.Icon className="bg-white/10 text-white/70">
                <PresentationChartLineIcon className="w-5 h-5" />
              </Modal.Icon>
              <Modal.Heading className="text-white text-sm">Time Intensity Curves</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="px-0 py-4 bg-transparent">
              <p className="text-[10px] text-white/30 mb-2">
                Scroll to zoom · Drag to pan · Double-click to reset
              </p>
              <TICChart rois={rois} curves={curves} height={380} />
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
