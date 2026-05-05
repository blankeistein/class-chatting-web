import React from "react";
import { Head, router } from "@inertiajs/react";
import { Button, Card, Chip, IconButton, Tabs, Typography } from "@material-tailwind/react";
import AdminLayout from "@/Layouts/AdminLayout";
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  EditIcon,
  ExternalLinkIcon,
  OctagonAlertIcon,
  PlayCircleIcon,
  RefreshCcwIcon,
  ServerIcon,
  Trash2Icon,
  UserIcon,
  VideoIcon,
  Clock3Icon,
} from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { getFirebaseFirestore } from "@/lib/firebase";

interface Video {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  video_url: string | null;
  thumbnail: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string;
  uploader?: {
    name: string;
  } | null;
}

type HlsJob = {
  id: string;
  job_id: string;
  slug: string | null;
  video_slug: string | null;
  status: string;
  error: string | null;
  source_url: string | null;
  output_bucket: string | null;
  output_prefix: string | null;
  created_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  result: {
    masterPlaylistUrl?: string | null;
    resolutions?: Array<{
      label?: string | null;
      playlistUrl?: string | null;
      resolution?: string | null;
    }>;
  } | null;
};

type FirestoreJobDocument = {
  jobId?: string;
  slug?: string | null;
  status?: string;
  error?: string | null;
  sourceUrl?: string | null;
  outputBucket?: string | null;
  outputPrefix?: string | null;
  createdAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  result?: HlsJob["result"];
};

