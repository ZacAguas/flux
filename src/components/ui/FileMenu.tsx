/**
 * File Menu Component
 *
 * Dropdown menu for file operations: New, Save, Load, Export, Import.
 */

import { Button, Kbd } from '@heroui/react';
import { useViewerStore } from '../../store/viewerStore';
import { useState } from 'react';

interface FileMenuProps {
  onNewVolume?: () => void;
  onSaveSession?: () => void;
  onSaveSessionAs?: () => void;
  onLoadSession?: () => void;
  onExportSession?: () => void;
  onImportSession?: () => void;
}

export function FileMenu({
  onNewVolume,
  onSaveSession,
  onSaveSessionAs,
  onLoadSession,
  onExportSession,
  onImportSession,
}: FileMenuProps) {
  const isDirty = useViewerStore((state) => state.isDirty);
  const currentSessionName = useViewerStore((state) => state.currentSessionName);
  const volumeFileMetadata = useViewerStore((state) => state.volumeFileMetadata);
  const [isOpen, setIsOpen] = useState(false);

  const hasVolume = volumeFileMetadata !== null;

  return (
    <div className="flex flex-col gap-2 min-w-fit">
      <span className="text-xs font-semibold text-white/70 uppercase tracking-wide">
        File
      </span>

      <div className="relative">
        <Button
          size="sm"
          variant="secondary"
          onPress={() => setIsOpen(!isOpen)}
          className="!bg-white/10 backdrop-blur-sm !border !border-white/20 !text-white text-xs px-3 py-1"
        >
          <span className="flex items-center gap-1">
            {currentSessionName || 'Menu'}
            {isDirty && <span className="text-yellow-400">*</span>}
            <span className="text-white/50">▼</span>
          </span>
        </Button>

        {isOpen && (
          <div
            className="absolute top-full mt-1 left-0 z-[100] bg-neutral-900 border border-white/20 rounded-md shadow-lg min-w-[200px]"
            onMouseLeave={() => setIsOpen(false)}
          >
            <div className="py-1">
              {/* New Volume */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNewVolume?.();
                }}
                className="w-full text-left px-3 py-2 text-white text-xs hover:bg-white/10 flex items-center justify-between"
              >
                <span>New Volume...</span>
                <Kbd className="text-[10px] text-white/70 bg-white/5 backdrop-blur-sm rounded-md px-2 py-1">
                  <Kbd.Abbr keyValue="command" />
                  <Kbd.Content>N</Kbd.Content>
                </Kbd>
              </button>

              {/* Divider */}
              <div className="border-t border-white/10 my-1" />

              {/* Save Session */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  onSaveSession?.();
                }}
                disabled={!hasVolume}
                className="w-full text-left px-3 py-2 text-white text-xs hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-between"
              >
                <span>Save Session</span>
                <Kbd className="text-[10px] text-white/70 bg-white/5 backdrop-blur-sm rounded-md px-2 py-1">
                  <Kbd.Abbr keyValue="command" />
                  <Kbd.Content>S</Kbd.Content>
                </Kbd>
              </button>

              {/* Save Session As */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  onSaveSessionAs?.();
                }}
                disabled={!hasVolume}
                className="w-full text-left px-3 py-2 text-white text-xs hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-between"
              >
                <span>Save Session As...</span>
                <Kbd className="text-[10px] text-white/70 bg-white/5 backdrop-blur-sm rounded-md px-2 py-1">
                  <Kbd.Abbr keyValue="shift" />
                  <Kbd.Abbr keyValue="command" />
                  <Kbd.Content>S</Kbd.Content>
                </Kbd>
              </button>

              {/* Load Session */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  onLoadSession?.();
                }}
                className="w-full text-left px-3 py-2 text-white text-xs hover:bg-white/10 flex items-center justify-between"
              >
                <span>Load Session...</span>
                <Kbd className="text-[10px] text-white/70 bg-white/5 backdrop-blur-sm rounded-md px-2 py-1">
                  <Kbd.Abbr keyValue="command" />
                  <Kbd.Content>O</Kbd.Content>
                </Kbd>
              </button>

              {/* Divider */}
              <div className="border-t border-white/10 my-1" />

              {/* Export Session */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  onExportSession?.();
                }}
                disabled={!hasVolume}
                className="w-full text-left px-3 py-2 text-white text-xs hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Export Session...
              </button>

              {/* Import Session */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  onImportSession?.();
                }}
                className="w-full text-left px-3 py-2 text-white text-xs hover:bg-white/10"
              >
                Import Session...
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
