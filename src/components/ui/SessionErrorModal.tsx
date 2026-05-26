import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '@heroui/react';
import { AppModal, ModalHeader, ModalIcon, ModalTitle, ModalBody, ModalFooter } from './AppModal';
import type { SessionError, VolumeValidationResult } from '../../types/session';

interface SessionErrorModalProps {
  isOpen: boolean;
  error: SessionError | null;
  validationResult?: VolumeValidationResult;
  onClose: () => void;
  onRetry?: () => void;
  onForceLoad?: () => void;
}

export function SessionErrorModal({
  isOpen,
  error,
  validationResult,
  onClose,
  onRetry,
  onForceLoad,
}: SessionErrorModalProps) {
  if (!error) return null;

  const isFileMismatch = error.type === 'file-mismatch' && !!validationResult;

  const getErrorTitle = () => {
    switch (error.type) {
      case 'file-not-found':       return 'Volume File Not Found';
      case 'file-mismatch':        return 'Volume File Mismatch';
      case 'indexeddb-error':      return 'Storage Error';
      case 'serialization-error':  return 'Save Error';
      case 'deserialization-error':return 'Load Error';
      case 'quota-exceeded':       return 'Storage Quota Exceeded';
      case 'version-mismatch':     return 'Incompatible Session Version';
      case 'permission-denied':    return 'Permission Denied';
      case 'permission-dismissed': return 'Permission Required';
      case 'handle-invalid':       return 'File Unavailable';
      default:                     return 'Error';
    }
  };

  const getErrorMessage = () =>
    error.type === 'quota-exceeded'
      ? 'Browser storage is full. Delete old sessions to free up space.'
      : error.message;

  return (
    <AppModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <ModalHeader>
        <ModalIcon className="bg-red-500/20 text-red-400">
          <ExclamationTriangleIcon className="size-4" />
        </ModalIcon>
        <ModalTitle>{getErrorTitle()}</ModalTitle>
      </ModalHeader>

      <ModalBody className="space-y-4">
        <p className="text-sm text-white/70">{getErrorMessage()}</p>

        {isFileMismatch && validationResult && (
          <div className="border border-yellow-500/30 bg-yellow-600/10 rounded p-3 space-y-3">
            <p className="text-xs text-yellow-400 font-medium">
              The selected file does not match the session&apos;s original file.
              You can load anyway to apply these settings to a different volume.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <p className="font-medium text-white/70 mb-1">Expected:</p>
                <p className="text-white/50 truncate">{validationResult.expected.fileName}</p>
                <p className="text-white/40">{(validationResult.expected.fileSize / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <div>
                <p className="font-medium text-white/70 mb-1">Actual:</p>
                <p className="text-white/50 truncate">{validationResult.actual.fileName}</p>
                <p className="text-white/40">{(validationResult.actual.fileSize / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
          </div>
        )}

        {Boolean(error.details) && (
          <details className="text-xs">
            <summary className="cursor-pointer text-white/50 hover:text-white/70">
              Technical Details
            </summary>
            <pre className="mt-2 p-2 bg-black/30 rounded overflow-x-auto text-white/40 text-[10px]">
              {typeof error.details === 'string' ? error.details : JSON.stringify(error.details, null, 2)}
            </pre>
          </details>
        )}
      </ModalBody>

      <ModalFooter>
        <Button size="sm" variant="secondary" onPress={onClose}
          className="!bg-white/10 !border-white/20 !text-white text-xs">
          Close
        </Button>
        {onRetry && (
          <Button size="sm" variant="secondary" onPress={() => { onClose(); onRetry(); }}
            className="!bg-white/10 !border-white/20 !text-white text-xs">
            Try Again
          </Button>
        )}
        {isFileMismatch && onForceLoad && (
          <Button size="sm" variant="primary" onPress={() => { onClose(); onForceLoad(); }}
            className="!bg-yellow-600 !border-yellow-500 !text-white text-xs">
            Load Anyway
          </Button>
        )}
      </ModalFooter>
    </AppModal>
  );
}
