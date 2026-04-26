import React from "react";
import axios from "axios";
import { Head, Link } from "@inertiajs/react";
import {
  Button,
  Card,
  Chip,
  Input,
  Typography,
} from "@material-tailwind/react";
import {
  BookIcon,
  ChevronRightIcon,
  LayoutGridIcon,
  SearchIcon,
} from "lucide-react";
import AdminAppLayout from "@/Layouts/AdminAppLayout";

interface Book {
  id: number;
  title: string;
}

export default function ClassChatting() {
  const [books, setBooks] = React.useState<Book[]>([]);
  const [search, setSearch] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const controller = new AbortController();
    const fetchBooks = async () => {
      setIsLoading(true);

      try {
        const response = await axios.get(route("admin.books.selection"), {
          params: { search },
          signal: controller.signal,
        });

        setBooks(response.data);
      } catch (error) {
        if (!axios.isCancel(error)) {
          setBooks([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = window.setTimeout(fetchBooks, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [search]);

  return (
    <>
      <Head title="Class Chatting" />

      <div className="min-h-screen space-y-6 p-4 md:p-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-amber-50 via-white to-sky-50 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200 backdrop-blur dark:bg-slate-800/80 dark:text-slate-300 dark:ring-slate-700">
                <LayoutGridIcon className="h-3.5 w-3.5" />
                Aplikasi Class Chatting
              </div>
              <Typography variant="h3" className="text-slate-900 dark:text-white">
                Pilih buku untuk membuka halaman informasi dengan cepat
              </Typography>
              <Typography className="mt-3 max-w-xl text-slate-600 dark:text-slate-300">
                Gunakan tombol buku di bawah untuk membuka detail buku, mengecek metadata, dan lanjut ke pengelolaan konten yang dibutuhkan.
              </Typography>
            </div>

            <Card className="w-full max-w-md border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
              <Typography variant="small" className="mb-2 font-semibold text-slate-700 dark:text-slate-200">
                Cari Buku
              </Typography>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ketik judul buku..."
                className="dark:text-white"
              >
                <Input.Icon>
                  <SearchIcon className="h-4 w-4" />
                </Input.Icon>
              </Input>
              <Typography variant="small" className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Menampilkan maksimal 20 buku terbaru sesuai pencarian.
              </Typography>
            </Card>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <Typography variant="h5" className="font-bold text-slate-800 dark:text-white">
              Tombol Buku
            </Typography>
            <Typography className="text-sm text-slate-500 dark:text-slate-400">
              Tekan salah satu tombol untuk membuka halaman informasi buku.
            </Typography>
          </div>
          <Chip size="sm" variant="ghost" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <Chip.Label>{books.length} buku</Chip.Label>
          </Chip>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
              />
            ))}
          </div>
        ) : books.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {books.map((book) => (
              <Link key={book.id} href={route("admin.books.show", book.id)} className="block">
                <Card className="group h-full border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                      <BookIcon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Typography className="line-clamp-2 font-semibold text-slate-800 transition-colors group-hover:text-primary dark:text-white">
                        {book.title}
                      </Typography>
                      <Typography className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        ID Buku: {book.id}
                      </Typography>
                    </div>
                    <Button
                      size="sm"
                      color="secondary"
                      className="flex shrink-0 items-center gap-2"
                    >
                      Buka
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              </Link>
            ))}
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
              Coba ubah kata kunci pencarian untuk menampilkan tombol buku lainnya.
            </Typography>
          </Card>
        )}
      </div>
    </>
  );
}

ClassChatting.layout = (page: React.ReactNode) => {
  return <AdminAppLayout appName="Class Chatting">{page}</AdminAppLayout>;
};
