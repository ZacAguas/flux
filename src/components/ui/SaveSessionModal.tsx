import { BookmarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@heroui/react';
import { useState } from 'react';
import { AppModal, ModalHeader, ModalIcon, ModalTitle, ModalBody, ModalFooter } from './AppModal';

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
      setSessionName('');
    }
  };

  const handleCancel = () => {
    setSessionName('');
    onCancel();
  };

  return (
    <AppModal isOpen={isOpen} onClose={handleCancel} maxWidth="max-w-md">
      <ModalHeader>
        <ModalIcon className="bg-white/10 text-white/70">
          <BookmarkIcon className="size-4" />
        </ModalIcon>
        <ModalTitle>Save Session As</ModalTitle>
      </ModalHeader>

      <ModalBody className="space-y-4">
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
              if (e.key === 'Enter' && sessionName.trim()) handleSave();
              else if (e.key === 'Escape') handleCancel();
            }}
            placeholder="My Analysis Session"
            autoFocus
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-sm text-white
                       placeholder-white/40 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="text-xs text-white/50 space-y-1">
          <p>
            <span className="font-medium text-white/60">Volume:</span>{' '}
            {volumeFileName || 'Unknown'}
          </p>
          <p>
            <span className="font-medium text-white/60">Date:</span>{' '}
            {new Date().toLocaleString()}
          </p>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button size="sm" variant="secondary" onPress={handleCancel}
          className="!bg-white/10 !border-white/20 !text-white text-xs">
          Cancel
        </Button>
        <Button size="sm" variant="primary" onPress={handleSave}
          isDisabled={!sessionName.trim()}
          className="!bg-blue-600 !border-blue-500 !text-white text-xs disabled:!opacity-40 disabled:cursor-not-allowed">
          Save
        </Button>
      </ModalFooter>
    </AppModal>
  );
}
