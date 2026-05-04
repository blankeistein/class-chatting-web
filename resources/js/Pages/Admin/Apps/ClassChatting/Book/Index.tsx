import React, { useCallback } from "react";
import { Head } from "@inertiajs/react";
import axios from "axios";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Button,
  Card,
  Chip,
  IconButton,
  Input,
  Select,
  Typography,
} from "@material-tailwind/react";
import {
  ArrowDownUp,
  BookIcon,
  LayoutGridIcon,
  ListIcon,
  LoaderCircleIcon,
  PlusIcon,
  SaveIcon,
  SearchIcon,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { collection, onSnapshot } from "firebase/firestore";
import AdminAppLayout from "@/Layouts/AdminAppLayout";
import { getFirebaseFirestore } from "@/lib/firebase";
import BookEditDialog from "./Partials/EditBookDialog";
import { GridBookCard } from "./Partials/GridBookCard";
import AddBookDialog, { type Book as NewBook } from "./Partials/AddBookDialog";
import BookDetailDialog from "./Partials/BookDetailDialog";
import { PageHeader } from "@/Components/PageHeader";
import SortableBookTableRow from "./Partials/SortableBookTableRow";

export type Book = {
  originalKey: string;
  cover: string;
  id: string;
  bookPath: string;
  playstoreId: string;
  keyword: string[];
  lock: boolean;
  name: string;
  oldOrder: number;
  order: number;
  price: number;
  status: string;
  downloadLink: string;
  version: number;
};

export type FirebaseBook = {
  cover: string;
  id: string;
  bookPath: string;
  playstoreId: string;
  keyword: string;
  lock: boolean;
  name: string;
  order: number;
  price: number;
  status: string;
  downloadLink: string;
  version: number;
};

type BookCategory = {
  id: string;
  name: string;
  keyword: string;
  order: number;
};

type FirebaseBookCategory = {
  name: string;
  keyword: string;
  order: number;
};

const BOOKS_COLLECTION = "books";
const BOOK_CATEGORIES_COLLECTION = "book_categories";

const normalizeBook = (key: string, value: Partial<FirebaseBook>): Book => {
  return {
    originalKey: key,
    cover: value.cover ?? "",
    id: value.id ?? key,
    bookPath: value.bookPath ?? key,
    playstoreId: value.playstoreId ?? value.id ?? key,
    keyword: value.keyword ? value.keyword.split(",").map((k) => k.trim()) : [],
    lock: Boolean(value.lock),
    name: value.name ?? "-",
    oldOrder: typeof value.order === "number" ? value.order : Number.MAX_SAFE_INTEGER,
    order: typeof value.order === "number" ? value.order : Number.MAX_SAFE_INTEGER,
    price: typeof value.price === "number" ? value.price : Number(value.price ?? 0),
    status: value.status ?? "draft",
    downloadLink: value.downloadLink ?? "",
    version: typeof value.version === "number" ? value.version : Number(value.version ?? 1),
  };
};

const createPayloadBook = (book: NewBook, orderBook: number): FirebaseBook => {
  const baseId = book.uuid;
  const keyword = book.tags?.join(",") ?? "";

  return {
    cover: book.coverUrl,
    id: baseId,
    bookPath: baseId,
    playstoreId: baseId,
    keyword,
    lock: false,
    name: book.title,
    order: orderBook,
    price: 0,
    status: "publish",
    downloadLink: book.downloadLink ?? "",
    version: book.version ?? 1,
  };
};

const sortBooks = (items: Book[]) => {
  return [...items].sort((left, right) => {
    if (left.order !== right.order) {
      return left.order - right.order;
    }

    return left.name.localeCompare(right.name);
  });
};

const resequenceBooks = (items: Book[]) => {
  return items.map((book, index) => ({
    ...book,
    order: index + 1,
  }));
};

const commitBookOrders = (items: Book[]) => {
  return items.map((book, index) => ({
    ...book,
    oldOrder: index + 1,
    order: index + 1,
  }));
};

const restoreBookOrders = (items: Book[]) => {
  return [...items]
    .sort((left, right) => {
      if (left.oldOrder !== right.oldOrder) {
        return left.oldOrder - right.oldOrder;
      }

      return left.name.localeCompare(right.name);
    })
    .map((book) => ({
      ...book,
      order: book.oldOrder,
    }));
};

const normalizeBookCategory = (key: string, value: Partial<FirebaseBookCategory>): BookCategory => {
  return {
    id: key,
    name: value.name ?? "-",
    keyword: value.keyword ?? "",
    order: typeof value.order === "number" ? value.order : Number.MAX_SAFE_INTEGER,
  };
};

const sortBookCategories = (items: BookCategory[]) => {
  return [...items].sort((left, right) => {
    if (left.order !== right.order) {
      return left.order - right.order;
    }

    return left.name.localeCompare(right.name);
  });
};

const extractBookKeywords = (keywordValue: string): string[] => {
  return keywordValue
    .split(",")
    .map((keyword) => keyword.trim().toLowerCase())
    .filter(Boolean);
};

const createEditForm = (book: Book): Book => ({
  ...book,
});

export default function Index() {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const firestore = React.useMemo(() => getFirebaseFirestore(), []);
  const [books, setBooks] = React.useState<Book[]>([]);
  const [categories, setCategories] = React.useState<BookCategory[]>([]);
  const [search, setSearch] = React.useState("");
  const [selectedKeyword, setSelectedKeyword] = React.useState("all");
  const [selectedStatus, setSelectedStatus] = React.useState("all");
  const [viewMode, setViewMode] = React.useState<"grid" | "table">("grid");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSavingOrder, setIsSavingOrder] = React.useState(false);
  const [isOrderMode, setIsOrderMode] = React.useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [activeDeleteKey, setActiveDeleteKey] = React.useState<string | null>(null);
  const [activeEditKey, setActiveEditKey] = React.useState<string | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = React.useState(false);
  const [selectedBook, setSelectedBook] = React.useState<Book | null>(null);
  const [editForm, setEditForm] = React.useState<Book | null>(null);

  React.useEffect(() => {
    if (!firestore) {
      setIsLoading(false);
      toast.error("Firebase Firestore belum terkonfigurasi. Tambahkan VITE_FIREBASE_PROJECT_ID.");

      return;
    }

    const booksCollection = collection(firestore, BOOKS_COLLECTION);
    const bookCategoriesCollection = collection(firestore, BOOK_CATEGORIES_COLLECTION);
    const unsubscribeBooks = onSnapshot(
      booksCollection,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => normalizeBook(doc.id, doc.data() as Partial<FirebaseBook>)) as Book[];
        setBooks(resequenceBooks(sortBooks(items)));
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching books:", error);
        toast.error("Gagal membaca data buku dari Firebase Firestore.");
        setIsLoading(false);
      },
    );

    const unsubscribeCategories = onSnapshot(
      bookCategoriesCollection,
      (snapshot) => {
        const items = snapshot.docs.map((item) => normalizeBookCategory(item.id, item.data() as Partial<FirebaseBookCategory>));
        setCategories(sortBookCategories(items));
      },
      (error) => {
        console.error("Error fetching book categories:", error);
        toast.error("Gagal membaca kategori buku dari Firebase Firestore.");
      },
    );

    return () => {
      unsubscribeBooks();
      unsubscribeCategories();
    };
  }, [firestore]);

  const filteredBooks = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    const hasKeywordFilter = selectedKeyword !== "all";
    const hasStatusFilter = selectedStatus !== "all";

    return books.filter((book) => {
      const matchesSearch = !query || [
        book.name,
        book.id,
        book.status,
      ].some((value) => value.toLowerCase().includes(query));

      const matchesKeyword = !hasKeywordFilter || book.keyword.some((k) => k.includes(selectedKeyword));
      const matchesStatus = !hasStatusFilter || book.status === selectedStatus;

      return matchesSearch && matchesKeyword && matchesStatus;
    });
  }, [books, search, selectedKeyword, selectedStatus]);

  const hasActiveSearch = search.trim().length > 0;
  const hasActiveKeywordFilter = selectedKeyword !== "all";
  const hasActiveStatusFilter = selectedStatus !== "all";
  const hasActiveFilter = hasActiveSearch || hasActiveKeywordFilter || hasActiveStatusFilter;

  const moveBook = useCallback((index: number, direction: "up" | "down") => {
    setBooks((currentBooks) => {
      const nextIndex = direction === "up" ? index - 1 : index + 1;

      if (nextIndex < 0 || nextIndex >= currentBooks.length) {
        return currentBooks;
      }

      const reorderedBooks = [...currentBooks];
      const [selectedBook] = reorderedBooks.splice(index, 1);
      reorderedBooks.splice(nextIndex, 0, selectedBook);

      return resequenceBooks(reorderedBooks);
    });
  }, []);

  const saveOrder = useCallback(async () => {
    const changedBooks = books
      .map((book, index) => ({
        originalKey: book.originalKey,
        oldOrder: book.oldOrder,
        order: index + 1,
      }))
      .filter((book) => book.oldOrder !== book.order)
      .map(({ originalKey, oldOrder, order }) => ({
        originalKey,
        oldOrder,
        order,
      }));

    if (changedBooks.length === 0) {
      setIsOrderMode(false);
      toast("Tidak ada perubahan urutan buku.");

      return;
    }

    setIsSavingOrder(true);

    try {
      await axios.patch(route("admin.apps.class-chatting.book.items.reorder"), {
        books: changedBooks,
      });

      setBooks((currentBooks) => commitBookOrders(currentBooks));
      setIsOrderMode(false);
      toast.success("Urutan buku berhasil disimpan.");
    } catch (error) {
      console.error("Error saving order:", error);
      toast.error("Gagal menyimpan urutan buku.");
    } finally {
      setIsSavingOrder(false);
    }
  }, [books]);

  const handleAddBook = useCallback(async (book: NewBook) => {
    const payload = createPayloadBook(book, books.length + 1);
    const duplicateBook = books.find((item) => item.id === payload.id || item.originalKey === payload.bookPath);

    if (duplicateBook) {
      toast.error("Buku ini sudah ada di Firestore.");

      return;
    }

    try {
      await axios.post(route("admin.apps.class-chatting.book.items.store"), {
        uuid: book.uuid,
        title: book.title,
        cover: book.coverUrl,
        tags: book.tags ?? [],
        downloadLink: book.downloadLink,
        version: book.version ?? 1,
        order: books.length + 1,
      });
      toast.success("Buku berhasil ditambahkan ke Firestore.");
    } catch (error) {
      console.error("Error adding book:", error);
      toast.error("Gagal menambahkan buku ke Firestore.");
    }
  }, [books]);

  const handleDeleteBook = useCallback(async (book: Book) => {
    if (!window.confirm(`Hapus "${book.name}" dari Firestore?`)) {
      return;
    }

    setActiveDeleteKey(book.originalKey);

    try {
      await axios.delete(route("admin.apps.class-chatting.book.items.destroy", { documentId: book.originalKey }));
      toast.success("Buku berhasil dihapus dari Firestore.");
    } catch (error) {
      console.error("Error deleting book:", error);
      toast.error("Gagal menghapus buku dari Firestore.");
    } finally {
      setActiveDeleteKey(null);
    }
  }, []);

  const openEditDialog = useCallback((book: Book) => {
    setEditForm(createEditForm(book));
    setIsEditDialogOpen(true);
  }, []);

  const openDetailDialog = useCallback((book: Book) => {
    setSelectedBook(book);
    setIsDetailDialogOpen(true);
  }, []);

  const handleSaveEdit = useCallback(async (newForm: Book) => {
    if (!newForm) {
      toast.error("Form edit belum siap.");

      return;
    }

    if (!newForm.name.trim()) {
      toast.error("Judul buku wajib diisi.");

      return;
    }

    setActiveEditKey(newForm.originalKey);

    try {
      await axios.put(route("admin.apps.class-chatting.book.items.update", { documentId: newForm.originalKey }), {
        cover: newForm.cover,
        id: newForm.id,
        bookPath: newForm.bookPath,
        playstoreId: newForm.playstoreId,
        keyword: newForm.keyword,
        lock: newForm.lock,
        name: newForm.name,
        order: newForm.order,
        price: newForm.price,
        status: newForm.status,
        version: newForm.version,
        downloadLink: newForm.downloadLink,
      });
      toast.success("Data buku berhasil diperbarui.");
      setIsEditDialogOpen(false);
      setEditForm(null);
    } catch (error) {
      console.error("Error updating book:", error);
      toast.error("Gagal memperbarui data buku.");
    } finally {
      setActiveEditKey(null);
    }
  }, []);

  const updateLockStatus = useCallback(async (book: Book, lock: boolean) => {
    try {
      await axios.put(route("admin.apps.class-chatting.book.items.lock.update", { documentId: book.originalKey }), {
        lock: lock
      });
      toast.success(`Buku berhasil ${lock ? "dikunci" : "dibuka kuncinya"}.`);
    }
    catch (error) {
      console.error("Error updating lock status:", error);
      toast.error(`Gagal ${lock ? "mengunci" : "membuka kunci"} buku.`);
    }
  }, []);

  const copyToClipboard = useCallback((text: string) => {
    if ("clipboard" in navigator) {
      navigator.clipboard.writeText(text).then(() => {
        toast.success("Link buku berhasil disalin ke clipboard.");
      }).catch(() => {
        toast.error("Gagal menyalin link buku.");
      });
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        toast.success("Link buku berhasil disalin ke clipboard.");
      } catch {
        toast.error("Gagal menyalin link buku.");
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }, []);

  const moveBookUp = useCallback((index: number) => {
    moveBook(index, "up");
  }, []);

  const moveBookDown = useCallback((index: number) => {
    moveBook(index, "down");
  }, []);

  const cancelOrderMode = useCallback(() => {
    setBooks((currentBooks) => restoreBookOrders(currentBooks));
    setIsOrderMode(false);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setBooks((currentBooks) => {
      const oldIndex = currentBooks.findIndex((book) => book.originalKey === active.id);
      const newIndex = currentBooks.findIndex((book) => book.originalKey === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return currentBooks;
      }

      return resequenceBooks(arrayMove(currentBooks, oldIndex, newIndex));
    });
  }, []);

  const existingIds = React.useMemo(() => {
    return books.map((book) => book.id);
  }, [books]);

  const canDragSort = isOrderMode && !hasActiveFilter;
  const sortableIds = React.useMemo(() => filteredBooks.map((book) => book.originalKey), [filteredBooks]);

  return (
    <>
      <Head title="Manajemen Buku" />
      <Toaster position="top-center" />

      <div className="min-h-screen space-y-6 p-4 md:p-6">
        <PageHeader
          title="Manajemen Buku"
          description="Kelola buku digital yang tersedia di aplikasi."
          actions={
            <>
              <Button
                className="flex items-center gap-2 bg-slate-900 dark:bg-white dark:text-slate-900"
                size="sm"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <PlusIcon className="w-4 h-4" />
                Tambah Buku
              </Button>
              <div className="flex flex-wrap gap-2">
                <IconButton
                  variant={isOrderMode ? "solid" : "outline"}
                  onClick={() => {
                    if (isOrderMode) {
                      cancelOrderMode();

                      return;
                    }

                    setIsOrderMode(true);
                  }}
                  title="Mode order book"
                >
                  <ArrowDownUp className="h-4 w-4" />
                </IconButton>
                <div className="flex items-center gap-1 border-l border-secondary pl-2 ml-auto">
                  <IconButton
                    variant={viewMode === "grid" ? "solid" : "ghost"}
                    onClick={() => setViewMode("grid")}
                    title="Mode grid"
                  >
                    <LayoutGridIcon className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    variant={viewMode === "table" ? "solid" : "ghost"}
                    onClick={() => setViewMode("table")}
                    title="Mode tabel"
                  >
                    <ListIcon className="h-4 w-4" />
                  </IconButton>
                </div>
              </div>
            </>
          }
        />

        <Card className="border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Card.Body className="space-y-4 p-4">
            <div className="flex flex-col lg:flex-row gap-2">
              <div className="w-full space-y-1">
                <Typography as="label" htmlFor="cari-buku" type="small" color="default" className="font-semibold">
                  Cari
                </Typography>
                <Input
                  value={search}
                  id="cari-buku"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari judul, ID buku, keyword, atau status..."
                  className="dark:text-white"
                >
                  <Input.Icon>
                    <SearchIcon className="h-4 w-4" />
                  </Input.Icon>
                </Input>
              </div>
              <div className="w-full max-w-[200px] space-y-1">
                <Typography as="label" htmlFor="filter-kategori" type="small" color="default" className="font-semibold">
                  Filter Kategori
                </Typography>
                <Select placement="bottom-end" value={selectedKeyword} onValueChange={(value) => setSelectedKeyword(value ?? "all")}>
                  <Select.Trigger id="filter-kategori" placeholder="Semua kategori">
                    {() => {
                      const selectedCategory = categories.find((category) => category.keyword === selectedKeyword);

                      return selectedKeyword === "all" ? "Semua kategori" : selectedCategory?.name ?? "Semua kategori";
                    }}
                  </Select.Trigger>
                  <Select.List className="overflow-auto">
                    <Select.Option value="all">
                      Semua kategori
                    </Select.Option>
                    {categories.map((category) => (
                      <Select.Option key={category.id} value={category.keyword}>
                        {category.name}
                      </Select.Option>
                    ))}
                  </Select.List>
                </Select>
              </div>
              <div className="w-full max-w-[200px] space-y-1">
                <Typography as="label" htmlFor="filter-status" type="small" color="default" className="font-semibold">
                  Filter Status
                </Typography>
                <Select placement="bottom-end" value={selectedStatus} onValueChange={(value) => setSelectedStatus(value ?? "all")}>
                  <Select.Trigger id="filter-status" placeholder="Semua status" value={selectedStatus} />
                  <Select.List>
                    <Select.Option value="all">
                      Semua status
                    </Select.Option>
                    <Select.Option value="publish">
                      Publish
                    </Select.Option>
                    <Select.Option value="draft">
                      Draft
                    </Select.Option>
                  </Select.List>
                </Select>
              </div>
            </div>
          </Card.Body>
        </Card>


        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <Chip size="sm" variant="ghost" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <Chip.Label>{books.length} buku</Chip.Label>
            </Chip>
            {isOrderMode && (
              <>
                <Chip size="sm" variant="ghost" className="bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  <Chip.Label>Order mode aktif</Chip.Label>
                </Chip>
                {!hasActiveFilter && (
                  <Chip size="sm" variant="ghost" className="bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                    <Chip.Label>Drag & drop untuk ubah urutan</Chip.Label>
                  </Chip>
                )}
                <Button variant="outline" onClick={cancelOrderMode}>
                  Batal
                </Button>
                <Button color="success" onClick={saveOrder} disabled={isSavingOrder}>
                  {isSavingOrder ? <LoaderCircleIcon className="h-4 w-4 animate-spin mr-2" /> : <SaveIcon className="h-4 w-4 mr-2" />}
                  Simpan
                </Button>
              </>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
              />
            ))}
          </div>
        ) : filteredBooks.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              {viewMode === "table" ? (
                <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                      <thead className="bg-slate-50 dark:bg-slate-950/60">
                        <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          <th className="px-4 py-3"></th>
                          <th className="px-4 py-3">Buku</th>
                          <th className="px-4 py-3">Keyword</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Versi</th>
                          <th className="px-4 py-3">Lock</th>
                          <th className="px-4 py-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredBooks.map((book) => (
                          <SortableBookTableRow
                            key={book.originalKey}
                            book={book}
                            books={books}
                            isOrderMode={isOrderMode}
                            hasActiveSearch={hasActiveFilter}
                            isDeleting={activeDeleteKey === book.originalKey}
                            activeDeleteKey={activeDeleteKey}
                            onView={openDetailDialog}
                            onEdit={openEditDialog}
                            onCopyLink={copyToClipboard}
                            onDelete={handleDeleteBook}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {filteredBooks.map((book) => {
                    const originalIndex = books.findIndex((item) => item.originalKey === book.originalKey);
                    const isDeleting = activeDeleteKey === book.originalKey;

                    return (
                      <GridBookCard
                        key={book.originalKey}
                        book={book}
                        isOrderMode={isOrderMode}
                        hasActiveSearch={hasActiveFilter}
                        originalIndex={originalIndex}
                        canMoveUp={originalIndex > 0}
                        canMoveDown={originalIndex < books.length - 1}
                        isDeleting={isDeleting}
                        onView={openDetailDialog}
                        onToggleLock={updateLockStatus}
                        onEdit={openEditDialog}
                        onCopyLink={copyToClipboard}
                        onDelete={handleDeleteBook}
                        onMoveUp={moveBookUp}
                        onMoveDown={moveBookDown}
                        isSortable={canDragSort}
                      />
                    );
                  })}
                </div>
              )}
            </SortableContext>
          </DndContext>
        ) : (
          <Card className="border border-dashed border-slate-300 bg-slate-50 p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <BookIcon className="h-8 w-8" />
            </div>
            <Typography variant="h6" className="mt-4 text-slate-800 dark:text-white">
              Buku tidak ditemukan
            </Typography>
            <Typography className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Periksa kata kunci pencarian atau pastikan collection <span className="font-mono">books</span> sudah memiliki data.
            </Typography>
          </Card>
        )}
      </div>

      <AddBookDialog
        open={isAddDialogOpen}
        existingIds={existingIds}
        onOpenChange={setIsAddDialogOpen}
        onAddBook={handleAddBook}
      />

      <BookEditDialog
        open={isEditDialogOpen}
        form={editForm}
        activeEditKey={activeEditKey}
        onOpenChange={setIsEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditForm(null);
        }}
        onSave={handleSaveEdit}
      />

      <BookDetailDialog
        open={isDetailDialogOpen}
        book={selectedBook}
        onOpenChange={setIsDetailDialogOpen}
        onClose={() => {
          setIsDetailDialogOpen(false);
          setSelectedBook(null);
        }}
        onCopyLink={copyToClipboard}
      />
    </>
  );
}

Index.layout = (page: React.ReactNode) => {
  return <AdminAppLayout appName="class-chatting">{page}</AdminAppLayout>;
};
