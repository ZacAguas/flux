/**
 * Unsaved Changes Modal
 *
 * Prompts user to save unsaved changes before performing a destructive action
 * (loading new volume, loading session, etc.).
 */

import { AlertDialog, Button } from '@heroui/react';

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
    <AlertDialog isOpen={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialog.Container backdropVariant="blur" isDismissable>
        <AlertDialog.Dialog
          className="max-w-md bg-neutral-900 border border-white/20"
        >
          <AlertDialog.CloseTrigger className="!text-white/70 hover:!text-white" />
          <AlertDialog.Header className="px-6 py-4 border-b border-white/10 bg-transparent !flex-row !items-center gap-3">
            <AlertDialog.Icon status="warning" />
            <AlertDialog.Heading className="text-white">Unsaved Changes</AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body className="px-6 py-4 bg-transparent">
            <p className="text-white/70">You have unsaved changes. Would you like to save before continuing?</p>
          </AlertDialog.Body>
          <AlertDialog.Footer className="px-6 py-4 flex justify-end gap-3 border-t border-white/10 bg-transparent">
            <Button size="sm" variant="tertiary" className="!bg-white/10 !border-white/20 !text-white text-xs" onPress={onCancel}>
              Cancel
            </Button>
            <Button size="sm" variant="tertiary" className="!bg-white/10 !border-white/20 !text-white text-xs" onPress={onDontSave}>
              Don&apos;t Save
            </Button>
            <Button size="sm" variant="primary" className="!bg-blue-600 !border-blue-500 !text-white text-xs" onPress={onSave}>
              Save
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog>
  );
}
