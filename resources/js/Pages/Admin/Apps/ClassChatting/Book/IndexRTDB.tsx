import React, { useCallback } from "react";
import { Head } from "@inertiajs/react";
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
import { onValue, ref, remove, set, update } from "firebase/database";
import AdminAppLayout from "@/Layouts/AdminAppLayout";
import { getFirebaseDatabase } from "@/lib/firebase";
import BookEditDialog from "./Partials/EditBookDialog";
import { GridBookCard } from "./Partials/GridBookCard";
import AddBookDialog, { type Book as NewBook } from "./Partials/AddBookDialog";
import BookDetailDialog from "./Partials/BookDetailDialog";
import { PageHeader } from "@/Components/PageHeader";
import { Book } from "./Index";
import SortableBookTableRow from "./Partials/SortableBookTableRow";

export type FirebaseRTDBBookForm = {
  coverBook: string;
  idBook: string;
  idBookPath: string;
  idPlaystore: string;
  keyword: string;
  lock: boolean;
  nameBook: string;
  orderBook: number;
  price: number;
  status: string;
  urlBook: string;
  version: number;
};

type FirebaseBook = FirebaseRTDBBookForm;

const ALL_BOOKS_PATH = "/AllBooks";

const normalizeBook = (key: string, value: Partial<FirebaseRTDBBookForm>): Book => {
  return {
    originalKey: key,
    cover: value.coverBook ?? "",
    id: value.idBook ?? key,
    bookPath: value.idBookPath ?? key,
    playstoreId: value.idPlaystore ?? value.idBook ?? key,
    keyword: value.keyword ?? "",
    lock: Boolean(value.lock),
    name: value.nameBook ?? "-",
    oldOrder: typeof value.orderBook === "number" ? value.orderBook : Number.MAX_SAFE_INTEGER,
    order: typeof value.orderBook === "number" ? value.orderBook : Number.MAX_SAFE_INTEGER,
    price: typeof value.price === "number" ? value.price : Number(value.price ?? 0),
    status: value.status ?? "draft",
    downloadLink: value.urlBook ?? "",
    version: typeof value.version === "number" ? value.version : Number(value.version ?? 1),
  };
};

