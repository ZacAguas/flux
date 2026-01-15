/**
 * Unsaved Changes Modal
 *
 * Prompts user to save unsaved changes before performing a destructive action
 * (loading new volume, loading session, etc.).
 */

import { Modal, Button, useOverlayState } from '@heroui/react';
import { useEffect } from 'react';

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
            <h2 className="text-lg font-semibold text-white">Unsaved Changes</h2>
          </Modal.Header>

          <Modal.Body
            className="px-6 py-4"
            style={{ backgroundColor: 'transparent' }}
          >
            <p className="text-sm text-white/70">
              You have unsaved changes. Would you like to save before continuing?
            </p>
          </Modal.Body>

          <Modal.Footer
            className="px-6 py-4 flex justify-end gap-3"
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
              onPress={onDontSave}
              className="!bg-white/10 !border-white/20 !text-white text-xs"
            >
              Don't Save
            </Button>

            <Button
              size="sm"
              variant="primary"
              onPress={onSave}
              className="!bg-blue-600 !border-blue-500 !text-white text-xs"
            >
              Save
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal>
  );
}