const formatDateTime = (date: string | null): string => {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatStatus = (status: string): string => {
  switch (status) {
    case "completed":
      return "Selesai";
    case "failed":
      return "Gagal";
    case "processing":
      return "Diproses";
    case "pending":
      return "Menunggu";
    default:
      return status;
  }
};

const getStatusMeta = (status: string): {
  color: "success" | "error" | "warning" | "secondary";
  icon: React.ElementType;
} => {
  switch (status) {
    case "completed":
      return { color: "success", icon: CheckCircle2Icon };
    case "failed":
      return { color: "error", icon: OctagonAlertIcon };
    case "processing":
      return { color: "warning", icon: RefreshCcwIcon };
    case "pending":
      return { color: "secondary", icon: Clock3Icon };
    default:
      return { color: "secondary", icon: CircleDashedIcon };
  }
};

const resolveVideoSlug = (job: FirestoreJobDocument): string | null => {
  if (job.outputPrefix) {
    const segments = job.outputPrefix.split("/").filter(Boolean);

    if (segments.length >= 2 && segments[0] === "hls") {
      return segments[1];
    }
  }

  if (job.slug && job.slug !== job.jobId) {
    return job.slug;
  }

  return null;
};

const normalizeJob = (id: string, job: FirestoreJobDocument): HlsJob => {
  const videoSlug = resolveVideoSlug(job);

  return {
    id,
    job_id: job.jobId ?? id,
    slug: job.slug ?? null,
    video_slug: videoSlug,
    status: job.status ?? "unknown",
    error: job.error ?? null,
    source_url: job.sourceUrl ?? null,
    output_bucket: job.outputBucket ?? null,
    output_prefix: job.outputPrefix ?? null,
    created_at: job.createdAt ?? null,
    started_at: job.startedAt ?? null,
    completed_at: job.completedAt ?? null,
    result: job.result ?? null,
  };
};

export default function Show({ video }: { video: Video }) {
  const firestore = React.useMemo(() => getFirebaseFirestore(), []);
  const [job, setJob] = React.useState<HlsJob | null>(null);
  const [isJobLoading, setIsJobLoading] = React.useState(true);
  const [jobLoadError, setJobLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!firestore) {
      setJob(null);
      setIsJobLoading(false);
      setJobLoadError("Konfigurasi Firebase web belum lengkap, jadi status job belum bisa diambil dari client.");

      return;
    }

    setIsJobLoading(true);
    setJobLoadError(null);

    const jobReference = doc(firestore, "hls_jobs", video.slug);
    const unsubscribe = onSnapshot(jobReference, (snapshot) => {
      if (!snapshot.exists()) {
        setJob(null);
        setIsJobLoading(false);

        return;
      }

      setJob(normalizeJob(snapshot.id, snapshot.data() as FirestoreJobDocument));
      setIsJobLoading(false);
      setJobLoadError(null);
    }, (error) => {
      console.error(error);
      setJob(null);
      setIsJobLoading(false);
      setJobLoadError("Gagal mengambil status job dari Firestore. Pastikan user sudah login Firebase dan Firestore rules mengizinkan akses.");
    });

    return () => unsubscribe();
  }, [firestore, video.slug]);

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
              onClick={() => video.video_url && window.open(video.video_url, "_blank")}
              disabled={!video.video_url}
            >
              <ExternalLinkIcon className="h-4 w-4" />
              {video.video_url ? "Buka File" : "Menunggu HLS"}
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

        <Tabs defaultValue="umum">
          <Tabs.List className="mx-1">
            <Tabs.Trigger value="umum">Umum</Tabs.Trigger>
            <Tabs.Trigger value="status">Status</Tabs.Trigger>
            <Tabs.TriggerIndicator />
          </Tabs.List>
          <Tabs.Panel value="umum">
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
                    {video.video_url ? (
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
                    ) : (
                      <div className="flex aspect-video items-center justify-center px-6 text-center text-sm text-slate-300">
                        URL HLS belum tersedia. Video sedang menunggu proses transcoding.
                      </div>
                    )}
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
          </Tabs.Panel>
          <Tabs.Panel value="status">
            {isJobLoading ? (
              <Card className="border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <Card.Body className="space-y-4 p-5">
                  <div className="h-5 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-24 w-full animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
                </Card.Body>
              </Card>
            ) : jobLoadError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                {jobLoadError}
              </div>
            ) : job ? (
              <div className="space-y-6">
                <Card className="border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <Card.Body className="space-y-5 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Typography variant="h6" className="font-bold text-slate-800 dark:text-white">
                          Status Transcoding
                        </Typography>
                        <Typography className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {job.job_id}
                        </Typography>
                      </div>
                      <Chip color={getStatusMeta(job.status).color} variant="ghost" size="sm">
                        <Chip.Label className="flex items-center gap-1">
                          {React.createElement(getStatusMeta(job.status).icon, { className: "h-3.5 w-3.5" })}
                          {formatStatus(job.status)}
                        </Chip.Label>
                      </Chip>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                        <Typography variant="small" className="font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Informasi Dasar
                        </Typography>
                        <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                          <div>ID: {job.job_id}</div>
                          <div>Slug Video: {job.video_slug ?? video.slug}</div>
                          <div>Dibuat: {formatDateTime(job.created_at)}</div>
                          <div>Mulai: {formatDateTime(job.started_at)}</div>
                          <div>Selesai: {formatDateTime(job.completed_at)}</div>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                        <Typography variant="small" className="font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Lokasi Output
                        </Typography>
                        <div className="mt-3 space-y-2 break-all text-sm text-slate-600 dark:text-slate-300">
                          <div className="flex items-start gap-2">
                            <ServerIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                            <span>{job.output_bucket ?? "-"}</span>
                          </div>
                          <div>{job.output_prefix ?? "-"}</div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                      <Typography variant="small" className="font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Sumber Video
                      </Typography>
                      <Typography className="mt-3 break-all text-sm text-slate-600 dark:text-slate-300">
                        {job.source_url ?? "-"}
                      </Typography>
                    </div>

                    {job.result?.resolutions && job.result.resolutions.length > 0 && (
                      <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                        <Typography variant="small" className="font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Hasil Resolusi
                        </Typography>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {job.result.resolutions.map((resolution, index) => (
                            <Chip key={`${job.id}-${index}`} size="sm" variant="ghost" color="secondary">
                              <Chip.Label>
                                {resolution.label ?? "Tanpa Label"}{resolution.resolution ? ` - ${resolution.resolution}` : ""}
                              </Chip.Label>
                            </Chip>
                          ))}
                        </div>
                      </div>
                    )}

                    {job.error && (
                      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                        <Typography variant="small" className="font-bold uppercase tracking-wide">
                          Error
                        </Typography>
                        <Typography className="mt-2 break-all text-sm text-current">
                          {job.error}
                        </Typography>
                      </div>
                    )}

                    {job.result?.masterPlaylistUrl && (
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          color="secondary"
                          className="flex items-center gap-2"
                          onClick={() => window.open(job.result?.masterPlaylistUrl ?? "", "_blank")}
                        >
                          <ExternalLinkIcon className="h-4 w-4" />
                          Playlist Master
                        </Button>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                Belum ada status job Firestore untuk video ini.
              </div>
            )}
          </Tabs.Panel>
        </Tabs>

      </div>
    </>
  );
}

Show.layout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>;
};