const createRealtimePayloadFromMysql = (book: NewBook, orderBook: number): FirebaseRTDBBookForm => {
  const baseId = book.uuid;
  const keyword = book.tags?.join(",") ?? "";

  return {
    coverBook: book.coverUrl,
    idBook: baseId,
    idBookPath: baseId,
    idPlaystore: baseId,
    keyword,
    lock: false,
    nameBook: book.title,
    orderBook: orderBook,
    price: 0,
    status: "publish",
    urlBook: book.downloadLink ?? "",
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

const createEditForm = (book: Book): Book => ({
  ...book,
});

export default function IndexRTDB() {
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
  const database = React.useMemo(() => getFirebaseDatabase(), []);
  const [books, setBooks] = React.useState<Book[]>([]);
  const [search, setSearch] = React.useState("");
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
    if (!database) {
      setIsLoading(false);
      toast.error("Firebase Realtime Database belum terkonfigurasi. Tambahkan VITE_FIREBASE_DATABASE_URL.");

      return;
    }

    const booksReference = ref(database, ALL_BOOKS_PATH);
    const unsubscribe = onValue(
      booksReference,
      (snapshot) => {
        const value = snapshot.val() as Record<string, Partial<FirebaseBook>> | null;
        const items = Object.entries(value ?? {}).map(([key, payload]) => normalizeBook(key, payload)) as Book[];
        setBooks(resequenceBooks(sortBooks(items)));
        setIsLoading(false);
      },
      () => {
        toast.error("Gagal membaca data buku dari Firebase.");
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [database]);

  const filteredBooks = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    const hasStatusFilter = selectedStatus !== "all";

    return books.filter((book) => {
      const matchesSearch = !query || [
        book.name,
        book.id,
        book.keyword,
        book.status,
      ].some((value) => value.toLowerCase().includes(query));

      const matchesStatus = !hasStatusFilter || book.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [books, search, selectedStatus]);

  const hasActiveSearch = search.trim().length > 0;
  const hasActiveStatusFilter = selectedStatus !== "all";
  const hasActiveFilter = hasActiveSearch || hasActiveStatusFilter;

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
    if (!database) {
      toast.error("Firebase Realtime Database belum siap.");

      return;
    }

    const changedBooks = books
      .map((book, index) => ({
        originalKey: book.originalKey,
        oldOrder: book.oldOrder,
        order: index + 1,
      }))
      .filter((book) => book.oldOrder !== book.order);

    if (changedBooks.length === 0) {
      setIsOrderMode(false);
      toast("Tidak ada perubahan urutan buku.");

      return;
    }

    setIsSavingOrder(true);

    try {
      const updates = changedBooks.reduce<Record<string, number>>((accumulator, book) => {
        accumulator[`AllBooks/${book.originalKey}/orderBook`] = book.order;

        return accumulator;
      }, {});

      await update(ref(database), updates);
      setBooks((currentBooks) => commitBookOrders(currentBooks));
      setIsOrderMode(false);
      toast.success("Urutan buku berhasil disimpan.");
    } catch (error) {
      toast.error("Gagal menyimpan urutan buku.");
    } finally {
      setIsSavingOrder(false);
    }
  }, [database, books]);

  const handleAddBook = useCallback(async (book: NewBook) => {
    if (!database) {
      toast.error("Firebase Realtime Database belum siap.");

      return;
    }

    const payload = createRealtimePayloadFromMysql(book, books.length + 1);
    const duplicateBook = books.find((item) => item.id === payload.idBook || item.originalKey === payload.idBookPath);

    if (duplicateBook) {
      toast.error("Buku ini sudah ada di Realtime Database.");

      return;
    }

    try {
      await set(ref(database, `${ALL_BOOKS_PATH}/${payload.idBookPath}`), payload);
      toast.success("Buku berhasil ditambahkan ke Realtime Database.");
    } catch (error) {
      toast.error("Gagal menambahkan buku ke Realtime Database.");
    }
  }, [database, books]);

  const handleDeleteBook = useCallback(async (book: Book) => {
    if (!database) {
      toast.error("Firebase Realtime Database belum siap.");

      return;
    }

    if (!window.confirm(`Hapus "${book.name}" dari Realtime Database?`)) {
      return;
    }

    setActiveDeleteKey(book.originalKey);

    try {
      await remove(ref(database, `${ALL_BOOKS_PATH}/${book.originalKey}`));

      const remainingBooks = books
        .filter((item) => item.originalKey !== book.originalKey)
        .filter((item) => item.order > book.order)
        .sort((left, right) => {
          if (left.order !== right.order) {
            return left.order - right.order;
          }

          return left.name.localeCompare(right.name);
        });

      const updates = remainingBooks.reduce<Record<string, number>>((accumulator, item) => {
        accumulator[`AllBooks/${item.originalKey}/orderBook`] = item.order - 1;

        return accumulator;
      }, {});

      if (Object.keys(updates).length > 0) {
        await update(ref(database), updates);
      }

      toast.success("Buku berhasil dihapus dari Realtime Database.");
    } catch (error) {
      toast.error("Gagal menghapus buku dari Realtime Database.");
    } finally {
      setActiveDeleteKey(null);
    }
  }, [database, books]);

  const openEditDialog = useCallback((book: Book) => {
    setEditForm(createEditForm(book));
    setIsEditDialogOpen(true);
  }, []);

  const openDetailDialog = useCallback((book: Book) => {
    setSelectedBook(book);
    setIsDetailDialogOpen(true);
  }, []);

  const handleSaveEdit = useCallback(async (newForm: Book) => {
    if (!database || !newForm) {
      toast.error("Form edit belum siap.");

      return;
    }

    if (!newForm.name.trim()) {
      toast.error("Judul buku wajib diisi.");

      return;
    }

    setActiveEditKey(newForm.originalKey);

    try {
      await update(ref(database, `${ALL_BOOKS_PATH}/${newForm.originalKey}`), {
        coverBook: newForm.cover,
        idBookPath: newForm.bookPath,
        idPlaystore: newForm.playstoreId,
        keyword: newForm.keyword,
        lock: newForm.lock,
        nameBook: newForm.name,
        orderBook: newForm.order,
        price: newForm.price,
        status: newForm.status,
        urlBook: newForm.downloadLink,
        version: newForm.version,
      });
      toast.success("Data buku berhasil diperbarui.");
      setIsEditDialogOpen(false);
      setEditForm(null);
    } catch (error) {
      toast.error("Gagal memperbarui data buku.");
    } finally {
      setActiveEditKey(null);
    }
  }, [database]);

  const updateLockStatus = useCallback(async (book: Book, lock: boolean) => {
    if (!database) {
      return;
    }

    try {
      await update(ref(database, `${ALL_BOOKS_PATH}/${book.originalKey}`), { lock });
      toast.success(`Buku berhasil ${lock ? "dikunci" : "dibuka kuncinya"}.`);
    }
    catch (error) {
      toast.error(`Gagal ${lock ? "mengunci" : "membuka kunci"} buku.`);
    }
  }, [database]);

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

  const existingRealtimeIds = React.useMemo(() => {
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
              Periksa kata kunci pencarian atau pastikan path <span className="font-mono">/AllBooks</span> sudah memiliki data.
            </Typography>
          </Card>
        )}
      </div>

      <AddBookDialog
        open={isAddDialogOpen}
        existingIds={existingRealtimeIds}
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

IndexRTDB.layout = (page: React.ReactNode) => {
  return <AdminAppLayout appName="class-chatting">{page}</AdminAppLayout>;
};
