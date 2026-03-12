/**
 * Save Session Modal
 *
 * Prompts user to name a session before saving.
 */

import { Modal, Button } from '@heroui/react';
import { BookmarkIcon } from '@heroicons/react/24/outline';
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

  return (
    <Modal isOpen={isOpen} onOpenChange={(open: boolean) => !open && handleCancel()}>
      <Modal.Container variant="blur" isDismissable>
        <Modal.Dialog className="max-w-md bg-neutral-900 border border-white/20">
          <Modal.Header className="px-6 py-4 border-b border-white/10 bg-transparent !flex-row !items-center gap-3">
            <Modal.Icon className="bg-white/10 text-white/70">
              <BookmarkIcon className="size-5" />
            </Modal.Icon>
            <Modal.Heading className="text-white">Save Session As</Modal.Heading>
          </Modal.Header>

          <Modal.Body className="px-6 py-4 space-y-4 bg-transparent">
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

          <Modal.Footer className="px-6 py-4 flex justify-end gap-3 border-t border-white/10 bg-transparent">
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
