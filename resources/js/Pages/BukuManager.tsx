import React, { useState, useEffect, useRef, ChangeEvent, DragEvent } from 'react';
import {
  Book,
  GripVertical,
  Eye,
  EyeOff,
  Save,
  Upload,
  Download,
  Search,
  FileJson,
  CheckCircle2,
  Trash2,
  Plus,
  Pencil,
  X,
  Lock,
  Unlock,
  ShoppingBag,
  Copy,
  Check,
  LayoutGrid,
  List as ListIcon,
  Filter // ✨ New Icon
} from 'lucide-react';

// ... imports

interface BookData {
  nameBook: string;
  coverBook: string;
  urlBook: string;
  keyword: string;
  price: number;
  version: number;
  status: string;
  lock: boolean;
  showInShop: boolean;
  idBookPath: string;
  idBook: string;
  idPlaystore: string;
  originalKey?: string;
  orderBook?: number;
}

/**
 * SAMPLE DATA
 */
const INITIAL_DATA_OBJECT = {

};

const DEFAULT_FORM_STATE: BookData = {
  nameBook: '',
  coverBook: '',
  urlBook: '',
  keyword: '',
  price: 0,
  version: 1,
  status: 'draft',
  lock: false,
  showInShop: false,
  idBookPath: '',
  idBook: '',
  idPlaystore: ''
};

