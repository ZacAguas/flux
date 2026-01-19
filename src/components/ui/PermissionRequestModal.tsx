/**
 * Permission Request Modal
 *
 * Prompts user to grant file access permission when loading a session
 * with a stored FileSystemFileHandle. Requires a user gesture to request permission.
 */

import { Modal, Button, useOverlayState } from '@heroui/react';
import { useEffect } from 'react';

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
  const state = useOverlayState({
    isOpen,
    onOpenChange: (open) => {
      if (!open) {
        onCancel();
      }
    },
  });

  // Force sync state when isOpen changes
  useEffect(() => {
    if (!isOpen && state.isOpen) {
      state.setOpen(false);
    }
  }, [isOpen, state]);

  if (!isOpen) {
    return null;
  }

  return (
    <Modal state={state}>
      <Modal.Container
        isDismissable
        variant="blur"
        className="max-w-md"
      >
        <Modal.Dialog
          style={{
            backgroundColor: 'rgb(23 23 23)',
            borderColor: 'rgba(255 255 255 / 0.2)',
            borderWidth: '1px',
            borderRadius: '0.5rem',
          }}
        >
          <Modal.Header
            className="px-6 py-4"
            style={{
              borderBottom: '1px solid rgba(255 255 255 / 0.1)',
              backgroundColor: 'transparent',
            }}
          >
            <h2 className="text-lg font-semibold text-white">File Access Required</h2>
          </Modal.Header>

          <Modal.Body
            className="px-6 py-4 space-y-3"
            style={{ backgroundColor: 'transparent' }}
          >
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

          <Modal.Footer
            className="px-6 py-4 flex flex-wrap justify-end gap-2"
            style={{
              borderTop: '1px solid rgba(255 255 255 / 0.1)',
              backgroundColor: 'transparent',
            }}
          >
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
    </Modal>
  );
}
