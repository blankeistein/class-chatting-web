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
  HardDrive,
  X,
  Maximize2,
  Download,
  Play,
  Pause,
  Image as ImageIcon
} from 'lucide-react';

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const FilePreview = ({ fileHandle, onClose }: { fileHandle: FileSystemFileHandle | null, onClose: () => void }) => {
  const [content, setContent] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'text' | 'video' | 'audio' | 'binary' | 'loading' | 'none'>('none');
  const [fileInfo, setFileInfo] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;

    const loadFile = async () => {
      if (!fileHandle) {
        setFileType('none');
        setFileInfo(null);
        setContent(null);
        return;
      }

      setFileType('loading');
      setError(null);

      try {
        const file = await fileHandle.getFile();
        setFileInfo(file);

        const ext = file.name.split('.').pop()?.toLowerCase() || '';

        if (file.type.startsWith('image/')) {
          setFileType('image');
          objectUrl = URL.createObjectURL(file);
          setContent(objectUrl);
        } else if (file.type.startsWith('video/')) {
          setFileType('video');
          objectUrl = URL.createObjectURL(file);
          setContent(objectUrl);
        } else if (file.type.startsWith('audio/')) {
          setFileType('audio');
          objectUrl = URL.createObjectURL(file);
          setContent(objectUrl);
        } else if (
          file.type.startsWith('text/') ||
          ['js', 'jsx', 'ts', 'tsx', 'json', 'css', 'html', 'md', 'txt', 'php', 'py', 'java', 'c', 'cpp', 'sql', 'xml', 'yml', 'env', 'gitignore'].includes(ext)
        ) {
          setFileType('text');
          const text = await file.text();
          // Limit text preview for performance
          if (text.length > 50000) {
            setContent(text.substring(0, 50000) + '\n... (File too large, truncated)');
          } else {
            setContent(text);
          }
        } else {
          setFileType('binary');
        }
      } catch (err) {
        console.error("Error reading file:", err);
        setError("Gagal membaca file.");
        setFileType('binary'); // Fallback
      }
    };

    loadFile();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileHandle]);

  if (!fileHandle) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 border-l border-slate-800 bg-slate-900/50">
        <FileCode className="w-16 h-16 opacity-20 mb-4" />
        <p className="text-lg font-medium">Pilih file untuk preview</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-800 animate-in slide-in-from-right duration-200">
      {/* Header Preview */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2 bg-slate-700/50 rounded-lg shrink-0">
            {/* Icon based on type */}
            {fileType === 'image' ? <ImageIcon className="w-5 h-5 text-purple-400" /> :
              fileType === 'video' ? <FileVideo className="w-5 h-5 text-red-400" /> :
                fileType === 'audio' ? <FileMusic className="w-5 h-5 text-green-400" /> :
                  <FileText className="w-5 h-5 text-blue-400" />
            }
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-200 truncate" title={fileHandle.name}>{fileHandle.name}</h3>
            {fileInfo && <p className="text-xs text-slate-500">{formatBytes(fileInfo.size)}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content Preview */}
      <div className="flex-1 overflow-auto p-4 relative bg-slate-950/50">
        {fileType === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center text-blue-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
          </div>
        )}

        {error && (
          <div className="text-red-400 bg-red-500/10 p-4 rounded-lg text-sm border border-red-500/20">
            {error}
          </div>
        )}

        {!error && fileType === 'image' && content && (
          <div className="flex items-center justify-center min-w-full min-h-full">
            <img src={content} alt="Preview" className="max-w-full max-h-full object-contain rounded-md shadow-lg" />
          </div>
        )}

        {!error && fileType === 'video' && content && (
          <div className="flex items-center justify-center min-w-full min-h-full">
            <video controls src={content} className="max-w-full max-h-full rounded-md shadow-lg" />
          </div>
        )}

        {!error && fileType === 'audio' && content && (
          <div className="flex flex-col items-center justify-center min-w-full min-h-full gap-4">
            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center">
              <FileMusic className="w-12 h-12 text-slate-600" />
            </div>
            <audio controls src={content} className="w-full max-w-md" />
          </div>
        )}

        {!error && fileType === 'text' && content && (
          <pre className="text-xs font-mono text-slate-300 bg-slate-900 p-4 rounded-lg overflow-x-auto border border-slate-800 tab-4 leading-relaxed whitespace-pre">
            <code>{content}</code>
          </pre>
        )}

        {!error && fileType === 'binary' && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3">
            <File className="w-16 h-16 opacity-20" />
            <p>Preview tidak tersedia untuk tipe file ini.</p>
          </div>
        )}
      </div>
    </div>
  );
};

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
interface FileSystemNodeProps {
  handle: FileSystemHandle;
  level?: number;
  onSelect?: (handle: FileSystemFileHandle) => void;
  selectedHandleName?: string;
}

const FileSystemNode = ({ handle, level = 0, onSelect, selectedHandleName }: FileSystemNodeProps) => {
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
    } else {
      // Handle select file
      onSelect?.(handle as FileSystemFileHandle);
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
          ${handle.kind === 'file' && selectedHandleName === handle.name ? 'bg-blue-500/10 border-l-blue-400' : ''}
        `
        }
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
              <FileSystemNode
                key={childHandle.name}
                handle={childHandle}
                level={level + 1}
                onSelect={onSelect}
                selectedHandleName={selectedHandleName}
              />
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
  const [selectedFile, setSelectedFile] = useState<FileSystemFileHandle | null>(null);

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
          <div className="flex h-[600px] bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden max-w-6xl mx-auto">
            {/* Left: File Tree */}
            <div className={`${selectedFile ? 'w-1/3' : 'w-full'} flex flex-col border-r border-slate-800 transition-all duration-300`}>
              <div className="p-3 border-b border-slate-800 bg-slate-800/50 text-xs font-mono text-slate-400 flex items-center gap-2 shrink-0">
                <span className="bg-slate-700 px-1.5 rounded">ROOT</span>
                <span className="truncate">{rootHandle.name}</span>
              </div>
              <div className="p-2 overflow-y-auto flex-1 file-explorer-scrollbar">
                <FileSystemNode
                  handle={rootHandle}
                  onSelect={setSelectedFile}
                  selectedHandleName={selectedFile?.name}
                />
              </div>
            </div>

            {/* Right: Preview */}
            {selectedFile && (
              <div className="w-2/3">
                <FilePreview fileHandle={selectedFile} onClose={() => setSelectedFile(null)} />
              </div>
            )}
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