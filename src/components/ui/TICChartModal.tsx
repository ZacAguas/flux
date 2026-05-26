import { PresentationChartLineIcon } from '@heroicons/react/24/outline';
import { AppModal, ModalHeader, ModalIcon, ModalTitle, ModalBody } from './AppModal';
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
    <AppModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-3xl" showClose>
      <ModalHeader>
        <ModalIcon className="bg-white/10 text-white/70">
          <PresentationChartLineIcon className="size-4" />
        </ModalIcon>
        <ModalTitle>Time Intensity Curves</ModalTitle>
      </ModalHeader>

      <ModalBody className="!overflow-visible">
        <p className="text-[10px] text-white/30 mb-3">
          Scroll to zoom · Drag to pan · Double-click to reset
        </p>
        <TICChart rois={rois} curves={curves} height={380} />
      </ModalBody>
    </AppModal>
  );
}
