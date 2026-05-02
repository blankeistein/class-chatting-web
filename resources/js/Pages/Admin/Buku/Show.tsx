import React from "react";
import { Head, router } from "@inertiajs/react";
import { Button, Card, Chip, IconButton, Typography } from "@material-tailwind/react";
import AdminLayout from "@/Layouts/AdminLayout";
import {
  ArrowLeftIcon,
  BookIcon,
  CalendarIcon,
  CopyIcon,
  EditIcon,
  ExternalLinkIcon,
  HashIcon,
  IdCardIcon,
  TagIcon,
  Trash2Icon,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

interface Book {
  id: number;
  uuid: string;
  title: string;
  type: string;
  coverUrl: string;
  tags: string[] | null;
  url: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const truncateUuid = (uuid: string): string => {
  if (uuid.length <= 18) {
    return uuid;
  }

  return `${uuid.slice(0, 8)}...${uuid.slice(-8)}`;
};

export default function Show({ book }: { book: { data: Book } }) {
  const currentBook = book.data;

  const handleCopyUuid = (): void => {
    navigator.clipboard.writeText(currentBook.uuid);
    toast.success("UUID berhasil disalin ke clipboard.");
  };

  const handleDelete = () => {
    if (confirm(`Apakah Anda yakin ingin menghapus buku "${currentBook.title}"?`)) {
      router.delete(route("admin.books.destroy", currentBook.id));
    }
  };

  return (
    <>
      <Head title={`Informasi Buku - ${currentBook.title}`} />
      <Toaster position="top-center" />

      <div className="mx-auto space-y-6 p-4">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <IconButton
              variant="ghost"
              color="secondary"
              size="sm"
              onClick={() => router.get(route("admin.books.index"))}
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </IconButton>
            <div>
              <Typography variant="h4" className="font-bold text-slate-800 dark:text-white">
                Informasi Buku
              </Typography>
              <Typography variant="small" className="text-slate-500 dark:text-slate-400">
                Lihat detail lengkap buku digital yang tersedia di aplikasi.
              </Typography>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              color="secondary"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => currentBook.url && window.open(currentBook.url, "_blank")}
              disabled={!currentBook.url}
            >
              <ExternalLinkIcon className="h-4 w-4" />
              {currentBook.url ? "Buka Download Link" : "Download Link Tidak Tersedia"}
            </Button>
            <Button
              size="sm"
              color="secondary"
              className="flex items-center gap-2"
              onClick={() => router.get(route("admin.books.edit", currentBook.id))}
            >
              <EditIcon className="h-4 w-4" />
              Edit Buku
            </Button>
            <Button
              size="sm"
              color="error"
              className="flex items-center gap-2"
              onClick={handleDelete}
            >
              <Trash2Icon className="h-4 w-4" />
              Hapus
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_380px]">
          <Card className="overflow-hidden border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <Typography variant="h5" className="font-bold text-slate-800 dark:text-white">
                {currentBook.title}
              </Typography>
              <Typography className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Informasi metadata dan akses buku digital.
              </Typography>
            </div>

            <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm dark:border-slate-800 dark:bg-slate-800/40">
                <img
                  src={currentBook.coverUrl}
                  alt={currentBook.title}
                  className="aspect-[3/4] w-full object-cover"
                />
              </div>

              <div className="space-y-5">
                <div>
                  <Typography variant="small" className="font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Tipe Buku
                  </Typography>
                  <div className="mt-3">
                    <Chip size="sm" variant="ghost" className="w-max bg-blue-50 capitalize text-blue-600 dark:bg-blue-900/20 dark:text-blue-300">
                      <Chip.Label>{currentBook.type === "penilaian" ? "Penilaian" : "Materi"}</Chip.Label>
                    </Chip>
                  </div>
                </div>

                <div>
                  <Typography variant="small" className="font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Tags
                  </Typography>
                  {currentBook.tags && currentBook.tags.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {currentBook.tags.map((tag, index) => (
                        <Chip
                          key={`${currentBook.id}-${tag}-${index}`}
                          size="sm"
                          variant="ghost"
                          className="bg-primary/10 capitalize text-primary"
                        >
                          <Chip.Label>{tag}</Chip.Label>
                        </Chip>
                      ))}
                    </div>
                  ) : (
                    <Typography className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                      Buku ini belum memiliki tag.
                    </Typography>
                  )}
                </div>

                <div>
                  <Typography variant="small" className="font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Download Link
                  </Typography>
                  {currentBook.url ? (
                    <a
                      href={currentBook.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-primary transition hover:border-primary/40 hover:bg-primary/5 dark:border-slate-700 dark:bg-slate-900"
                    >
                      <ExternalLinkIcon className="h-4 w-4" />
                      Buka tautan buku
                    </a>
                  ) : (
                    <Typography className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                      Belum ada tautan eksternal untuk buku ini.
                    </Typography>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Card.Body className="space-y-4 p-5">
                <Typography variant="small" className="font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Informasi Metadata
                </Typography>

                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                  <div className="rounded-lg bg-slate-200 p-2 dark:bg-slate-700">
                    <IdCardIcon className="h-4 w-4 text-slate-600 dark:text-slate-200" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Typography className="text-xs text-slate-500 dark:text-slate-400">UUID</Typography>
                    <div className="mt-1 flex items-center gap-2">
                      <Typography
                        className="font-medium text-slate-700 dark:text-slate-200 truncate"
                        title={currentBook.uuid}
                      >
                        {currentBook.uuid}
                      </Typography>
                      <IconButton
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyUuid}
                        className="h-8 w-8 rounded-lg text-slate-500 transition hover:bg-slate-200/80 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <CopyIcon className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                  <div className="rounded-lg bg-slate-200 p-2 dark:bg-slate-700">
                    <BookIcon className="h-4 w-4 text-slate-600 dark:text-slate-200" />
                  </div>
                  <div className="min-w-0">
                    <Typography className="text-xs text-slate-500 dark:text-slate-400">Judul</Typography>
                    <Typography className="font-medium text-slate-700 dark:text-slate-200 truncate" title={currentBook.title} >
                      {currentBook.title}
                    </Typography>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                  <div className="rounded-lg bg-slate-200 p-2 dark:bg-slate-700">
                    <HashIcon className="h-4 w-4 text-slate-600 dark:text-slate-200" />
                  </div>
                  <div>
                    <Typography className="text-xs text-slate-500 dark:text-slate-400">Versi</Typography>
                    <Typography className="font-medium text-slate-700 dark:text-slate-200">
                      v{currentBook.version}
                    </Typography>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                  <div className="rounded-lg bg-slate-200 p-2 dark:bg-slate-700">
                    <TagIcon className="h-4 w-4 text-slate-600 dark:text-slate-200" />
                  </div>
                  <div>
                    <Typography className="text-xs text-slate-500 dark:text-slate-400">Jumlah Tag</Typography>
                    <Typography className="font-medium text-slate-700 dark:text-slate-200">
                      {currentBook.tags?.length ?? 0} tag
                    </Typography>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                  <div className="rounded-lg bg-slate-200 p-2 dark:bg-slate-700">
                    <CalendarIcon className="h-4 w-4 text-slate-600 dark:text-slate-200" />
                  </div>
                  <div>
                    <Typography className="text-xs text-slate-500 dark:text-slate-400">Dibuat</Typography>
                    <Typography className="font-medium text-slate-700 dark:text-slate-200">
                      {formatDateTime(currentBook.createdAt)}
                    </Typography>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                  <div className="rounded-lg bg-slate-200 p-2 dark:bg-slate-700">
                    <CalendarIcon className="h-4 w-4 text-slate-600 dark:text-slate-200" />
                  </div>
                  <div>
                    <Typography className="text-xs text-slate-500 dark:text-slate-400">Diperbarui</Typography>
                    <Typography className="font-medium text-slate-700 dark:text-slate-200">
                      {formatDateTime(currentBook.updatedAt)}
                    </Typography>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

Show.layout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>;
};
