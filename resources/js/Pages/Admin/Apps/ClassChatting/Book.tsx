import React from "react";
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
} from "@material-tailwind/react";
import {
  ArrowDownIcon,
  ArrowDownUp,
  ArrowUpIcon,
  BookIcon,
  LayoutGridIcon,
  LoaderCircleIcon,
  PlusIcon,
  RefreshCcwIcon,
  SaveIcon,
  SearchIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { onValue, ref, remove, set, update } from "firebase/database";
import AdminAppLayout from "@/Layouts/AdminAppLayout";
import { getFirebaseDatabase } from "@/lib/firebase";

type MysqlBook = {
  id: number;
  uuid: string;
  title: string;
  coverUrl: string;
  tags: string[] | null;
  url: string | null;
  version: number;
};

type FirebaseBook = {
  originalKey: string;
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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID").format(amount);
};

export default function Book() {
  const database = React.useMemo(() => getFirebaseDatabase(), []);
  const [books, setBooks] = React.useState<FirebaseBook[]>([]);
  const [search, setSearch] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSavingOrder, setIsSavingOrder] = React.useState(false);
  const [isOrderMode, setIsOrderMode] = React.useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [mysqlBooks, setMysqlBooks] = React.useState<MysqlBook[]>([]);
  const [mysqlSearch, setMysqlSearch] = React.useState("");
  const deferredMysqlSearch = React.useDeferredValue(mysqlSearch);
  const [isMysqlLoading, setIsMysqlLoading] = React.useState(false);
  const [activeMysqlBookId, setActiveMysqlBookId] = React.useState<number | null>(null);
  const [activeDeleteKey, setActiveDeleteKey] = React.useState<string | null>(null);

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

  const moveBook = (index: number, direction: "up" | "down") => {
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
  };

  const saveOrder = async () => {
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
  };

  const handleAddBook = async (book: MysqlBook) => {
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
  };

  const handleDeleteBook = async (book: FirebaseBook) => {
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
  };

  return (
    <>
      <Head title="Manajemen Buku" />
      <Toaster position="top-right" />

      <div className="min-h-screen space-y-6 p-4 md:p-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-amber-50 via-white to-cyan-50 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <div className="flex flex-col gap-6 p-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200 backdrop-blur dark:bg-slate-800/80 dark:text-slate-300 dark:ring-slate-700">
                <LayoutGridIcon className="h-3.5 w-3.5" />
                Class Chatting / AllBooks
              </div>
              <Typography variant="h3" className="text-slate-900 dark:text-white">
                Manajemen buku Realtime Database
              </Typography>
              <Typography className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
                Kelola daftar buku pada path Firebase Realtime Database <span className="font-mono">/AllBooks</span>, tambahkan dari data buku MySQL, ubah urutan tampil, dan hapus item tanpa memengaruhi data buku utama di MySQL.
              </Typography>
            </div>


          </div>
        </div>

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
              >
                <ArrowDownUp className="h-4 w-4" />
              </IconButton>
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
              <Chip size="sm" variant="ghost" className="bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                <Chip.Label>Order mode aktif</Chip.Label>
              </Chip>
            )}
            {isOrderMode && (
              <Button
                color="success"
                className="flex items-center gap-2"
                onClick={saveOrder}
                disabled={isSavingOrder}
              >
                {isSavingOrder ? <LoaderCircleIcon className="h-4 w-4 animate-spin" /> : <SaveIcon className="h-4 w-4" />}
                Simpan
              </Button>
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
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {filteredBooks.map((book, index) => {
              const originalIndex = books.findIndex((item) => item.originalKey === book.originalKey);
              const isDeleting = activeDeleteKey === book.originalKey;

              return (
                <Card key={book.originalKey} className="border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex gap-4">
                    <div className="flex w-20 shrink-0 flex-col items-center gap-2">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                        <span className="text-sm font-bold">#{book.orderBook}</span>
                      </div>

                      {isOrderMode && !search && (
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
                      )}
                    </div>

                    <div className="h-28 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950">
                      {book.coverBook ? (
                        <img
                          src={book.coverBook}
                          alt={book.nameBook}
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            (event.target as HTMLImageElement).src = "https://placehold.co/200x300?text=No+Cover";
                          }}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-400">
                          <BookIcon className="h-8 w-8" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Typography className="line-clamp-2 font-semibold text-slate-800 dark:text-white">
                            {book.nameBook}
                          </Typography>
                          <Typography className="mt-1 break-all font-mono text-xs text-slate-500 dark:text-slate-400">
                            {book.idBook}
                          </Typography>
                        </div>

                        <div className="flex gap-2">
                          <Chip size="sm" variant="ghost" className={book.status === "publish" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}>
                            <Chip.Label>{book.status}</Chip.Label>
                          </Chip>
                          <Button
                            color="error"
                            size="sm"
                            className="flex items-center gap-2"
                            onClick={() => handleDeleteBook(book)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? <LoaderCircleIcon className="h-4 w-4 animate-spin" /> : <Trash2Icon className="h-4 w-4" />}
                            Hapus
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-2">
                        <div>
                          <span className="font-medium">Keyword:</span> {book.keyword || "-"}
                        </div>
                        <div>
                          <span className="font-medium">Versi:</span> {book.version}
                        </div>
                        <div>
                          <span className="font-medium">Harga:</span> Rp {formatCurrency(book.price)}
                        </div>
                        <div>
                          <span className="font-medium">Lock:</span> {book.lock ? "Ya" : "Tidak"}
                        </div>
                      </div>

                      <div className="mt-3">
                        <Typography className="text-xs text-slate-500 dark:text-slate-400">
                          URL Buku
                        </Typography>
                        <Typography className="mt-1 break-all text-xs text-slate-600 dark:text-slate-300">
                          {book.urlBook || "-"}
                        </Typography>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
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
    </>
  );
}

Book.layout = (page: React.ReactNode) => {
  return <AdminAppLayout appName="Class Chatting">{page}</AdminAppLayout>;
};
