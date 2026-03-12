/**
 * Auto-Save Restore Modal
 *
 * Prompts user to restore a previous auto-saved session on app startup.
 * Shows timestamp and volume filename for context.
 */

import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { Modal, Button } from '@heroui/react';

interface AutoSaveRestoreModalProps {
  isOpen: boolean;
  timestamp: number | null;
  volumeFileName: string | null;
  thumbnail: string | null;
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
  thumbnail,
  onRestore,
  onDismiss,
}: AutoSaveRestoreModalProps) {
  return (
    <Modal isOpen={isOpen} onOpenChange={(open: boolean) => !open && onDismiss()}>
      <Modal.Backdrop variant="blur" isDismissable>
        <Modal.Container>
        <Modal.Dialog className="max-w-lg bg-neutral-900 border border-white/20">
          <Modal.Header className="px-6 py-4 border-b border-white/10 bg-transparent !flex-row !items-center gap-3">
            <Modal.Icon className="bg-blue-500/20 text-blue-400">
              <ArrowPathIcon className="size-5" />
            </Modal.Icon>
            <Modal.Heading className="text-white">Restore Previous Session?</Modal.Heading>
          </Modal.Header>

          <Modal.Body className="px-6 py-4 space-y-3 bg-transparent">
            <p className="text-sm text-white/70">
              An auto-saved session was found:
            </p>

            <div className="flex gap-4 items-start">
              {/* Thumbnail */}
              <div className="flex-shrink-0">
                {thumbnail ? (
                  <img
                    src={thumbnail}
                    alt=""
                    className="w-20 h-20 rounded object-cover bg-white/5"
                  />
                ) : (
                  <div className="w-20 h-20 rounded bg-white/5 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-white/20"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Session info */}
              <div className="flex-1 min-w-0 space-y-1">
                {volumeFileName && (
                  <p className="text-sm text-white font-medium truncate">
                    {volumeFileName}
                  </p>
                )}
                {timestamp && (
                  <p className="text-sm text-white/50">
                    Saved {formatTimestamp(timestamp)}
                  </p>
                )}
              </div>
            </div>

            <p className="text-sm text-white/70">
              Would you like to restore this session?
            </p>
          </Modal.Body>

          <Modal.Footer className="px-6 py-4 flex justify-end gap-3 border-t border-white/10 bg-transparent">
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
      </Modal.Backdrop>
    </Modal>
  );
}
