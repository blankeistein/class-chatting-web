import React, { useState } from "react";
import {
  Card,
  CardBody,
  Typography,
  Button,
  IconButton,
  Input,
  Select,
  Chip,
} from "@material-tailwind/react";
import DashboardLayout from "@/Layouts/AdminDashboard";
import { Head } from "@inertiajs/react";
import {
  SearchIcon,
  PlusIcon,
  LayoutGridIcon,
  ListIcon,
  ArrowUpDownIcon,
  EditIcon,
  Trash2Icon,
  BookIcon,
  GripVerticalIcon,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Types ---
interface Book {
  id: number;
  title: string;
  author: string;
  category: string;
  published_year: string;
  publisher: string;
  cover_url: string;
  order: number;
}

// --- Dummy Data ---
const initialBooks: Book[] = [
  {
    id: 1,
    title: "Belajar React JS Modern",
    author: "Eko Kurniawan",
    category: "Pemrograman",
    published_year: "2024",
    publisher: "Lestari Press",
    cover_url: "https://placehold.co/400x600/1e293b/FFF?text=React+JS",
    order: 1,
  },
  {
    id: 2,
    title: "Mastering Laravel 11",
    author: "Taylor Otwell",
    category: "Backend",
    published_year: "2024",
    publisher: "Open Source Books",
    cover_url: "https://placehold.co/400x600/ef4444/FFF?text=Laravel+11",
    order: 2,
  },
  {
    id: 3,
    title: "Desain UI/UX dengan Figma",
    author: "Dika Pradana",
    category: "Desain",
    published_year: "2023",
    publisher: "Kreatif Media",
    cover_url: "https://placehold.co/400x600/a855f7/FFF?text=Figma+UIUX",
    order: 3,
  },
  {
    id: 4,
    title: "Algoritma dan Struktur Data",
    author: "Budi Raharjo",
    category: "Ilmu Komputer",
    published_year: "2022",
    publisher: "Informatika Bandung",
    cover_url: "https://placehold.co/400x600/3b82f6/FFF?text=Algoritma",
    order: 4,
  },
  {
    id: 5,
    title: "Tailwind CSS Best Practices",
    author: "Adam Wathan",
    category: "Frontend",
    published_year: "2023",
    publisher: "CSS Masters",
    cover_url: "https://placehold.co/400x600/06b6d4/FFF?text=Tailwind",
    order: 5,
  },
];

// --- Sortable Components ---

interface SortableProps {
  book: Book;
  isReorderMode: boolean;
}

const SortableBookRow = ({ book, isReorderMode }: SortableProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: book.id,
    disabled: !isReorderMode,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : "auto",
    position: "relative",
  };

  const classes = "p-4 border-b border-slate-100 dark:border-slate-800";

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isDragging ? "bg-slate-50 dark:bg-slate-800/80 shadow-md" : ""}`}
    >
      {isReorderMode && (
        <td className={classes}>
          <div
            {...attributes}
            {...listeners}
            className="p-2 bg-slate-100 rounded cursor-move active:cursor-grabbing w-fit mx-auto dark:bg-slate-800 touch-none"
          >
            <GripVerticalIcon className="w-4 h-4 text-slate-500" />
          </div>
        </td>
      )}
      <td className={classes}>
        <div className="flex items-center gap-4">
          <img
            src={book.cover_url}
            alt={book.title}
            className="h-16 w-12 rounded object-cover shadow-sm border border-slate-200 dark:border-slate-700"
          />
          <div>
            <Typography variant="small" className="font-bold text-slate-800 dark:text-white line-clamp-1 max-w-[200px]" title={book.title}>
              {book.title}
            </Typography>
            <Typography variant="small" className="text-[10px] text-slate-400">
              ID: {book.id}
            </Typography>
          </div>
        </div>
      </td>
      <td className={classes}>
        <Chip
          variant="ghost"
          size="sm"
          color="info"
          className="capitalize w-fit"
        >
          <Chip.Label>{book.category}</Chip.Label>
        </Chip>
      </td>
      <td className={classes}>
        <Typography variant="small" className="font-medium text-slate-700 dark:text-slate-300">
          {book.author}
        </Typography>
      </td>
      <td className={classes}>
        <Typography variant="small" className="text-slate-600 dark:text-slate-400">
          {book.publisher}
        </Typography>
      </td>
      <td className={classes}>
        <Typography variant="small" className="text-slate-600 dark:text-slate-400">
          {book.published_year}
        </Typography>
      </td>
      <td className={classes}>
        {!isReorderMode && (
          <div className="flex gap-2">
            <IconButton variant="ghost" size="sm" title="Edit Buku">
              <EditIcon className="w-4 h-4 text-blue-500" />
            </IconButton>
            <IconButton variant="ghost" size="sm" title="Hapus Buku">
              <Trash2Icon className="w-4 h-4 text-red-500" />
            </IconButton>
          </div>
        )}
      </td>
    </tr>
  );
};

const SortableBookCard = ({ book, isReorderMode }: SortableProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: book.id,
    disabled: !isReorderMode,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : "auto",
    position: 'relative',
    touchAction: 'none',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all duration-300 group h-full">
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-xl bg-slate-100 dark:bg-slate-800">
          <img
            src={book.cover_url}
            alt={book.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {!isReorderMode && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
              <div className="flex gap-2 justify-center pb-2">
                <Button size="sm" className="flex items-center gap-2 text-slate-900 bg-white" isFullWidth={true}>
                  <EditIcon className="w-3 h-3" /> Edit
                </Button>
              </div>
            </div>
          )}
          {isReorderMode && (
            <div
              {...attributes}
              {...listeners}
              className="absolute top-2 right-2 flex items-center justify-center bg-white/90 dark:bg-slate-900/90 p-2 rounded-lg backdrop-blur-sm shadow-sm border border-slate-200 dark:border-slate-700 cursor-move active:cursor-grabbing hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <GripVerticalIcon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </div>
          )}
        </div>
        <CardBody className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <Chip size="sm" variant="ghost" className="rounded-full px-2 py-1 text-[10px]">
              <Chip.Label>{book.category}</Chip.Label>
            </Chip>
            <span className="text-xs text-slate-500 dark:text-slate-400">{book.published_year}</span>
          </div>
          <Typography variant="h6" className="mb-1 font-bold line-clamp-1 dark:text-white text-blue-gray-900" title={book.title}>
            {book.title}
          </Typography>
          <Typography className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {book.author}
          </Typography>
        </CardBody>
      </Card>
    </div>
  );
};


// --- Main Page Component ---

export default function Index() {
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setBooks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        const newOrder = arrayMove(items, oldIndex, newIndex);
        // Update order numbers if needed
        return newOrder.map((book, idx) => ({ ...book, order: idx + 1 }));
      });
    }
  };

  const handleSaveOrder = () => {
    // Simulation of saving to backend
    toast.success("Urutan buku berhasil disimpan!");
    setIsReorderMode(false);
  };

  const filteredBooks = books.filter((book) => {
    return (
      (filterCategory === "all" || book.category === filterCategory) &&
      book.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <>
      <Head title="Manajemen Buku" />
      <Toaster position="bottom-center" />

      <div className="p-4 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Typography variant="h4" className="font-bold text-slate-800 dark:text-white">
              Daftar Buku
            </Typography>
            <Typography className="text-slate-500 dark:text-slate-400">
              Kelola koleksi buku dan materi pembelajaran.
            </Typography>
          </div>
          <div className="flex gap-2">
            {!isReorderMode ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 dark:border-white dark:text-white"
                  onClick={() => {
                    setIsReorderMode(true);
                    toast("Mode Drag-and-Drop Aktif", { icon: "🖐️" });
                  }}
                >
                  <ArrowUpDownIcon className="w-4 h-4" />
                  Ubah Urutan
                </Button>
                <Button className="flex items-center gap-2 bg-slate-900 dark:bg-white dark:text-slate-900" size="sm">
                  <PlusIcon className="w-4 h-4" />
                  Tambah Buku
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  color="error"
                  onClick={() => {
                    setIsReorderMode(false);
                    setBooks(initialBooks); // Reset to initial if cancelled
                    toast.error("Perubahan urutan dibatalkan");
                  }}
                >
                  Batal
                </Button>
                <Button size="sm" color="success" onClick={handleSaveOrder}>
                  Simpan Urutan
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Toolbar & Filter */}
        <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <CardBody className="p-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex gap-4 w-full md:w-auto flex-1">
                <div className="w-full md:w-72">
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="!border-t-blue-gray-200 focus:!border-t-gray-900 dark:focus:!border-t-white dark:text-white"
                    placeholder="Cari Judul Buku..."
                    disabled={isReorderMode}
                  >
                    <Input.Icon>
                      <SearchIcon className="h-4 w-4" />
                    </Input.Icon>
                  </Input>
                </div>
                <div className="w-full md:w-48">
                  <Select
                    value={filterCategory}
                    onValueChange={(val) => setFilterCategory(val || "all")}
                    disabled={isReorderMode}
                  >
                    <Select.Trigger className="dark:text-white" placeholder="Semua Kategori" />
                    <Select.List>
                      <Select.Option value="all">Semua Kategori</Select.Option>
                      <Select.Option value="Pemrograman">Pemrograman</Select.Option>
                      <Select.Option value="Desain">Desain</Select.Option>
                      <Select.Option value="Backend">Backend</Select.Option>
                    </Select.List>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-1 border-l border-slate-200 pl-4 ml-auto dark:border-slate-700">
                <IconButton
                  variant={viewMode === "list" ? "solid" : "ghost"}
                  color="secondary"
                  size="sm"
                  onClick={() => setViewMode("list")}
                  title="Tampilan List"
                  disabled={isReorderMode}
                >
                  <ListIcon className="h-4 w-4" />
                </IconButton>
                <IconButton
                  variant={viewMode === "grid" ? "solid" : "ghost"}
                  color="secondary"
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  title="Tampilan Grid"
                  disabled={isReorderMode}
                >
                  <LayoutGridIcon className="h-4 w-4" />
                </IconButton>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Content Area */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          {filteredBooks.length > 0 ? (
            viewMode === "list" ? (
              <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max table-auto text-left">
                    <thead>
                      <tr>
                        {isReorderMode && <th className="p-4 w-16 bg-slate-50 dark:bg-slate-800/50 text-center">Drag</th>}
                        {["Buku", "Kategori", "Penulis", "Penerbit", "Tahun", isReorderMode ? "" : "Aksi"].map((head) => (
                          head === "" ? null :
                            <th key={head} className="border-y border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-4">
                              <Typography variant="small" className="font-bold leading-none opacity-70 text-slate-500 dark:text-slate-300">
                                {head}
                              </Typography>
                            </th>
                        ))}
                      </tr>
                    </thead>
                    <SortableContext
                      items={filteredBooks.map(b => b.id)}
                      strategy={rectSortingStrategy} // Rect strategy often works better for mixed content, but verticalList is standard for rows
                    >
                      <tbody>
                        {filteredBooks.map((book) => (
                          <SortableBookRow
                            key={book.id}
                            book={book}
                            isReorderMode={isReorderMode}
                          />
                        ))}
                      </tbody>
                    </SortableContext>
                  </table>
                </div>
              </Card>
            ) : (
              <SortableContext
                items={filteredBooks.map(b => b.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {filteredBooks.map((book) => (
                    <SortableBookCard
                      key={book.id}
                      book={book}
                      isReorderMode={isReorderMode}
                    />
                  ))}
                </div>
              </SortableContext>
            )
          ) : (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-50 border border-dashed border-slate-300 rounded-lg dark:bg-slate-900 dark:border-slate-700">
              <BookIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
              <Typography className="text-slate-500 dark:text-slate-400">
                Tidak ada buku ditemukan.
              </Typography>
            </div>
          )}
        </DndContext>
      </div>
    </>
  );
}

Index.layout = (page: React.ReactNode) => {
  return <DashboardLayout>{page}</DashboardLayout>;
};