const generateRandomId = (length: number) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default function App() {
  const [books, setBooks] = useState<BookData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState('list');
  const [showPublishedOnly, setShowPublishedOnly] = useState(false); // ✨ New State

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM_STATE);

  // Refs untuk Drag & Drop
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Load Initial Data
  useEffect(() => {
    processData(INITIAL_DATA_OBJECT);
  }, []);

  const processData = (dataObj: Record<string, any>) => {
    const dataArray = Object.keys(dataObj).map(key => ({
      ...dataObj[key],
      originalKey: key,
      showInShop: dataObj[key].showInShop === true || dataObj[key].showInShop === "true"
    }));

    const sorted = dataArray.sort((a, b) => (a.orderBook || 9999) - (b.orderBook || 9999));
    setBooks(sorted);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (!e.target.files?.[0]) return;
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result === "string") {
          const parsed = JSON.parse(result);
          processData(parsed);
        }
      } catch (err) {
        alert("Format JSON tidak valid!");
      }
    };
  };

  const handleExport = () => {
    const exportObj: Record<string, any> = {};
    books.forEach((book) => {
      const key = book.originalKey || book.idBookPath;
      const { originalKey, ...cleanBook } = book;
      exportObj[key] = cleanBook;
    });

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "updated_books.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const toggleStatus = (originalKey: string) => {
    const index = books.findIndex(b => b.originalKey === originalKey);
    if (index === -1) return;

    const newBooks = [...books];
    const currentStatus = newBooks[index].status;
    newBooks[index].status = currentStatus === 'publish' ? 'draft' : 'publish';
    setBooks(newBooks);
  };

  const handleDelete = (originalKey: string) => {
    if (window.confirm("Yakin ingin menghapus buku ini?")) {
      const newBooks = books.filter(b => b.originalKey !== originalKey);
      const reorderedBooks = newBooks.map((book, idx) => ({
        ...book,
        orderBook: idx + 1
      }));
      setBooks(reorderedBooks);
    }
  };

  const handleCopyId = (id: string | undefined) => {
    if (!id) return;
    const textArea = document.createElement("textarea");
    textArea.value = id;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
    document.body.removeChild(textArea);
  };

  // Live Drag and Drop
  const onDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    dragItem.current = index;
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragEnter = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (dragItem.current !== null && dragItem.current !== index) {
      let _books = [...books];
      const draggedItemContent = _books[dragItem.current];
      _books.splice(dragItem.current, 1);
      _books.splice(index, 0, draggedItemContent);
      dragItem.current = index;
      const reorderedBooks = _books.map((book, idx) => ({
        ...book,
        orderBook: idx + 1
      }));
      setBooks(reorderedBooks);
    }
  };

  const onDragEnd = () => {
    dragItem.current = null;
    dragOverItem.current = null;
    setIsDragging(false);
  };

  // ADD & EDIT Logic
  const openAddModal = () => {
    setIsEditing(false);
    const generatedId = generateRandomId(32);
    setFormData({
      ...DEFAULT_FORM_STATE,
      idBook: generatedId,
      idBookPath: generatedId,
      idPlaystore: generatedId
    });
    setIsModalOpen(true);
  };

  const openEditModal = (book: BookData) => {
    setIsEditing(true);
    setFormData({ ...book });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing) {
      setBooks(prevBooks => prevBooks.map(b =>
        b.originalKey === formData.originalKey ? { ...formData } : b
      ));
    } else {
      const newBook = {
        ...formData,
        originalKey: formData.idBookPath,
        orderBook: books.length + 1
      };
      setBooks(prevBooks => [...prevBooks, newBook]);
    }

    setIsModalOpen(false);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    const checked = target.checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // ✨ Filter Logic: Search + Status Filter
  const filteredBooks = books.filter(b => {
    const matchesSearch = b.nameBook.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = showPublishedOnly ? b.status === 'publish' : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header Section */}
        <header className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2 text-indigo-600">
                <Book className="w-8 h-8" />
                Book Manager
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Manage, Sort, and Publish Control
              </p>
            </div>

            <div className="flex flex-wrap gap-3 w-full lg:w-auto items-center">

              {/* ✨ Filter Button */}
              <button
                onClick={() => setShowPublishedOnly(!showPublishedOnly)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm font-medium mr-2 border
                  ${showPublishedOnly
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}
                `}
                title={showPublishedOnly ? "Tampilkan Semua" : "Hanya Publish"}
              >
                <Filter className={`w-4 h-4 ${showPublishedOnly ? 'fill-emerald-700' : ''}`} />
                <span className="hidden md:inline">{showPublishedOnly ? 'Published Only' : 'Filter'}</span>
              </button>

              {/* View Toggle Buttons */}
              <div className="flex bg-slate-100 p-1 rounded-lg mr-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                  title="List View"
                >
                  <ListIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition text-sm font-medium shadow-md shadow-emerald-200"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Tambah</span>
              </button>

              <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition text-sm font-medium text-slate-600">
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Import</span>
                <input type="file" onChange={handleFileUpload} className="hidden" accept=".json" />
              </label>

              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition text-sm font-medium shadow-md shadow-indigo-200"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari judul buku, ID, atau keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
            />
          </div>
        </header>

        {/* List Header (Only for List View) */}
        {viewMode === 'list' && (
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <div className="col-span-1 text-center">Order</div>
            <div className="col-span-1">Cover</div>
            <div className="col-span-7">Book Details</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>
        )}

        {/* Content Area */}
        <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" : "space-y-3"}>

          {filteredBooks.length === 0 && (
            <div className={`text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200 ${viewMode === 'grid' ? 'col-span-full' : ''}`}>
              <FileJson className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Tidak ada buku ditemukan</p>
            </div>
          )}

          {filteredBooks.map((book, index) => (
            <div
              key={book.originalKey || index}
              draggable={!searchTerm && !showPublishedOnly} // ✨ Disable drag if filter active
              onDragStart={(e) => onDragStart(e, index)}
              onDragEnter={(e) => onDragEnter(e, index)}
              onDragEnd={onDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={`
                group relative bg-white border border-slate-100 shadow-sm transition-all duration-200
                ${(searchTerm || showPublishedOnly) ? 'cursor-default' : 'cursor-move hover:shadow-md hover:border-indigo-100'}
                ${isDragging && dragItem.current === index ? 'opacity-40 bg-slate-50 border-dashed border-indigo-300' : ''}
                ${viewMode === 'list' ? 'grid grid-cols-12 gap-4 items-center p-4 rounded-xl' : 'flex flex-col rounded-2xl overflow-hidden h-full'}
              `}
            >

              {/* --- VIEW MODE: LIST --- */}
              {viewMode === 'list' ? (
                <>
                  {/* Order */}
                  <div className="col-span-2 md:col-span-1 flex flex-col items-center justify-center text-slate-400 group-hover:text-indigo-500">
                    {/* ✨ Show Grip only if not searching/filtering */}
                    {!searchTerm && !showPublishedOnly && <GripVertical className="w-5 h-5 mb-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity hidden md:block" />}
                    <span className="font-mono font-bold text-lg">{book.orderBook}</span>
                  </div>

                  {/* Cover */}
                  <div className="col-span-3 md:col-span-1">
                    <div className="w-12 h-16 bg-slate-100 rounded-md overflow-hidden border border-slate-200 relative mx-auto md:mx-0">
                      {book.coverBook ? (
                        <img src={book.coverBook} alt="Cover" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100x150?text=No+Cover' }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">N/A</div>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="col-span-7">
                    <h3 className="font-bold text-slate-800 line-clamp-1">{book.nameBook}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopyId(book.idBook); }}
                        className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1 hover:bg-slate-200 hover:text-indigo-600 transition cursor-pointer border border-slate-200"
                        title="Klik untuk salin ID Buku"
                      >
                        <span className="opacity-50">ID:</span>{book.idBook}
                        {copiedId === book.idBook ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                      {book.keyword && <span className="text-xs line-clamp-1 bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded hidden md:block">{book.keyword}</span>}
                      {book.price > 0 && <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Rp {book.price.toLocaleString()}</span>}
                      {book.lock && <Lock className="w-3 h-3 text-amber-500" />}
                      {book.showInShop && <ShoppingBag className="w-3 h-3 text-purple-500" />}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-12 md:col-span-3 flex justify-end gap-2 mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-50">
                    <button onClick={() => openEditModal(book)} className="action-btn-list bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 p-1.5 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => book.originalKey && toggleStatus(book.originalKey)} className={`action-btn-list border p-1.5 rounded-lg ${book.status === 'publish' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                      {book.status === 'publish' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => book.originalKey && handleDelete(book.originalKey)} className="action-btn-list bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 p-1.5 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </>
              ) : (
                /* --- VIEW MODE: GRID --- */
                <>
                  {/* Grid Cover */}
                  <div className="relative aspect-[3/4] bg-slate-100 border-b border-slate-100">
                    {book.coverBook ? (
                      <img src={book.coverBook} alt="Cover" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/300x400?text=No+Cover' }} />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <Book className="w-12 h-12 mb-2 opacity-20" />
                        <span className="text-xs">No Cover</span>
                      </div>
                    )}

                    {/* Grid Badges */}
                    <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs font-mono px-2 py-1 rounded-md font-bold shadow-sm">
                      #{book.orderBook}
                    </div>
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      {book.lock && <div className="bg-amber-500/90 p-1 rounded-md text-white shadow-sm"><Lock className="w-3 h-3" /></div>}
                      {book.showInShop && <div className="bg-purple-500/90 p-1 rounded-md text-white shadow-sm"><ShoppingBag className="w-3 h-3" /></div>}
                    </div>
                    {/* Status Badge on Grid */}
                    <div className={`absolute bottom-0 inset-x-0 text-center text-[10px] uppercase font-bold py-1 ${book.status === 'publish' ? 'bg-emerald-500/90 text-white' : 'bg-slate-500/90 text-white'}`}>
                      {book.status}
                    </div>
                  </div>

                  {/* Grid Details */}
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="font-bold text-slate-800 text-sm line-clamp-2 leading-snug mb-2 flex-grow" title={book.nameBook}>{book.nameBook}</h3>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {book.price > 0 ? `Rp ${book.price.toLocaleString()}` : 'Free'}
                        </span>
                        <span className="text-slate-400 text-[10px]">v{book.version}</span>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopyId(book.idBook); }}
                        className="w-full text-[10px] text-slate-500 font-mono bg-slate-50 border border-slate-200 px-2 py-1.5 rounded flex items-center justify-between hover:bg-slate-100 hover:text-indigo-600 transition cursor-pointer"
                      >
                        <span className="truncate max-w-[120px]">{book.idBook}</span>
                        {copiedId === book.idBook ? <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" /> : <Copy className="w-3 h-3 flex-shrink-0" />}
                      </button>
                    </div>
                  </div>

                  {/* Grid Actions */}
                  <div className="p-3 border-t border-slate-100 flex gap-2 bg-slate-50/50">
                    <button onClick={() => openEditModal(book)} className="flex-1 flex items-center justify-center py-1.5 rounded-md bg-white border border-slate-200 text-indigo-600 hover:border-indigo-300 hover:shadow-sm text-xs font-medium transition"><Pencil className="w-3.5 h-3.5 mr-1" /> Edit</button>
                    <button onClick={() => book.originalKey && toggleStatus(book.originalKey)} className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 transition"><Eye className="w-3.5 h-3.5" /></button>
                    <button onClick={() => book.originalKey && handleDelete(book.originalKey)} className="p-1.5 rounded-md bg-white border border-slate-200 text-red-500 hover:border-red-300 hover:text-red-600 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </>
              )}

            </div>
          ))}
        </div>

      </div>

      {/* MODAL OVERLAY (Sama seperti sebelumnya) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="bg-white flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-10">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {isEditing ? <Pencil className="w-5 h-5 text-indigo-500" /> : <Plus className="w-5 h-5 text-emerald-500" />}
                {isEditing ? 'Edit Buku' : 'Tambah Buku Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Judul Buku</label>
                <input type="text" name="nameBook" required value={formData.nameBook || ''} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" placeholder="Masukkan judul buku..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ID Unik (Path)</label>
                  <input type="text" name="idBookPath" value={formData.idBookPath || ''} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-slate-50 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ID Playstore</label>
                  <input type="text" name="idPlaystore" value={formData.idPlaystore || ''} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-slate-50 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">URL Cover Image</label>
                <input type="url" name="coverBook" value={formData.coverBook} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">URL File Buku (Download)</label>
                <input type="url" name="urlBook" value={formData.urlBook} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Harga (Rp)</label>
                  <input type="number" name="price" min="0" value={formData.price} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Versi</label>
                  <input type="number" name="version" min="1" value={formData.version} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 items-start pt-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white">
                    <option value="publish">Publish</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div className="flex flex-col gap-3 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" name="lock" checked={formData.lock} onChange={handleInputChange} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300" />
                    <span className="text-sm font-medium text-slate-700 flex items-center gap-1">{formData.lock ? <Lock className="w-4 h-4 text-amber-500" /> : <Unlock className="w-4 h-4 text-slate-400" />} Kunci Buku</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" name="showInShop" checked={formData.showInShop} onChange={handleInputChange} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300" />
                    <span className="text-sm font-medium text-slate-700 flex items-center gap-1"><ShoppingBag className="w-4 h-4 text-purple-500" /> Tampilkan di Toko</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Keywords (Tags)</label>
                <input type="text" name="keyword" value={formData.keyword} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition" placeholder="pisahkan dengan koma..." />
              </div>
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition">Batal</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-lg shadow-indigo-200 transition flex items-center gap-2"><Save className="w-4 h-4" /> Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}