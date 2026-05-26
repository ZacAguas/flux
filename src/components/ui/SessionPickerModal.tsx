import { FolderOpenIcon } from '@heroicons/react/24/outline';
import { Button } from '@heroui/react';
import { AppModal, ModalHeader, ModalIcon, ModalTitle, ModalBody, ModalFooter } from './AppModal';
import type { SavedSessionMetadata } from '../../types/session';

interface SessionPickerModalProps {
  isOpen: boolean;
  sessions: SavedSessionMetadata[];
  onLoad: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  onClose: () => void;
}

export function SessionPickerModal({
  isOpen,
  sessions,
  onLoad,
  onDelete,
  onClose,
}: SessionPickerModalProps) {
  const formatDate = (timestamp: number) => new Date(timestamp).toLocaleString();

  return (
    <AppModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl" heightClass="max-h-[80vh]">
      <ModalHeader>
        <ModalIcon className="bg-white/10 text-white/70">
          <FolderOpenIcon className="size-4" />
        </ModalIcon>
        <ModalTitle>Load Session</ModalTitle>
      </ModalHeader>

      <ModalBody>
        {sessions.length === 0 ? (
          <p className="text-sm text-white/50 text-center py-8">
            No saved sessions found. Save your current session to see it here.
          </p>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="border border-white/10 rounded-md p-3 sm:p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Thumbnail — hidden on very narrow mobile */}
                  <div className="hidden sm:block flex-shrink-0">
                    {session.thumbnail ? (
                      <img src={session.thumbnail} alt=""
                        className="w-14 h-14 rounded object-cover bg-white/5" />
                    ) : (
                      <div className="w-14 h-14 rounded bg-white/5 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Session info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-medium text-white truncate">{session.name}</h3>
                      {session.isAutoSave && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-600/20 text-blue-400 rounded border border-blue-500/30">
                          AUTO
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/50 mt-1 truncate">
                      Volume: {session.volumeFileName}
                    </p>
                    <p className="text-xs text-white/40 mt-0.5">{formatDate(session.timestamp)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5 flex-shrink-0">
                    <Button size="sm" variant="primary" onPress={() => onLoad(session.id)}
                      className="!bg-blue-600 !border-blue-500 !text-white text-xs">
                      Load
                    </Button>
                    {!session.isAutoSave && (
                      <Button size="sm" variant="secondary" onPress={() => onDelete(session.id)}
                        className="!bg-red-600/20 !border-red-500/30 !text-red-400 text-xs hover:!bg-red-600/30">
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <Button size="sm" variant="secondary" onPress={onClose}
          className="!bg-white/10 !border-white/20 !text-white text-xs">
          Cancel
        </Button>
      </ModalFooter>
    </AppModal>
  );
}
