import React from "react";
import { Head, router } from "@inertiajs/react";
import { Button, Card, Chip, IconButton, Typography } from "@material-tailwind/react";
import AdminLayout from "@/Layouts/AdminLayout";
import {
  ArrowLeftIcon,
  CalendarIcon,
  EditIcon,
  ExternalLinkIcon,
  PlayCircleIcon,
  TagIcon,
  Trash2Icon,
  UserIcon,
  VideoIcon,
} from "lucide-react";

interface Video {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string;
  uploader?: {
    name: string;
  } | null;
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

export default function Show({ video }: { video: Video }) {
  const handleDelete = () => {
    if (confirm(`Apakah Anda yakin ingin menghapus video \"${video.title}\"?`)) {
      router.delete(route("admin.videos.destroy", video.slug));
    }
  };

  return (
    <>
      <Head title={`Detail Video - ${video.title}`} />

      <div className="mx-auto space-y-6 p-4">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <IconButton
              variant="ghost"
              color="secondary"
              size="sm"
              onClick={() => router.get(route("admin.videos.index"))}
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </IconButton>
            <div>
              <Typography variant="h4" className="font-bold text-slate-800 dark:text-white">
                Detail Video
              </Typography>
              <Typography variant="small" className="text-slate-500 dark:text-slate-400">
                Lihat informasi lengkap dan putar video langsung dari halaman ini.
              </Typography>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              color="secondary"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => window.open(video.video_url, "_blank")}
            >
              <ExternalLinkIcon className="h-4 w-4" />
              Buka File
            </Button>
            <Button
              size="sm"
              color="secondary"
              className="flex items-center gap-2"
              onClick={() => router.get(route("admin.videos.edit", video.slug))}
            >
              <EditIcon className="h-4 w-4" />
              Edit Video
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
                {video.title}
              </Typography>
              <Typography className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Viewer video pembelajaran
              </Typography>
            </div>

            <div className="bg-black p-2 sm:p-4">
              <div className="overflow-hidden rounded-xl border border-slate-800 bg-black shadow-inner">
                <video
                  key={video.video_url}
                  controls
                  preload="metadata"
                  poster={video.thumbnail ?? undefined}
                  className="aspect-video w-full bg-black"
                >
                  <source src={video.video_url} />
                  Browser Anda tidak mendukung pemutaran video HTML5.
                </video>
              </div>
            </div>

            <Card.Body className="space-y-5 p-5">
              {video.tags && video.tags.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {video.tags.map((tag) => (
                      <Chip
                        key={tag}
                        size="sm"
                        variant="ghost"
                        className="bg-primary/10 capitalize text-primary"
                      >
                        <Chip.Label>{tag}</Chip.Label>
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <Typography variant="small" className="font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Deskripsi
                </Typography>
                <Typography className="leading-7 text-slate-700 dark:text-slate-300">
                  {video.description || "Belum ada deskripsi untuk video ini."}
                </Typography>
              </div>              
            </Card.Body>
          </Card>

          <div className="space-y-6">
            <Card className="border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Card.Body className="space-y-4 p-5">
                <Typography variant="small" className="font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Informasi Video
                </Typography>

                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                  <div className="rounded-lg bg-slate-200 p-2 dark:bg-slate-700">
                    <VideoIcon className="h-4 w-4 text-slate-600 dark:text-slate-200" />
                  </div>
                  <div className="min-w-0">
                    <Typography className="text-xs text-slate-500 dark:text-slate-400">Slug</Typography>
                    <Typography className="truncate font-medium text-slate-700 dark:text-slate-200">
                      {video.slug}
                    </Typography>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                  <div className="rounded-lg bg-slate-200 p-2 dark:bg-slate-700">
                    <UserIcon className="h-4 w-4 text-slate-600 dark:text-slate-200" />
                  </div>
                  <div>
                    <Typography className="text-xs text-slate-500 dark:text-slate-400">Uploader</Typography>
                    <Typography className="font-medium text-slate-700 dark:text-slate-200">
                      {video.uploader?.name || "Tidak diketahui"}
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
                      {formatDateTime(video.created_at)}
                    </Typography>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                  <div className="rounded-lg bg-slate-200 p-2 dark:bg-slate-700">
                    <PlayCircleIcon className="h-4 w-4 text-slate-600 dark:text-slate-200" />
                  </div>
                  <div>
                    <Typography className="text-xs text-slate-500 dark:text-slate-400">Diperbarui</Typography>
                    <Typography className="font-medium text-slate-700 dark:text-slate-200">
                      {formatDateTime(video.updated_at)}
                    </Typography>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {video.thumbnail && (
              <Card className="overflow-hidden border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-100 p-4 dark:border-slate-800">
                  <Typography variant="small" className="font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Thumbnail
                  </Typography>
                </div>
                <div className="p-4">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="aspect-video w-full rounded-xl border border-slate-200 object-cover dark:border-slate-800"
                  />
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

Show.layout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>;
};
