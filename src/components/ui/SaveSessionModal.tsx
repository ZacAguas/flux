/**
 * Save Session Modal
 *
 * Prompts user to name a session before saving.
 */

import { Modal, Button, useOverlayState } from '@heroui/react';
import { useState } from 'react';

interface SaveSessionModalProps {
  isOpen: boolean;
  volumeFileName: string | null;
  onSave: (name: string) => void;
  onCancel: () => void;
}

export function SaveSessionModal({
  isOpen,
  volumeFileName,
  onSave,
  onCancel,
}: SaveSessionModalProps) {
  const [sessionName, setSessionName] = useState('');

  const handleSave = () => {
    if (sessionName.trim()) {
      onSave(sessionName.trim());
      setSessionName(''); // Reset for next time
    }
  };

  const handleCancel = () => {
    setSessionName(''); // Reset on cancel
    onCancel();
  };

  const state = useOverlayState({
    isOpen,
    onOpenChange: (open) => !open && handleCancel(),
  });

  return (
    <Modal state={state}>
      <Modal.Container
        isDismissable
        variant="blur"
        className="max-w-md"
      >
        <Modal.Dialog
          style={{
            backgroundColor: 'rgb(23 23 23)', // neutral-900
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
            <h2 className="text-lg font-semibold text-white">Save Session As</h2>
          </Modal.Header>

          <Modal.Body
            className="px-6 py-4 space-y-4"
            style={{ backgroundColor: 'transparent' }}
          >
            <div>
              <label htmlFor="session-name" className="block text-sm font-medium text-white/70 mb-2">
                Session Name
              </label>
              <input
                id="session-name"
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && sessionName.trim()) {
                    handleSave();
                  } else if (e.key === 'Escape') {
                    handleCancel();
                  }
                }}
                placeholder="My Analysis Session"
                autoFocus
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-sm text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="text-xs text-white/50 space-y-1">
              <p>
                <span className="font-medium text-white/60">Volume:</span> {volumeFileName || 'Unknown'}
              </p>
              <p>
                <span className="font-medium text-white/60">Date:</span> {new Date().toLocaleString()}
              </p>
            </div>
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
              onPress={handleCancel}
              className="!bg-white/10 !border-white/20 !text-white text-xs"
            >
              Cancel
            </Button>

            <Button
              size="sm"
              variant="primary"
              onPress={handleSave}
              isDisabled={!sessionName.trim()}
              className="!bg-blue-600 !border-blue-500 !text-white text-xs disabled:!opacity-40 disabled:cursor-not-allowed"
            >
              Save
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal>
  );
}
