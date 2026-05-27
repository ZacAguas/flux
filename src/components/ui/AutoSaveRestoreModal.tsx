import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { Button } from '@heroui/react';
import { AppModal, ModalHeader, ModalIcon, ModalTitle, ModalBody, ModalFooter } from './AppModal';

interface AutoSaveRestoreModalProps {
  isOpen: boolean;
  timestamp: number | null;
  volumeFileName: string | null;
  thumbnail: string | null;
  onRestore: () => void;
  onDismiss: () => void;
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - timestamp;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const timeStr = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24 && date.getDate() === now.getDate()) return `Today at ${timeStr}`;
  if (diffDays === 1 || (diffHours < 48 && date.getDate() === now.getDate() - 1)) return `Yesterday at ${timeStr}`;
  if (diffDays < 7) return `${date.toLocaleDateString(undefined, { weekday: 'long' })} at ${timeStr}`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
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
    <AppModal isOpen={isOpen} onClose={onDismiss} maxWidth="max-w-md">
      <ModalHeader>
        <ModalIcon className="bg-blue-500/20 text-blue-400">
          <ArrowPathIcon className="size-4" />
        </ModalIcon>
        <ModalTitle>Restore Previous Session?</ModalTitle>
      </ModalHeader>

      <ModalBody>
        <p className="text-sm text-black/60 dark:text-white/70 mb-4">An auto-saved session was found:</p>

        <div className="flex gap-4 items-start mb-4">
          <div className="flex-shrink-0">
            {thumbnail ? (
              <img src={thumbnail} alt="" className="w-20 h-20 rounded object-cover bg-black/5 dark:bg-white/5" />
            ) : (
              <div className="w-20 h-20 rounded bg-black/5 dark:bg-white/5 flex items-center justify-center">
                <svg className="w-8 h-8 text-black/20 dark:text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            {volumeFileName && (
              <p className="text-sm text-black dark:text-white font-medium truncate">{volumeFileName}</p>
            )}
            {timestamp && (
              <p className="text-sm text-black/50 dark:text-white/50">Saved {formatTimestamp(timestamp)}</p>
            )}
          </div>
        </div>

        <p className="text-sm text-black/60 dark:text-white/70">Would you like to restore this session?</p>
      </ModalBody>

      <ModalFooter>
        <Button size="sm" variant="secondary" onPress={onDismiss}
          className="!bg-black/8 dark:!bg-white/10 !border-black/15 dark:!border-white/20 !text-black dark:!text-white text-xs">
          Dismiss
        </Button>
        <Button size="sm" variant="primary" onPress={onRestore}
          className="!bg-blue-600 !border-blue-500 !text-white text-xs">
          Restore
        </Button>
      </ModalFooter>
    </AppModal>
  );
}
