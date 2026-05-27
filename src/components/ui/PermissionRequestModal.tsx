import { KeyIcon } from '@heroicons/react/24/outline';
import { Button } from '@heroui/react';
import { AppModal, ModalHeader, ModalIcon, ModalTitle, ModalBody, ModalFooter } from './AppModal';

interface PermissionRequestModalProps {
  isOpen: boolean;
  fileName: string | null;
  onGrantPermission: () => void;
  onSelectDifferentFile: () => void;
  onCancel: () => void;
}

export function PermissionRequestModal({
  isOpen,
  fileName,
  onGrantPermission,
  onSelectDifferentFile,
  onCancel,
}: PermissionRequestModalProps) {
  return (
    <AppModal isOpen={isOpen} onClose={onCancel} maxWidth="max-w-md">
      <ModalHeader>
        <ModalIcon className="bg-yellow-500/20 text-yellow-400">
          <KeyIcon className="size-4" />
        </ModalIcon>
        <ModalTitle>File Access Required</ModalTitle>
      </ModalHeader>

      <ModalBody>
        <p className="text-sm text-black/60 dark:text-white/70 mb-3">This session was saved with the file:</p>
        {fileName && (
          <p className="text-sm text-black dark:text-white font-medium bg-black/5 dark:bg-white/5 px-3 py-2 rounded truncate mb-3">
            {fileName}
          </p>
        )}
        <p className="text-sm text-black/60 dark:text-white/70">
          Click &ldquo;Allow Access&rdquo; to grant permission to read this file.
        </p>
      </ModalBody>

      <ModalFooter>
        <Button size="sm" variant="secondary" onPress={onCancel}
          className="!bg-black/8 dark:!bg-white/10 !border-black/15 dark:!border-white/20 !text-black dark:!text-white text-xs">
          Cancel
        </Button>
        <Button size="sm" variant="secondary" onPress={onSelectDifferentFile}
          className="!bg-black/8 dark:!bg-white/10 !border-black/15 dark:!border-white/20 !text-black dark:!text-white text-xs whitespace-nowrap">
          Select File
        </Button>
        <Button size="sm" variant="primary" onPress={onGrantPermission}
          className="!bg-blue-600 !border-blue-500 !text-white text-xs whitespace-nowrap">
          Allow Access
        </Button>
      </ModalFooter>
    </AppModal>
  );
}
