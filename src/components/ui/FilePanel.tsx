import { DocumentArrowDownIcon, DocumentArrowUpIcon, FolderOpenIcon, DocumentPlusIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { Kbd } from '@heroui/react';
import { useViewerStore } from '../../store/viewerStore';
import { useSessionActions } from '../../context/SessionActionsContext';

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SectionDivider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 my-1">
      <div className="flex-1 h-px bg-white/8" />
      {label && <span className="text-[9px] font-semibold text-white/30 uppercase tracking-wider">{label}</span>}
      <div className="flex-1 h-px bg-white/8" />
    </div>
  );
}

function ActionRow({ icon, label, shortcut, onClick, disabled }: {
  icon: React.ReactNode;
  label: string;
  shortcut?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-left text-xs text-white/70 hover:text-white hover:bg-white/8 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <span className="flex items-center gap-2">
        <span className="w-3.5 h-3.5 text-white/40">{icon}</span>
        {label}
      </span>
      {shortcut}
    </button>
  );
}

export function FilePanel() {
  const volumeFileMetadata = useViewerStore((state) => state.volumeFileMetadata);
  const currentSessionName = useViewerStore((state) => state.currentSessionName);
  const isDirty = useViewerStore((state) => state.isDirty);
  const actions = useSessionActions();

  const displayName = currentSessionName ?? volumeFileMetadata?.fileName?.replace(/\.nii(\.gz)?$/i, '') ?? 'Untitled';

  const kbdClass = 'text-[10px] text-white/40 bg-white/5 rounded px-1.5 py-0.5';

  return (
    <div className="flex flex-col gap-1">
      {/* File card */}
      {volumeFileMetadata && (
        <div className="px-3 py-2.5 bg-white/5 rounded-lg border border-white/8 mb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-medium text-white/90 truncate">{displayName}</div>
              <div className="text-[10px] text-white/35 mt-0.5">{volumeFileMetadata.fileName} · {formatBytes(volumeFileMetadata.fileSize)}</div>
            </div>
            {isDirty && (
              <span className="text-[9px] font-semibold text-yellow-400/80 uppercase tracking-wider shrink-0 mt-0.5">unsaved</span>
            )}
          </div>
        </div>
      )}

      <SectionDivider label="File" />

      <ActionRow
        icon={<DocumentPlusIcon />}
        label="New Volume"
        shortcut={<Kbd className={kbdClass}><Kbd.Abbr keyValue="command" /><Kbd.Content>N</Kbd.Content></Kbd>}
        onClick={actions.onNewVolume}
      />

      <SectionDivider label="Session" />

      <ActionRow
        icon={<BookmarkIcon />}
        label="Save Session"
        shortcut={<Kbd className={kbdClass}><Kbd.Abbr keyValue="command" /><Kbd.Content>S</Kbd.Content></Kbd>}
        onClick={actions.onSaveSession}
        disabled={!volumeFileMetadata}
      />
      <ActionRow
        icon={<BookmarkIcon />}
        label="Save As…"
        shortcut={<Kbd className={kbdClass}><Kbd.Abbr keyValue="shift" /><Kbd.Abbr keyValue="command" /><Kbd.Content>S</Kbd.Content></Kbd>}
        onClick={actions.onSaveSessionAs}
        disabled={!volumeFileMetadata}
      />
      <ActionRow
        icon={<FolderOpenIcon />}
        label="Load Session"
        shortcut={<Kbd className={kbdClass}><Kbd.Abbr keyValue="command" /><Kbd.Content>O</Kbd.Content></Kbd>}
        onClick={actions.onLoadSession}
      />

      <SectionDivider label="Export" />

      <div className="flex gap-2 px-1">
        <button
          onClick={actions.onExportSession}
          disabled={!volumeFileMetadata}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/8 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <DocumentArrowDownIcon className="w-3.5 h-3.5" />
          Export
        </button>
        <button
          onClick={actions.onImportSession}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/8 transition-colors"
        >
          <DocumentArrowUpIcon className="w-3.5 h-3.5" />
          Import
        </button>
      </div>
    </div>
  );
}
