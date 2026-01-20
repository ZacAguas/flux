/**
 * Auto-Save Restore Modal
 *
 * Prompts user to restore a previous auto-saved session on app startup.
 * Shows timestamp and volume filename for context.
 */

import { Modal, Button, useOverlayState } from '@heroui/react';
import { useEffect } from 'react';

interface AutoSaveRestoreModalProps {
  isOpen: boolean;
  timestamp: number | null;
  volumeFileName: string | null;
  onRestore: () => void;
  onDismiss: () => void;
}

/**
 * Format a timestamp into a human-readable string.
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - timestamp;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Format time
  const timeStr = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  // Format relative date
  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24 && date.getDate() === now.getDate()) {
    return `Today at ${timeStr}`;
  } else if (diffDays === 1 || (diffHours < 48 && date.getDate() === now.getDate() - 1)) {
    return `Yesterday at ${timeStr}`;
  } else if (diffDays < 7) {
    const dayName = date.toLocaleDateString(undefined, { weekday: 'long' });
    return `${dayName} at ${timeStr}`;
  } else {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}

export function AutoSaveRestoreModal({
  isOpen,
  timestamp,
  volumeFileName,
  onRestore,
  onDismiss,
}: AutoSaveRestoreModalProps) {
  const state = useOverlayState({
    isOpen,
    onOpenChange: (open) => {
      if (!open) {
        onDismiss();
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
            <h2 className="text-lg font-semibold text-white">Restore Previous Session?</h2>
          </Modal.Header>

          <Modal.Body
            className="px-6 py-4 space-y-3"
            style={{ backgroundColor: 'transparent' }}
          >
            <p className="text-sm text-white/70">
              An auto-saved session was found:
            </p>
            {volumeFileName && (
              <p className="text-sm text-white font-medium bg-white/5 px-3 py-2 rounded truncate">
                {volumeFileName}
              </p>
            )}
            {timestamp && (
              <p className="text-sm text-white/50">
                Saved {formatTimestamp(timestamp)}
              </p>
            )}
            <p className="text-sm text-white/70">
              Would you like to restore this session?
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
              onPress={onDismiss}
              className="!bg-white/10 !border-white/20 !text-white text-xs"
            >
              Dismiss
            </Button>

            <Button
              size="sm"
              variant="primary"
              onPress={onRestore}
              className="!bg-blue-600 !border-blue-500 !text-white text-xs"
            >
              Restore
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal>
  );
}
