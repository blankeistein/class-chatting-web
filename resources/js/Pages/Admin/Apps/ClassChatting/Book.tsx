import React, { useCallback } from "react";
import axios from "axios";
import { Head } from "@inertiajs/react";
import {
  Button,
  Card,
  Chip,
  Dialog,
  IconButton,
  Input,
  Typography,
  Menu,
} from "@material-tailwind/react";
import {
  ArrowDownIcon,
  ArrowDownUp,
  ArrowUpIcon,
  BookIcon,
  Copy,
  LayoutGridIcon,
  ListIcon,
  LoaderCircleIcon,
  LockIcon,
  MoreVertical,
  PencilIcon,
  PlusIcon,
  SaveIcon,
  SearchIcon,
  Trash2Icon,
  UnlockIcon,
  XIcon,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { onValue, ref, remove, set, update } from "firebase/database";
import AdminAppLayout from "@/Layouts/AdminAppLayout";
import { getFirebaseAuth, getFirebaseDatabase } from "@/lib/firebase";
import BookEditDialog, { type FirebaseBookForm } from "./BookEditDialog";

type MysqlBook = {
  id: number;
  uuid: string;
  title: string;
  coverUrl: string;
  tags: string[] | null;
  url: string | null;
  version: number;
};

type FirebaseBook = FirebaseBookForm;

const ALL_BOOKS_PATH = "/AllBooks";

const normalizeBook = (key: string, value: Partial<FirebaseBook>): FirebaseBook => {
  return {
    originalKey: key,
    coverBook: value.coverBook ?? "",
    idBook: value.idBook ?? key,
    idBookPath: value.idBookPath ?? key,
    idPlaystore: value.idPlaystore ?? value.idBook ?? key,
    keyword: value.keyword ?? "",
    lock: Boolean(value.lock),
    nameBook: value.nameBook ?? "-",
    orderBook: typeof value.orderBook === "number" ? value.orderBook : Number.MAX_SAFE_INTEGER,
    price: typeof value.price === "number" ? value.price : Number(value.price ?? 0),
    status: value.status ?? "draft",
    urlBook: value.urlBook ?? "",
    version: typeof value.version === "number" ? value.version : Number(value.version ?? 1),
  };
};

const createRealtimePayloadFromMysql = (book: MysqlBook, orderBook: number) => {
  const baseId = book.uuid.replace(/-/g, "").toUpperCase();
  const keyword = book.tags?.[0] ?? "";

  return {
    coverBook: book.coverUrl,
    idBook: baseId,
    idBookPath: baseId,
    idPlaystore: baseId,
    keyword,
    lock: false,
    nameBook: book.title,
    orderBook,
    price: 0,
    status: "publish",
    urlBook: book.url ?? "",
    version: book.version ?? 1,
  };
};

const sortBooks = (items: FirebaseBook[]) => {
  return [...items].sort((left, right) => {
    if (left.orderBook !== right.orderBook) {
      return left.orderBook - right.orderBook;
    }

    return left.nameBook.localeCompare(right.nameBook);
  });
};

const resequenceBooks = (items: FirebaseBook[]) => {
  return items.map((book, index) => ({
    ...book,
    orderBook: index + 1,
  }));
};

const createEditForm = (book: FirebaseBook): FirebaseBookForm => ({
  ...book,
});

export default function Book() {
  const database = React.useMemo(() => getFirebaseDatabase(), []);
  const [books, setBooks] = React.useState<FirebaseBook[]>([]);
  const [search, setSearch] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"grid" | "table">("grid");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSavingOrder, setIsSavingOrder] = React.useState(false);
  const [isOrderMode, setIsOrderMode] = React.useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [mysqlBooks, setMysqlBooks] = React.useState<MysqlBook[]>([]);
  const [mysqlSearch, setMysqlSearch] = React.useState("");
  const deferredMysqlSearch = React.useDeferredValue(mysqlSearch);
  const [isMysqlLoading, setIsMysqlLoading] = React.useState(false);
  const [activeMysqlBookId, setActiveMysqlBookId] = React.useState<number | null>(null);
  const [activeDeleteKey, setActiveDeleteKey] = React.useState<string | null>(null);
  const [activeEditKey, setActiveEditKey] = React.useState<string | null>(null);
  const [editForm, setEditForm] = React.useState<FirebaseBookForm | null>(null);

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
        const items = Object.entries(value ?? {}).map(([key, payload]) => normalizeBook(key, payload));
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

  React.useEffect(() => {
    if (!isAddDialogOpen) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsMysqlLoading(true);

      try {
        const response = await axios.get<MysqlBook[]>(route("admin.books.selection"), {
          params: { search: deferredMysqlSearch },
          signal: controller.signal,
        });

        setMysqlBooks(response.data);
      } catch (error) {
        if (!axios.isCancel(error)) {
          setMysqlBooks([]);
          toast.error("Gagal mengambil daftar buku MySQL.");
        }
      } finally {
        setIsMysqlLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [deferredMysqlSearch, isAddDialogOpen]);

  const filteredBooks = React.useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return books;
    }

    return books.filter((book) => {
      return [
        book.nameBook,
        book.idBook,
        book.keyword,
        book.status,
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [books, search]);

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

    setIsSavingOrder(true);

    try {
      const updates = books.reduce<Record<string, number>>((accumulator, book, index) => {
        accumulator[`AllBooks/${book.originalKey}/orderBook`] = index + 1;

        return accumulator;
      }, {});

      await update(ref(database), updates);
      setBooks((currentBooks) => resequenceBooks(currentBooks));
      setIsOrderMode(false);
      toast.success("Urutan buku berhasil disimpan.");
    } catch (error) {
      toast.error("Gagal menyimpan urutan buku.");
    } finally {
      setIsSavingOrder(false);
    }
  }, [database, books]);

  const handleAddBook = useCallback(async (book: MysqlBook) => {
    if (!database) {
      toast.error("Firebase Realtime Database belum siap.");

      return;
    }

    const payload = createRealtimePayloadFromMysql(book, books.length + 1);
    const duplicateBook = books.find((item) => item.idBook === payload.idBook || item.originalKey === payload.idBookPath);

    if (duplicateBook) {
      toast.error("Buku ini sudah ada di Realtime Database.");

      return;
    }

    setActiveMysqlBookId(book.id);

    try {
      await set(ref(database, `${ALL_BOOKS_PATH}/${payload.idBookPath}`), payload);
      toast.success("Buku berhasil ditambahkan ke Realtime Database.");
    } catch (error) {
      toast.error("Gagal menambahkan buku ke Realtime Database.");
    } finally {
      setActiveMysqlBookId(null);
    }
  }, [database, books]);

  const handleDeleteBook = useCallback(async (book: FirebaseBook) => {
    if (!database) {
      toast.error("Firebase Realtime Database belum siap.");

      return;
    }

    if (!window.confirm(`Hapus "${book.nameBook}" dari Realtime Database?`)) {
      return;
    }

    setActiveDeleteKey(book.originalKey);

    try {
      await remove(ref(database, `${ALL_BOOKS_PATH}/${book.originalKey}`));

      const remainingBooks = resequenceBooks(
        books.filter((item) => item.originalKey !== book.originalKey),
      );

      const updates = remainingBooks.reduce<Record<string, number>>((accumulator, item) => {
        accumulator[`AllBooks/${item.originalKey}/orderBook`] = item.orderBook;

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

  const openEditDialog = useCallback((book: FirebaseBook) => {
    setEditForm(createEditForm(book));
    setIsEditDialogOpen(true);
  }, []);

  const handleSaveEdit = useCallback(async (newForm: FirebaseBookForm) => {
    if (!database || !newForm) {
      toast.error("Form edit belum siap.");

      return;
    }

    if (!newForm.nameBook.trim()) {
      toast.error("Judul buku wajib diisi.");

      return;
    }

    setActiveEditKey(newForm.originalKey);

    try {
      await update(ref(database, `${ALL_BOOKS_PATH}/${newForm.originalKey}`), {
        coverBook: newForm.coverBook,
        idBook: newForm.idBook,
        idBookPath: newForm.idBookPath,
        idPlaystore: newForm.idPlaystore,
        keyword: newForm.keyword,
        lock: newForm.lock,
        nameBook: newForm.nameBook,
        orderBook: newForm.orderBook,
        price: newForm.price,
        status: newForm.status,
        urlBook: newForm.urlBook,
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

  const updateLockStatus = useCallback(async (book: FirebaseBook, lock: boolean) => {
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

  return (
    <>
      <Head title="Manajemen Buku" />
      <Toaster position="top-center" />

      <div className="min-h-screen space-y-6 p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Typography variant="h4" className="font-bold text-slate-800 dark:text-white">
              Daftar Buku
            </Typography>
            <Typography className="text-slate-500 dark:text-slate-400">
              Kelola buku digital yang tersedia di aplikasi.
            </Typography>
          </div>
          <div className="flex gap-2">
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
                onClick={() => setIsOrderMode((value) => !value)}
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
          </div>
        </div>

        <Card className="w-full border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex flex-col gap-3">
            <Typography variant="small" className="font-semibold text-slate-700 dark:text-slate-200">
              Pencarian dan aksi cepat
            </Typography>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari judul, ID buku, keyword, atau status..."
              className="dark:text-white"
            >
              <Input.Icon>
                <SearchIcon className="h-4 w-4" />
              </Input.Icon>
            </Input>
          </div>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="ml-auto flex items-center gap-2">
            <Chip size="sm" variant="ghost" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <Chip.Label>{books.length} buku</Chip.Label>
            </Chip>
            {isOrderMode && (
              <>
                <Chip size="sm" variant="ghost" className="bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  <Chip.Label>Order mode aktif</Chip.Label>
                </Chip>
                <Button variant="outline" onClick={() => setIsOrderMode(false)}>
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
          viewMode === "table" ? (
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
                    {filteredBooks.map((book) => {
                      const originalIndex = books.findIndex((item) => item.originalKey === book.originalKey);
                      const isDeleting = activeDeleteKey === book.originalKey;

                      return (
                        <tr key={book.originalKey} className="align-top">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              {isOrderMode && !search ? (
                                <div className="flex flex-col gap-1">
                                  <IconButton
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => moveBook(originalIndex, "up")}
                                    disabled={originalIndex <= 0}
                                  >
                                    <ArrowUpIcon className="h-4 w-4" />
                                  </IconButton>
                                  <IconButton
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => moveBook(originalIndex, "down")}
                                    disabled={originalIndex >= books.length - 1}
                                  >
                                    <ArrowDownIcon className="h-4 w-4" />
                                  </IconButton>
                                </div>
                              ) : (
                                <span className="font-semibold text-slate-700 dark:text-slate-200">#{book.orderBook}</span>
                              )
                              }
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex min-w-[20rem] items-center gap-3">
                              <div className="h-20 w-12 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950">
                                {book.coverBook ? (
                                  <img
                                    src={book.coverBook}
                                    alt={book.nameBook}
                                    className="h-full w-full object-cover"
                                    onError={(event) => {
                                      (event.target as HTMLImageElement).src = "https://placehold.co/120x180?text=No+Cover";
                                    }}
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-slate-400">
                                    <BookIcon className="h-5 w-5" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <Typography className="line-clamp-2 font-semibold text-slate-800 dark:text-white">
                                  {book.nameBook}
                                </Typography>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">{book.keyword || "-"}</td>
                          <td className="px-4 py-4">
                            <Chip size="sm" variant="ghost" color={book.status === "publish" ? "success" : "warning"}>
                              <Chip.Label>{book.status}</Chip.Label>
                            </Chip>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">{book.version}</td>
                          <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">{book.lock ? <LockIcon className="w-4 h-4" /> : <UnlockIcon className="w-4 h-4" />}</td>
                          <td className="px-4 py-4">
                            <Menu placement="bottom-end">
                              <Menu.Trigger as={IconButton} variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Menu.Trigger>
                              <Menu.Content>
                                <Menu.Item onClick={() => openEditDialog(book)}>
                                  <PencilIcon className="h-4 w-4 mr-2" />
                                  Edit
                                </Menu.Item>
                                <Menu.Item onClick={() => copyToClipboard(book.urlBook)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Salin Link
                                </Menu.Item>
                                <Menu.Item
                                  className="text-error"
                                  onClick={() => handleDeleteBook(book)}
                                  disabled={isDeleting}>
                                  {isDeleting ? <LoaderCircleIcon className="h-4 w-4 animate-spin mr-2" /> : <Trash2Icon className="h-4 w-4 mr-2" />}
                                  Hapus
                                </Menu.Item>
                              </Menu.Content>
                            </Menu>
                          </td>
                        </tr>
                      );
                    })}
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
                  <Card key={book.originalKey} className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <Card.Header className="relative overflow-hidden p-0">
                      <div className="h-[320px] w-full shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950">
                        <img
                          src={book.coverBook || "/assets/images/book-thumbnail.webp"}
                          alt={book.nameBook}
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            (event.target as HTMLImageElement).src = "/assets/images/book-thumbnail.webp";
                          }}
                        />
                      </div>
                      <div className="p-2 !absolute top-2 left-0 w-full flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {
                            isOrderMode && !search ? (
                              <Chip size="sm" color="warning">
                                <Chip.Label>#{book.orderBook}</Chip.Label>
                              </Chip>
                            ) : (
                              <IconButton size="sm" onClick={() => updateLockStatus(book, !book.lock)} title={book.lock ? "Buka kunci buku" : "Kunci buku"}>
                                {book.lock ? <LockIcon className="h-4 w-4" /> : <UnlockIcon className="h-4 w-4" />}
                              </IconButton>
                            )
                          }
                        </div>
                        <Menu placement="bottom-end">
                          <Menu.Trigger as={IconButton} className="rounded-full" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Menu.Trigger>
                          <Menu.Content>
                            <Menu.Item onClick={() => openEditDialog(book)}>
                              <PencilIcon className="h-4 w-4 mr-2" />
                              Edit
                            </Menu.Item>
                            <Menu.Item onClick={() => copyToClipboard(book.urlBook)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Salin Link
                            </Menu.Item>
                            <Menu.Item
                              className="text-error"
                              onClick={() => handleDeleteBook(book)}
                              disabled={isDeleting}>
                              {isDeleting ? <LoaderCircleIcon className="h-4 w-4 animate-spin mr-2" /> : <Trash2Icon className="h-4 w-4 mr-2" />}
                              Hapus
                            </Menu.Item>
                          </Menu.Content>
                        </Menu>
                      </div>
                    </Card.Header>
                    <Card.Body>
                      <div className="grid grid-rows-[auto_max-content] gap-4">
                        <div className="w-full flex flex-col items-start justify-between gap-2">
                          <div className="flex gap-2">
                            <Chip size="sm" variant="ghost" color={book.status === "publish" ? "success" : "warning"}>
                              <Chip.Label>{book.status}</Chip.Label>
                            </Chip>
                          </div>
                          <div className="min-w-0">
                            <Typography className="line-clamp-2 font-semibold text-slate-800 dark:text-white">
                              {book.nameBook}
                            </Typography>
                          </div>
                          <div className="w-full">
                            <Typography as="p" className="text-sm mb-1">
                              Keyword:
                            </Typography>
                            <div className="flex items-center gap-1">
                              {
                                (book.keyword || "")?.split(',').map((keyword) => keyword.trim()).filter((keyword) => keyword).map((keyword) => (
                                  <Chip key={keyword} size="sm" variant="outline" >
                                    <Chip.Label>{keyword}</Chip.Label>
                                  </Chip>
                                ))
                              }
                            </div>
                          </div>
                        </div>
                        {isOrderMode && !search && (
                          <div className="flex items-center gap-2 mt-auto">
                            <IconButton
                              variant="ghost"
                              size="sm"
                              onClick={() => moveBook(originalIndex, "up")}
                              disabled={originalIndex <= 0}
                            >
                              <ArrowUpIcon className="h-4 w-4" />
                            </IconButton>
                            <IconButton
                              variant="ghost"
                              size="sm"
                              onClick={() => moveBook(originalIndex, "down")}
                              disabled={originalIndex >= books.length - 1}
                            >
                              <ArrowDownIcon className="h-4 w-4" />
                            </IconButton>
                          </div>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                );
              })}
            </div>
          )
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

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} size="lg">
        <Dialog.Overlay>
          <Dialog.Content className="grid max-h-[90vh] grid-rows-[auto_1fr_auto] overflow-hidden p-0 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <div>
                <Typography variant="h5" className="font-bold text-slate-800 dark:text-white">
                  Tambah buku dari database MySQL
                </Typography>
                <Typography className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Pilih buku MySQL untuk dikirim ke path <span className="font-mono">/AllBooks</span>.
                </Typography>
              </div>
              <IconButton variant="ghost" size="sm" onClick={() => setIsAddDialogOpen(false)}>
                <XIcon className="h-4 w-4" />
              </IconButton>
            </div>

            <div className="space-y-4 overflow-y-auto px-5 py-4">
              <Input
                value={mysqlSearch}
                onChange={(event) => setMysqlSearch(event.target.value)}
                placeholder="Cari judul buku MySQL..."
              >
                <Input.Icon>
                  <SearchIcon className="h-4 w-4" />
                </Input.Icon>
              </Input>

              <div className="space-y-3 pr-1">
                {isMysqlLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
                  ))
                ) : mysqlBooks.length > 0 ? (
                  mysqlBooks.map((book) => {
                    const realtimeId = book.uuid.replace(/-/g, "").toUpperCase();
                    const existsInRealtime = books.some((item) => item.idBook === realtimeId || item.originalKey === realtimeId);
                    const isAdding = activeMysqlBookId === book.id;

                    return (
                      <Card key={book.id} className="border border-slate-200 p-4 shadow-none dark:border-slate-800">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center">
                          <img
                            src={book.coverUrl}
                            alt={book.title}
                            className="h-24 w-16 rounded-xl border border-slate-200 object-cover dark:border-slate-800"
                          />
                          <div className="min-w-0 flex-1">
                            <Typography className="font-semibold text-slate-800 dark:text-white">
                              {book.title}
                            </Typography>
                            <Typography className="mt-1 break-all font-mono text-xs text-slate-500 dark:text-slate-400">
                              {book.uuid}
                            </Typography>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Chip size="sm" variant="ghost" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                <Chip.Label>v{book.version}</Chip.Label>
                              </Chip>
                              {(book.tags ?? []).slice(0, 3).map((tag) => (
                                <Chip key={tag} size="sm" variant="ghost" className="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                                  <Chip.Label>{tag}</Chip.Label>
                                </Chip>
                              ))}
                            </div>
                          </div>
                          <Button
                            color={existsInRealtime ? "secondary" : "success"}
                            disabled={existsInRealtime || isAdding}
                            className="flex items-center justify-center gap-2"
                            onClick={() => handleAddBook(book)}
                          >
                            {isAdding ? <LoaderCircleIcon className="h-4 w-4 animate-spin" /> : <PlusIcon className="h-4 w-4" />}
                            {existsInRealtime ? "Sudah ada" : "Tambah"}
                          </Button>
                        </div>
                      </Card>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900">
                    <Typography className="font-medium text-slate-700 dark:text-slate-200">
                      Data buku MySQL tidak ditemukan
                    </Typography>
                    <Typography className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Coba ubah kata kunci pencarian.
                    </Typography>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-100 px-5 py-4 dark:border-slate-800">
              <Button variant="ghost" color="secondary" onClick={() => setIsAddDialogOpen(false)}>
                Tutup
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog>

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
    </>
  );
}

Book.layout = (page: React.ReactNode) => {
  return <AdminAppLayout appName="Class Chatting">{page}</AdminAppLayout>;
};
