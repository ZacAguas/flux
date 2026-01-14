/**
 * Session Picker Modal
 *
 * Lists all saved sessions and allows user to load or delete them.
 */

import { Modal, Button, useOverlayState } from '@heroui/react';
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

  const state = useOverlayState({
    isOpen,
    onOpenChange: (open) => !open && onClose(),
  });

  return (
    <Modal state={state}>
      <Modal.Container
        isDismissable
        variant="blur"
        scroll="inside"
        className="max-w-2xl max-h-[80vh]"
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
            <h2 className="text-lg font-semibold text-white">Load Session</h2>
          </Modal.Header>

          <Modal.Body
            className="px-6 py-4"
            style={{ backgroundColor: 'transparent' }}
          >
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

          <Modal.Footer
            className="px-6 py-4 flex justify-end"
            style={{
              borderTop: '1px solid rgba(255 255 255 / 0.1)',
              backgroundColor: 'transparent',
            }}
          >
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
    </Modal>
  );
}
