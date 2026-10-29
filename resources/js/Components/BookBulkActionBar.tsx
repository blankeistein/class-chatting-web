import React from "react";
import { Button, Menu, Typography } from "@material-tailwind/react";
import {
  FileTextIcon,
  GlobeIcon,
  LoaderCircleIcon,
  LockIcon,
  Trash2Icon,
  UnlockIcon,
  XIcon,
} from "lucide-react";

export interface BookBulkActionBarProps {
  selectedCount: number;
  isProcessing?: boolean;
  onUpdateStatus: (status: "publish" | "draft") => void;
  onUpdateLock: (lock: boolean) => void;
  onDelete: () => void;
  onClearSelection: () => void;
}

export function BookBulkActionBar({
  selectedCount,
  isProcessing = false,
  onUpdateStatus,
  onUpdateLock,
  onDelete,
  onClearSelection,
}: BookBulkActionBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-2xl animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-700/80 bg-slate-900/95 p-3 text-white shadow-2xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex items-center gap-2.5 pl-1">
          <span className="inline-flex h-7 items-center justify-center rounded-lg bg-sky-500/20 px-2.5 text-xs font-bold text-sky-400">
            {selectedCount} dipilih
          </span>
          <Typography variant="small" className="hidden text-xs font-medium text-slate-300 sm:inline">
            Aksi massal:
          </Typography>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Status Dropdown */}
          <Menu placement="top-end">
            <Menu.Trigger
              as={Button}
              size="sm"
              variant="outline"
              color="secondary"
              className="border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white"
              disabled={isProcessing}
            >
              <FileTextIcon className="mr-1.5 h-3.5 w-3.5 text-sky-400" />
              Status
            </Menu.Trigger>
            <Menu.Content>
              <Menu.Item onClick={() => onUpdateStatus("publish")}>
                <GlobeIcon className="mr-2 h-4 w-4 text-emerald-500" />
                Publish
              </Menu.Item>
              <Menu.Item onClick={() => onUpdateStatus("draft")}>
                <FileTextIcon className="mr-2 h-4 w-4 text-amber-500" />
                Draft
              </Menu.Item>
            </Menu.Content>
          </Menu>

          {/* Lock Dropdown */}
          <Menu placement="top-end">
            <Menu.Trigger
              as={Button}
              size="sm"
              variant="outline"
              color="secondary"
              className="border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white"
              disabled={isProcessing}
            >
              <LockIcon className="mr-1.5 h-3.5 w-3.5 text-amber-400" />
              Lock
            </Menu.Trigger>
            <Menu.Content>
              <Menu.Item onClick={() => onUpdateLock(true)}>
                <LockIcon className="mr-2 h-4 w-4 text-rose-500" />
                Kunci Semua
              </Menu.Item>
              <Menu.Item onClick={() => onUpdateLock(false)}>
                <UnlockIcon className="mr-2 h-4 w-4 text-emerald-500" />
                Buka Kunci Semua
              </Menu.Item>
            </Menu.Content>
          </Menu>

          {/* Delete Button */}
          <Button
            size="sm"
            color="error"
            className="flex items-center gap-1.5"
            onClick={onDelete}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <LoaderCircleIcon className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2Icon className="h-3.5 w-3.5" />
            )}
            Hapus
          </Button>

          {/* Cancel Button */}
          <Button
            size="sm"
            variant="ghost"
            className="text-slate-400 hover:bg-slate-800 hover:text-white p-2"
            onClick={onClearSelection}
            disabled={isProcessing}
            title="Batal pilih"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default BookBulkActionBar;
