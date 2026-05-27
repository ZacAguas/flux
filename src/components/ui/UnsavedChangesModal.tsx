import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '@heroui/react';
import { AppModal, ModalHeader, ModalIcon, ModalTitle, ModalBody, ModalFooter } from './AppModal';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onSave: () => void;
  onDontSave: () => void;
  onCancel: () => void;
}

export function UnsavedChangesModal({
  isOpen,
  onSave,
  onDontSave,
  onCancel,
}: UnsavedChangesModalProps) {
  return (
    <AppModal isOpen={isOpen} onClose={onCancel} maxWidth="max-w-md">
      <ModalHeader>
        <ModalIcon className="bg-yellow-500/20 text-yellow-400">
          <ExclamationTriangleIcon className="size-4" />
        </ModalIcon>
        <ModalTitle>Unsaved Changes</ModalTitle>
      </ModalHeader>

      <ModalBody>
        <p className="text-sm text-black/60 dark:text-white/70">
          You have unsaved changes. Would you like to save before continuing?
        </p>
      </ModalBody>

      <ModalFooter>
        <Button size="sm" variant="tertiary" onPress={onCancel}
          className="!bg-black/8 dark:!bg-white/10 !border-black/15 dark:!border-white/20 !text-black dark:!text-white text-xs">
          Cancel
        </Button>
        <Button size="sm" variant="tertiary" onPress={onDontSave}
          className="!bg-black/8 dark:!bg-white/10 !border-black/15 dark:!border-white/20 !text-black dark:!text-white text-xs">
          Don&apos;t Save
        </Button>
        <Button size="sm" variant="primary" onPress={onSave}
          className="!bg-blue-600 !border-blue-500 !text-white text-xs">
          Save
        </Button>
      </ModalFooter>
    </AppModal>
  );
}
