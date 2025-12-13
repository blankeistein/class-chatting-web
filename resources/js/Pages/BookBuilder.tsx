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
  Image as ImageIcon,
  Save,
  CheckCircle,
  Zap,
  History,
  MoreVertical,
  Plus,
  Smartphone
} from 'lucide-react';
import PreviewModal from '@/Components/PreviewModal';

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
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;

    const loadFile = async () => {
      if (!fileHandle) {
        setFileType('none');
        setFileInfo(null);
        setContent(null);
        setIsDirty(false);
        return;
      }

      setFileType('loading');
      setError(null);
      setIsDirty(false);

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
          ['js', 'jsx', 'ts', 'tsx', 'json', 'css', 'html', 'md', 'txt', 'php', 'py', 'java', 'c', 'cpp', 'sql', 'xml', 'yml', 'env', 'gitignore', 'ini', 'conf'].includes(ext)
        ) {
          setFileType('text');
          const text = await file.text();
          // Limit text preview for performance
          if (text.length > 500000) {
            // Read only partial if too big, but for editor we warn
            setContent(text.substring(0, 50000) + '\n... (File too large to edit)');
            setError("File terlalu besar untuk diedit.");
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

  const handleSave = async () => {
    if (!fileHandle || fileType !== 'text' || !content) return;

    setIsSaving(true);
    try {
      // @ts-ignore - createWritable exists on FileSystemFileHandle in generic type but TS might complain depending on lib
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      setIsDirty(false);

      // Refresh file info
      const file = await fileHandle.getFile();
      setFileInfo(file);
    } catch (err) {
      console.error("Gagal menyimpan:", err);
      setError("Gagal menyimpan perubahan. Pastikan kamu memiliki izin.");
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard shortcut for Save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        if (fileType === 'text' && isDirty) {
          e.preventDefault();
          handleSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fileType, isDirty, content]);

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
        <div className="flex items-center gap-2">
          {fileType === 'text' && !error && (
            <button
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                    ${isDirty
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-transparent text-slate-500 cursor-not-allowed'
                }
                  `}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : !isDirty ? (
                <>
                  <CheckCircle size={16} className="text-green-500" />
                  Saved
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save
                </>
              )}
            </button>
          )}
          <div className="w-px h-6 bg-slate-700 mx-1"></div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content Preview */}
      <div className={`flex-1 overflow-auto relative bg-slate-950/50 ${fileType === 'text' ? 'p-0' : 'p-4'}`}>
        {fileType === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center text-blue-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
          </div>
        )}

        {error && (
          <div className="m-4 text-red-400 bg-red-500/10 p-4 rounded-lg text-sm border border-red-500/20">
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

        {!error && fileType === 'text' && content !== null && (
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setIsDirty(true);
            }}
            spellCheck={false}
            className="w-full h-full bg-[#1e1e1e] text-slate-300 font-mono text-sm leading-relaxed p-4 resize-none focus:outline-none file-explorer-scrollbar"
          />
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
    // Note: We don't check children.length here because useEffect controls when this is called
    // and we want to allow force-refresh if needed, though typically controlled by isExpanded check
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

  // Reset state when handle changes (e.g. root folder change or refresh)
  useEffect(() => {
    setIsExpanded(level === 0);
    setChildren([]);
    setIsLoading(false);
    setError(null);
  }, [handle, level]);

  // Declarative fetch: Load children when expanded and empty
  useEffect(() => {
    if (isExpanded && children.length === 0 && !isLoading && !error) {
      fetchChildren();
    }
  }, [isExpanded, children.length, handle]); // Handle dependency ensures freshness

  const toggleExpand = () => {
    if (handle.kind === 'directory') {
      setIsExpanded(prev => !prev);
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

export default function BookBuilder() {
  const [rootHandle, setRootHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileSystemFileHandle | null>(null);
  const [isBuildMenuOpen, setIsBuildMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewScreenUrl, setPreviewScreenUrl] = useState<string | null>(null);
  const [packageData, setPackageData] = useState<any | null>(null);

  // Form State
  const [bookForm, setBookForm] = useState({
    folderName: '',
    title: '',
    subTitle: ''
  });

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.folderName || !bookForm.title) {
      alert("Nama Folder dan Judul Buku wajib diisi!");
      return;
    }

    try {
      // 1. Ask for parent directory
      const parentHandle = await window.showDirectoryPicker();

      // 2. Create the book folder
      const bookHandle = await parentHandle.getDirectoryHandle(bookForm.folderName, { create: true });

      // 3. Create subdirectories
      await bookHandle.getDirectoryHandle('images', { create: true });
      await bookHandle.getDirectoryHandle('audio', { create: true });
      await bookHandle.getDirectoryHandle('json', { create: true });
      await bookHandle.getDirectoryHandle('videos', { create: true });

      // 4. Create package.json
      // @ts-ignore
      const fileHandle = await bookHandle.getFileHandle('package.json', { create: true });
      // @ts-ignore
      const writable = await fileHandle.createWritable();

      const packageContent = {
        title: bookForm.title,
        subtitle: bookForm.subTitle || "",
        version: 1,
        content: [
          {
            file: "json/data_assets_subtema_1.json",
            name: "Mari Belajar"
          }
        ],
      };

      await writable.write(JSON.stringify(packageContent, null, 2));
      await writable.close();

      // 5. Open the new folder automatically
      setRootHandle(bookHandle);
      setIsCreateModalOpen(false);
      setError('');
      setSelectedFile(null);
      setBookForm({ folderName: '', title: '', subTitle: '' });

    } catch (err) {
      console.error(err);
      if (err instanceof Error && err.name !== 'AbortError') {
        alert("Gagal membuat buku: " + err.message);
      }
    }
  };

  const handleOpenFolder = async () => {
    try {
      // API Modern untuk akses file system
      const handle = await window.showDirectoryPicker();
      setRootHandle(handle);
      setError('');
      setSelectedFile(null); // Reset selection when folder changes
      setPreviewScreenUrl(null); // Reset preview url
      setPackageData(null); // Reset package data
    } catch (err) {
      if (err instanceof Error) {
        if (err.name !== 'AbortError') {
          setError('Browser kamu mungkin tidak mendukung API ini atau izin ditolak.');
          console.error(err);
        }
      }
    }
  };

  const loadPreviewScreen = async () => {
    if (!rootHandle) return;

    setIsPreviewModalOpen(true);
    setPreviewScreenUrl(null);
    setPackageData(null);

    try {
      // 1. Load package.json for metadata
      try {
        const pkgHandle = await rootHandle.getFileHandle('package.json');
        const pkgFile = await pkgHandle.getFile();
        const pkgText = await pkgFile.text();
        const pkgJson = JSON.parse(pkgText);
        setPackageData(pkgJson);
      } catch (e) {
        console.warn("No package.json found or invalid JSON", e);
      }

      // 2. Cari file screen di folder images atau root
      // Cari file screen di folder images atau root
      // Prioritas: images/screen.png, images/screen.jpg, screen.png, screen.jpg
      let fileHandle: FileSystemFileHandle | undefined;

      const tryGetFile = async (name: string, dirHandle: FileSystemDirectoryHandle) => {
        try {
          return await dirHandle.getFileHandle(name);
        } catch {
          return undefined;
        }
      };

      // Cek folder images
      try {
        const imagesHandle = await rootHandle.getDirectoryHandle('images');
        fileHandle = await tryGetFile('screen.png', imagesHandle) || await tryGetFile('screen.jpg', imagesHandle);
      } catch {
        // Ignore if no images folder
      }

      // Cek root jika belum ketemu
      if (!fileHandle) {
        fileHandle = await tryGetFile('screen', rootHandle);
      }

      if (fileHandle) {
        const file = await fileHandle.getFile();
        const url = URL.createObjectURL(file);
        setPreviewScreenUrl(url);
      }

    } catch (err) {
      console.error("Error loading preview screen:", err);
    }
  };

  // Cleanup preview url when modal closes
  useEffect(() => {
    if (!isPreviewModalOpen && previewScreenUrl) {
      URL.revokeObjectURL(previewScreenUrl);
      setPreviewScreenUrl(null);
    }
  }, [isPreviewModalOpen]);

  const compileBook = async () => {
    if (!rootHandle) return

    const pkgHandle = await rootHandle.getFileHandle('package.json');
    const pkgFile = await pkgHandle.getFile();
    const pkgText = await pkgFile.text();
    const pkgJson = JSON.parse(pkgText);

  }

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
              BookBuilder
            </h1>
            <p className="text-xs text-slate-500">Manage book content</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Build Button with Dropdown */}
          <div className="relative">
            <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition-colors text-sm font-medium"
                onClick={compileBook}
              >
                <Zap size={16} className="text-yellow-500" />
                Build
              </button>
              <div className="w-px bg-slate-700 my-1"></div>
              <button
                className="px-1.5 hover:bg-slate-700 text-slate-400 hover:text-white rounded-md transition-colors"
                onClick={() => setIsBuildMenuOpen(!isBuildMenuOpen)}
              >
                <ChevronDown size={14} className={`transition-transform duration-200 ${isBuildMenuOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Dropdown Menu */}
            {isBuildMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                <button
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2 transition-colors"
                  onClick={() => {
                    console.log("Build Old Version clicked");
                    setIsBuildMenuOpen(false);
                  }}
                >
                  <History size={14} className="text-slate-400" />
                  Build Old Version
                </button>
              </div>
            )}
          </div>

          <button
            onClick={loadPreviewScreen}
            disabled={!rootHandle}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border border-slate-700
                ${!rootHandle
                ? 'bg-slate-900 text-slate-600 cursor-not-allowed border-slate-800'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
              }
            `}
          >
            <Smartphone size={16} />
            Preview
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-900/20"
          >
            <Plus size={16} />
            Buat Buku
          </button>

          <button
            onClick={handleOpenFolder}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 shadow-lg shadow-blue-900/20"
          >
            <FolderOpen size={16} />
            Buka Folder
          </button>
        </div>
      </header >

      {/* Create Book Modal */}
      {
        isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
              <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
                <h2 className="text-lg font-bold text-slate-200">Buat Buku Baru</h2>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateBook} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Nama Folder</label>
                  <input
                    type="text"
                    required
                    placeholder="contoh: matematika kelas 1"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm"
                    value={bookForm.folderName}
                    onChange={e => setBookForm({ ...bookForm, folderName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Judul Buku</label>
                  <input
                    type="text"
                    required
                    placeholder="contoh: Matematika Dasar"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    value={bookForm.title}
                    onChange={e => setBookForm({ ...bookForm, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Sub Judul (Opsional)</label>
                  <input
                    type="text"
                    placeholder="contoh: Untuk Kelas 1 SD"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    value={bookForm.subTitle}
                    onChange={e => setBookForm({ ...bookForm, subTitle: e.target.value })}
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-900/20"
                  >
                    Pilih Lokasi & Buat
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      <PreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        screenUrl={previewScreenUrl}
        packageData={packageData}
      />

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
    </div >
  );
}