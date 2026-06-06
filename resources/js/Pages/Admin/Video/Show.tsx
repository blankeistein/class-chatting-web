import React, { useCallback } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { Button, Card, Chip, IconButton, Input, Menu, Popover, Select, Tabs, Typography } from "@material-tailwind/react";
import AdminLayout from "@/Layouts/AdminLayout";
import axios from "axios";
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
  MoreVerticalIcon,
} from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { getFirebaseFirestore } from "@/lib/firebase";
import { resolveYoutubeId } from "./Create";
import { PageHeader } from "@/Components/PageHeader";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { DateRange, DayPicker } from "@daypicker/react";
import "@daypicker/react/style.css";

interface Video {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  provider: string;
  video_url: string | null;
  thumbnail: string | null;
  tags?: string[];
  metadata?: {
    file_size?: number | null;
    uploaded_by?: string | null;
    uploaded_at?: string | null;
  } | null;
  created_at: string;
  updated_at: string;
  uploader?: {
    name: string;
  } | null;
}

interface Statistics {
  total_views: number;
  unique_viewers: number;
  views_by_date: Array<{
    date: string;
    count: number;
    label?: string;
  }>;
  recent_views: Array<{
    id: number;
    user_name: string;
    ip_address: string;
    viewed_at: string;
  }>;
  views_by_hour: Array<{
    hour: number;
    count: number;
  }>;
  range: string;
  start_date: string;
  end_date: string;
}

type FilterRange = 'week' | 'month' | 'year' | 'custom';

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

