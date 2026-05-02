import { createContext, useContext } from 'react';

export interface SessionActions {
  onNewVolume: () => void;
  onSaveSession: () => Promise<void>;
  onSaveSessionAs: () => void;
  onLoadSession: () => void;
  onExportSession: () => void;
  onImportSession: () => void;
}

export const SessionActionsContext = createContext<SessionActions | null>(null);

export function useSessionActions(): SessionActions {
  const ctx = useContext(SessionActionsContext);
  if (!ctx) throw new Error('useSessionActions must be used inside SessionManager');
  return ctx;
}
