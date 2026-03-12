/**
 * Permission Request Modal
 *
 * Prompts user to grant file access permission when loading a session
 * with a stored FileSystemFileHandle. Requires a user gesture to request permission.
 */

import { KeyIcon } from '@heroicons/react/24/outline';
import { Modal, Button } from '@heroui/react';

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
    <Modal isOpen={isOpen} onOpenChange={(open: boolean) => !open && onCancel()}>
      <Modal.Backdrop variant="blur" isDismissable>
        <Modal.Container>
        <Modal.Dialog className="max-w-md bg-neutral-900 border border-white/20">
          <Modal.Header className="px-6 py-4 border-b border-white/10 bg-transparent !flex-row !items-center gap-3">
            <Modal.Icon className="bg-yellow-500/20 text-yellow-400">
              <KeyIcon className="size-5" />
            </Modal.Icon>
            <Modal.Heading className="text-white">File Access Required</Modal.Heading>
          </Modal.Header>

          <Modal.Body className="px-6 py-4 space-y-3 bg-transparent">
            <p className="text-sm text-white/70">
              This session was saved with the file:
            </p>
            {fileName && (
              <p className="text-sm text-white font-medium bg-white/5 px-3 py-2 rounded truncate">
                {fileName}
              </p>
            )}
            <p className="text-sm text-white/70">
              Click "Allow Access" to grant permission to read this file.
            </p>
          </Modal.Body>

          <Modal.Footer className="px-6 py-4 flex flex-wrap justify-end gap-2 border-t border-white/10 bg-transparent">
            <Button
              size="sm"
              variant="secondary"
              onPress={onCancel}
              className="!bg-white/10 !border-white/20 !text-white text-xs"
            >
              Cancel
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onPress={onSelectDifferentFile}
              className="!bg-white/10 !border-white/20 !text-white text-xs whitespace-nowrap"
            >
              Select File
            </Button>

            <Button
              size="sm"
              variant="primary"
              onPress={onGrantPermission}
              className="!bg-blue-600 !border-blue-500 !text-white text-xs whitespace-nowrap"
            >
              Allow Access
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