const formatFileSize = (bytes: number | null | undefined): string => {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
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
  const [isSyncingHls, setIsSyncingHls] = React.useState(false);
  const [statistics, setStatistics] = React.useState<Statistics | null>(null);
  const [isLoadingStats, setIsLoadingStats] = React.useState(false);
  const [dateRange, setDateRange] = React.useState<string>('month');
  const [customDate, setCustomDate] = React.useState<DateRange | undefined>();
  const [activeTab, setActiveTab] = React.useState('umum');
  const isFirebaseVideo = video.provider === "firebase";
  const youtubeId = resolveYoutubeId(video.video_url ?? "");
  const isYoutubeVideo = !isFirebaseVideo && Boolean(youtubeId);
  const providerLabel = isFirebaseVideo ? "Firebase" : isYoutubeVideo ? "YouTube" : "Local";
  const providerStatusMessage = isYoutubeVideo
    ? "Video ini menggunakan sumber YouTube, jadi tidak memiliki status transcoding Firebase."
    : "Video ini menggunakan provider local, jadi tidak memiliki status transcoding Firebase.";

  const fetchStatistics = React.useCallback(async (range: string, startDate?: Date, endDate?: Date) => {
    setIsLoadingStats(true);
    try {
      const params: Record<string, string> = { range };
      if (range === 'custom' && startDate && endDate) {
        params.start_date = format(startDate.toISOString(), "yyyy-MM-dd");
        params.end_date = format(endDate.toISOString(), "yyyy-MM-dd");
      }
      const url = route('admin.videos.statistics', { video: video.slug, ...params });
      const { data } = await axios.get(url);
      setStatistics(data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }, [video.slug]);

  console.log(dateRange)

  React.useEffect(() => {
    if (activeTab === 'statistik' && !statistics) {
      fetchStatistics(dateRange);
    }
  }, [activeTab, statistics, dateRange, fetchStatistics]);

  React.useEffect(() => {
    if (!isFirebaseVideo) {
      setJob(null);
      setIsJobLoading(false);
      setJobLoadError(null);

      return;
    }

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
  }, [firestore, isFirebaseVideo, video.slug]);

  const handleDelete = () => {
    if (confirm(`Apakah Anda yakin ingin menghapus video \"${video.title}\"?`)) {
      router.delete(route("admin.videos.destroy", video.slug));
    }
  };

  const handleSyncHls = () => {
    setIsSyncingHls(true);
    router.post(route("admin.videos.sync-hls", video.slug), {}, {
      preserveScroll: true,
      onFinish: () => setIsSyncingHls(false),
    });
  };

  const handleDateRangeChange = useCallback((range: string) => {
    setDateRange(range);
    if (range !== 'custom') {
      fetchStatistics(range);
    }
  }, []);

  const handleCustomDateSubmit = () => {
    if (customDate?.from && customDate?.to) {
      fetchStatistics('custom', customDate.from, customDate.to);
    }
  };

  return (
    <>
      <Head title={`Detail Video - ${video.title}`} />

      <div className="mx-auto space-y-6 p-4">
        <PageHeader
          title="Detail Video"
          description="Lihat informasi lengkap dan putar video."
          className="!flex-row !items-center"
          actions={
            <>
              <div className="sm:block md:hidden">
                <Menu placement="bottom-end">
                  <Menu.Trigger as={IconButton}>
                    <MoreVerticalIcon className="w-4 h-4" />
                  </Menu.Trigger>
                  <Menu.Content>
                    {
                      isFirebaseVideo &&
                      <Menu.Item onClick={handleSyncHls} disabled={isSyncingHls}>
                        <RefreshCcwIcon className={`h-4 w-4 mr-2 ${isSyncingHls ? "animate-spin" : ""}`} />
                        {isSyncingHls ? "Memeriksa..." : "Sync HLS"}
                      </Menu.Item>
                    }
                    <Menu.Item as="a" href={video.video_url || "#"} target="_blank">
                      <ExternalLinkIcon className="h-4 w-4 mr-2" />
                      {video.video_url ? (isYoutubeVideo ? "Buka YouTube" : "Buka File") : "Menunggu HLS"}

                    </Menu.Item>
                    <Menu.Item as={Link} href={route("admin.videos.edit", video.slug)}>
                      <EditIcon className="w-4 h-4 mr-2" />
                      Edit
                    </Menu.Item>
                    <Menu.Item className="text-error" onClick={handleDelete}>
                      <Trash2Icon className="w-4 h-4 mr-2" />
                      Hapus
                    </Menu.Item>
                  </Menu.Content>
                </Menu>
              </div>
              <div className="hidden md:flex gap-2 items-center ">
                {isFirebaseVideo && (
                  <Button
                    variant="ghost"
                    color="warning"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={handleSyncHls}
                    disabled={isSyncingHls}
                  >
                    <RefreshCcwIcon className={`h-4 w-4 ${isSyncingHls ? "animate-spin" : ""}`} />
                    {isSyncingHls ? "Memeriksa..." : "Sync HLS"}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  color="secondary"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => video.video_url && window.open(video.video_url, "_blank")}
                  disabled={!video.video_url}
                >
                  <ExternalLinkIcon className="h-4 w-4" />
                  {video.video_url ? (isYoutubeVideo ? "Buka YouTube" : "Buka File") : "Menunggu HLS"}
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
            </>
          }
          backAction={<IconButton
            variant="ghost"
            onClick={() => router.get(route("admin.videos.index"))}
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </IconButton>}
        />

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)}>
          <Tabs.List className="mx-1">
            <Tabs.Trigger value="umum">Umum</Tabs.Trigger>
            <Tabs.Trigger value="status">Status</Tabs.Trigger>
            <Tabs.Trigger value="statistik">Statistik</Tabs.Trigger>
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

                <div className="bg-backrgound p-2 sm:p-4">
                  <div className="overflow-hidden rounded-xl border border-slate-800 bg-backrgound/10 shadow-inner">
                    {isYoutubeVideo && youtubeId ? (
                      <div className="flex aspect-video items-center justify-center bg-backrgound">
                        <iframe
                          src={`https://www.youtube.com/embed/${youtubeId}`}
                          title="YouTube Video Player"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="h-full w-full"
                        />
                      </div>
                    ) : video.video_url ? (
                      <video
                        key={video.video_url}
                        controls
                        preload="metadata"
                        poster={video.thumbnail ?? undefined}
                        className="aspect-video w-full bg-backrgound/10"
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
                        <ServerIcon className="h-4 w-4 text-slate-600 dark:text-slate-200" />
                      </div>
                      <div>
                        <Typography className="text-xs text-slate-500 dark:text-slate-400">Provider</Typography>
                        <Typography className="font-medium text-slate-700 dark:text-slate-200">
                          {providerLabel}
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
            {isFirebaseVideo && video.metadata && (
              <Card className="mb-6 border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <Card.Body className="p-5">
                  <Typography variant="small" className="mb-4 font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Detail Upload
                  </Typography>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                      <Typography className="text-xs text-slate-500 dark:text-slate-400">Ukuran File</Typography>
                      <Typography className="mt-1 font-medium text-slate-700 dark:text-slate-200">
                        {formatFileSize(video.metadata.file_size)}
                      </Typography>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                      <Typography className="text-xs text-slate-500 dark:text-slate-400">Diupload Oleh</Typography>
                      <Typography className="mt-1 font-medium text-slate-700 dark:text-slate-200">
                        {video.metadata.uploaded_by || "-"}
                      </Typography>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                      <Typography className="text-xs text-slate-500 dark:text-slate-400">Waktu Upload</Typography>
                      <Typography className="mt-1 font-medium text-slate-700 dark:text-slate-200">
                        {formatDateTime(video.metadata.uploaded_at ?? null)}
                      </Typography>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            )}

            {!isFirebaseVideo ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                {providerStatusMessage}
              </div>
            ) : isJobLoading ? (
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
          <Tabs.Panel value="statistik">
            <div className="space-y-6">
              {/* Date Range Selector */}
              <Card className="border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <Card.Body className="p-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <Typography variant="small" className="font-bold text-slate-800 dark:text-white">
                          Periode Data
                        </Typography>
                        <Typography className="text-xs text-slate-500 dark:text-slate-400">
                          {statistics && `${new Date(statistics.start_date).toLocaleDateString('id-ID')} - ${new Date(statistics.end_date).toLocaleDateString('id-ID')}`}
                        </Typography>
                      </div>
                      <div className="w-full sm:w-auto">
                        <Select
                          value={dateRange}
                          onValueChange={(value) => handleDateRangeChange(value)}
                          disabled={isLoadingStats}
                        >
                          <Select.Trigger className="w-full sm:w-48" placeholder="Pilih periode" />
                          <Select.List>
                            <Select.Option value="week">Minggu Ini</Select.Option>
                            <Select.Option value="month">Bulan Ini</Select.Option>
                            <Select.Option value="year">Tahun Ini</Select.Option>
                            <Select.Option value="custom">Custom Range</Select.Option>
                          </Select.List>
                        </Select>
                      </div>
                    </div>

                    {dateRange === 'custom' && (
                      <div className="flex flex-col gap-3">
                        <div className="w-full">
                          <Typography className="mb-2 text-sm text-slate-600 dark:text-slate-400">
                            Range Tanggal
                          </Typography>
                          <Popover placement="bottom">
                            <Popover.Trigger className="w-full">
                              <Input className="w-full" readOnly onChange={() => null} placeholder="Pilih Tanggal" value={customDate ? ((customDate.from && customDate.to) ? `${format(customDate.from, "dd/MMM/yyyy")} - ${format(customDate.to, "dd/MMM/yyyy")}` : "") : ""}>
                                <Input.Icon>
                                  <CalendarIcon className="h-4 w-4" />
                                </Input.Icon>
                              </Input>
                            </Popover.Trigger>
                            <Popover.Content>
                              <Popover.Arrow />
                              <DayPicker
                                animate
                                mode="range"
                                selected={customDate}
                                onSelect={setCustomDate}
                                className="p-0"
                                classNames={{
                                  selected: "rounded-xl bg-primary dark:bg-white text-white dark:text-background font-bold",
                                  today: "",
                                  range_start: "!bg-warning [&_button]:rounded-xl [&_button]:bg-warning text-white dark:text-background font-bold",
                                  range_end: "!bg-warning [&_button]:rounded-xl [&_button]:bg-warning text-white dark:text-background font-bold",
                                }}
                                disabled={isLoadingStats}
                              />
                            </Popover.Content>
                          </Popover>
                        </div>
                        <Button
                          size="sm"
                          color="primary"
                          onClick={handleCustomDateSubmit}
                          disabled={isLoadingStats || !customDate}
                          className="w-full sm:w-auto"
                        >
                          Terapkan
                        </Button>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>

              <div>

              </div>


              {isLoadingStats ? (
                <div className="space-y-4">
                  <div className="h-32 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
                  <div className="h-96 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
                </div>
              ) : !statistics ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                  Klik tab Statistik untuk memuat data
                </div>
              ) : (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Card className="border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <Card.Body className="p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <Typography className="text-sm text-slate-500 dark:text-slate-400">
                              Jumlah Tayangan Total
                            </Typography>
                            <Typography variant="h3" className="mt-2 font-bold text-slate-800 dark:text-white">
                              {statistics.total_views.toLocaleString()}
                            </Typography>
                          </div>
                          <div className="rounded-lg bg-primary/10 p-3">
                            <PlayCircleIcon className="h-8 w-8 text-primary" />
                          </div>
                        </div>
                      </Card.Body>
                    </Card>

                    <Card className="border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <Card.Body className="p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <Typography className="text-sm text-slate-500 dark:text-slate-400">
                              Jumlah Penonton
                            </Typography>
                            <Typography variant="h3" className="mt-2 font-bold text-slate-800 dark:text-white">
                              {statistics.unique_viewers.toLocaleString()}
                            </Typography>
                          </div>
                          <div className="rounded-lg bg-success/10 p-3">
                            <UserIcon className="h-8 w-8 text-success" />
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>

                  {/* Views by Date Chart */}
                  <Card className="border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="border-b border-slate-100 p-4 dark:border-slate-800">
                      <Typography variant="h6" className="font-bold text-slate-800 dark:text-white">
                        Trend Tayangan ({dateRange === 'week' ? 'Minggu Ini' : dateRange === 'month' ? 'Bulan Ini' : 'Tahun Ini'})
                      </Typography>
                      <Typography className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Jumlah tayangan {dateRange === 'year' ? 'bulanan' : 'harian'} untuk periode yang dipilih
                      </Typography>
                    </div>
                    <Card.Body className="p-5">
                      {statistics.views_by_date.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={statistics.views_by_date.map(item => ({
                            date: item.label || new Date(item.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
                            views: item.count
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                            <XAxis
                              dataKey="date"
                              className="text-xs text-slate-600 dark:text-slate-400"
                              angle={-45}
                              textAnchor="end"
                              height={80}
                            />
                            <YAxis className="text-xs text-slate-600 dark:text-slate-400" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'rgb(15 23 42)',
                                border: '1px solid rgb(51 65 85)',
                                borderRadius: '0.5rem'
                              }}
                              labelStyle={{ color: 'rgb(226 232 240)' }}
                              itemStyle={{ color: 'rgb(147 197 253)' }}
                            />
                            <Line
                              type="monotone"
                              dataKey="views"
                              stroke="rgb(59 130 246)"
                              strokeWidth={2}
                              dot={{ fill: 'rgb(59 130 246)', r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                          No view data available for the last 30 days
                        </div>
                      )}
                    </Card.Body>
                  </Card>

                  {/* Views by Hour */}
                  <Card className="border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="border-b border-slate-100 p-4 dark:border-slate-800">
                      <Typography variant="h6" className="font-bold text-slate-800 dark:text-white">
                        Jumlah Tayangan per Jam
                      </Typography>
                      <Typography className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Distribusi jumlah penonton per jam
                      </Typography>
                    </div>
                    <Card.Body className="p-5">
                      {statistics.views_by_hour.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={Array.from({ length: 24 }, (_, i) => {
                            const hourData = statistics.views_by_hour.find(h => h.hour === i);
                            return {
                              hour: `${i}:00`,
                              views: hourData?.count || 0
                            };
                          })}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                            <XAxis
                              dataKey="hour"
                              className="text-xs text-slate-600 dark:text-slate-400"
                            />
                            <YAxis className="text-xs text-slate-600 dark:text-slate-400" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'rgb(15 23 42)',
                                border: '1px solid rgb(51 65 85)',
                                borderRadius: '0.5rem'
                              }}
                              labelStyle={{ color: 'rgb(226 232 240)' }}
                              itemStyle={{ color: 'rgb(147 197 253)' }}
                            />
                            <Bar
                              dataKey="views"
                              fill="rgb(59 130 246)"
                              radius={[8, 8, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                          No view data available for the last 24 hours
                        </div>
                      )}
                    </Card.Body>
                  </Card>

                  {/* Recent Views */}
                  <Card className="border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="border-b border-slate-100 p-4 dark:border-slate-800">
                      <Typography variant="h6" className="font-bold text-slate-800 dark:text-white">
                        Penonton Terakhir
                      </Typography>
                      <Typography className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        10 penonton video terakhir
                      </Typography>
                    </div>
                    <Card.Body className="p-0">
                      {statistics.recent_views.length > 0 ? (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                          {statistics.recent_views.map((view) => (
                            <div key={view.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
                                  <UserIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                </div>
                                <div>
                                  <Typography className="font-medium text-slate-700 dark:text-slate-200">
                                    {view.user_name}
                                  </Typography>
                                  <Typography className="text-xs text-slate-500 dark:text-slate-400">
                                    {view.ip_address}
                                  </Typography>
                                </div>
                              </div>
                              <Typography className="text-sm text-slate-500 dark:text-slate-400">
                                {formatDateTime(view.viewed_at)}
                              </Typography>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                          No recent views available
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </>
              )}
            </div>
          </Tabs.Panel>
        </Tabs>

      </div>
    </>
  );
}

Show.layout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>;
};
