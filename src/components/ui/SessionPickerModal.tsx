/**
 * Session Picker Modal
 *
 * Lists all saved sessions and allows user to load or delete them.
 */

import { FolderOpenIcon } from '@heroicons/react/24/outline';
import { Modal, Button } from '@heroui/react';
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
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <Modal.Backdrop variant="blur" isDismissable>
        <Modal.Container scroll="inside">
        <Modal.Dialog className="max-w-2xl max-h-[80vh] bg-neutral-900 border border-white/20">
          <Modal.Header className="px-6 py-4 border-b border-white/10 bg-transparent !flex-row !items-center gap-3">
            <Modal.Icon className="bg-white/10 text-white/70">
              <FolderOpenIcon className="size-5" />
            </Modal.Icon>
            <Modal.Heading className="text-white">Load Session</Modal.Heading>
          </Modal.Header>

          <Modal.Body className="px-6 py-4 bg-transparent">
            {sessions.length === 0 ? (
              <p className="text-sm text-white/50 text-center py-8">
                No saved sessions found. Save your current session to see it here.
              </p>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="border border-white/10 rounded-md p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Thumbnail */}
                      <div className="flex-shrink-0">
                        {session.thumbnail ? (
                          <img
                            src={session.thumbnail}
                            alt=""
                            className="w-16 h-16 rounded object-cover bg-white/5"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded bg-white/5 flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-white/20"
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-white truncate">
                            {session.name}
                          </h3>
                          {session.isAutoSave && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-600/20 text-blue-400 rounded border border-blue-500/30">
                              AUTO
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/50 mt-1 truncate">
                          Volume: {session.volumeFileName}
                        </p>
                        <p className="text-xs text-white/40 mt-1">
                          {formatDate(session.timestamp)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="primary"
                          onPress={() => onLoad(session.id)}
                          className="!bg-blue-600 !border-blue-500 !text-white text-xs"
                        >
                          Load
                        </Button>

                        {!session.isAutoSave && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onPress={() => onDelete(session.id)}
                            className="!bg-red-600/20 !border-red-500/30 !text-red-400 text-xs hover:!bg-red-600/30"
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Modal.Body>

          <Modal.Footer className="px-6 py-4 flex justify-end border-t border-white/10 bg-transparent">
            <Button
              size="sm"
              variant="secondary"
              onPress={onClose}
              className="!bg-white/10 !border-white/20 !text-white text-xs"
            >
              Cancel
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
