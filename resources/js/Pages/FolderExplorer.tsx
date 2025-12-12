import React, { useState, useEffect } from 'react';
import {
  Folder,
  File,
  FileCode,
  FileImage,
  FileText,
  FileVideo,
  FileMusic,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  HardDrive
} from 'lucide-react';

// Komponen Utilitas untuk Icon File yang Unik
const getFileIcon = (name: string) => {
  const ext = name?.split('.')?.pop()?.toLowerCase() ?? '';

  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return <FileImage className="w-4 h-4 text-purple-400" />;
  if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'php'].includes(ext)) return <FileCode className="w-4 h-4 text-yellow-400" />;
  if (['md', 'txt', 'rtf'].includes(ext)) return <FileText className="w-4 h-4 text-blue-400" />;
  if (['mp4', 'mov', 'avi'].includes(ext)) return <FileVideo className="w-4 h-4 text-red-400" />;
  if (['mp3', 'wav'].includes(ext)) return <FileMusic className="w-4 h-4 text-green-400" />;

  return <File className="w-4 h-4 text-gray-400" />;
};

// Komponen Node (File atau Folder)
const FileSystemNode = ({ handle, level = 0 }: { handle: FileSystemHandle; level?: number }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<FileSystemHandle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fungsi untuk membaca isi folder
  const fetchChildren = async () => {
    if (children.length > 0) return; // Sudah dimuat
    if (handle.kind !== 'directory') return;

    setIsLoading(true);
    setError(null);

    try {
      const entries: FileSystemHandle[] = [];
      // Iterator async untuk membaca handle
      for await (const entry of (handle as any).values()) {
        entries.push(entry);
      }

      // Sort: Folder dulu, baru File, lalu abjad
      entries.sort((a, b) => {
        if (a.kind === b.kind) return a.name.localeCompare(b.name);
        return a.kind === 'directory' ? -1 : 1;
      });

      setChildren(entries);
    } catch (err) {
      console.error("Gagal membaca folder:", err);
      setError("Akses ditolak atau error.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = async () => {
    if (handle.kind === 'directory') {
      const nextState = !isExpanded;
      setIsExpanded(nextState);
      if (nextState) {
        await fetchChildren();
      }
    }
  };

  // Indentasi visual berdasarkan level kedalaman
  const paddingLeft = `${level * 1.5}rem`;

  return (
    <div className="select-none">
      <div
        className={`
          flex items-center py-1.5 px-2 cursor-pointer 
          hover:bg-slate-700/50 transition-colors border-l-2 border-transparent
          ${isExpanded ? 'border-l-blue-500 bg-slate-800' : ''}
        `}
        style={{ paddingLeft }}
        onClick={toggleExpand}
      >
        {/* Indikator Expand/Collapse */}
        <span className="mr-1 text-slate-500 w-4 h-4 flex items-center justify-center">
          {handle.kind === 'directory' && (
            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          )}
        </span>

        {/* Icon Folder/File */}
        <span className="mr-2">
          {handle.kind === 'directory' ? (
            isExpanded ? <FolderOpen className="w-4 h-4 text-blue-400" /> : <Folder className="w-4 h-4 text-blue-300" />
          ) : (
            getFileIcon(handle.name)
          )}
        </span>

        {/* Nama File */}
        <span className={`text-sm truncate ${handle.kind === 'directory' ? 'font-medium text-slate-200' : 'text-slate-400'}`}>
          {handle.name}
        </span>

        {/* Loading Indicator */}
        {isLoading && <span className="ml-2 text-xs text-yellow-500 animate-pulse">Loading...</span>}
      </div>

      {/* Render Children (Recursive) */}
      {isExpanded && !error && (
        <div className="border-l border-slate-700 ml-4">
          {children.length === 0 && !isLoading ? (
            <div className="pl-8 py-1 text-xs text-slate-600 italic">Folder kosong</div>
          ) : (
            children.map((childHandle) => (
              <FileSystemNode key={childHandle.name} handle={childHandle} level={level + 1} />
            ))
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="pl-8 py-1 text-xs text-red-400 italic">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};

export default function FolderExplorer() {
  const [rootHandle, setRootHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [error, setError] = useState('');

  const handleOpenFolder = async () => {
    try {
      // API Modern untuk akses file system
      const handle = await window.showDirectoryPicker();
      setRootHandle(handle);
      setError('');
    } catch (err) {
      if (err instanceof Error) {
        if (err.name !== 'AbortError') {
          setError('Browser kamu mungkin tidak mendukung API ini atau izin ditolak.');
          console.error(err);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 rounded-lg">
            <HardDrive className="text-blue-400 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              DevExplorer
            </h1>
            <p className="text-xs text-slate-500">Local File System Viewer</p>
          </div>
        </div>

        <button
          onClick={handleOpenFolder}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 shadow-lg shadow-blue-900/20"
        >
          <FolderOpen size={16} />
          Buka Folder
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {!rootHandle ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
            <Folder className="w-16 h-16 opacity-20" />
            <p className="text-lg font-medium">Belum ada folder yang dibuka</p>
            <p className="text-sm max-w-xs text-center">
              Klik tombol "Buka Folder" di pojok kanan atas untuk mulai menelusuri file lokal kamu.
            </p>
          </div>
        ) : (
          <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden max-w-4xl mx-auto min-h-[500px]">
            <div className="p-3 border-b border-slate-800 bg-slate-800/50 text-xs font-mono text-slate-400 flex items-center gap-2">
              <span className="bg-slate-700 px-1.5 rounded">ROOT</span>
              {rootHandle.name}
            </div>
            <div className="p-2 overflow-x-auto">
              <FileSystemNode handle={rootHandle} />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-slate-600 border-t border-slate-900/50">
        Dibuat untuk Dika • Menggunakan File System Access API
      </footer>
    </div>
  );
}