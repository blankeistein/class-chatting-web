import React, { useEffect, useState } from "react";
import { Head, router } from "@inertiajs/react";
import { Button, Card, Chip, Dialog, IconButton, Input, Select, Typography } from "@material-tailwind/react";
import AdminLayout from "@/Layouts/AdminLayout";
import {
  ArrowLeftIcon,
  CircleDashedIcon,
  ExternalLinkIcon,
  CheckCircle2Icon,
  Clock3Icon,
  OctagonAlertIcon,
  RefreshCcwIcon,
  ServerIcon,
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseFirestore } from "@/lib/firebase";

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

const inferVideoTitle = (job: HlsJob): string => {
  if (job.video_slug) {
    return job.video_slug;
  }

  return `Job ${job.job_id}`;
};

export default function Jobs() {
  const [jobs, setJobs] = useState<HlsJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<HlsJob | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  const statusOptions = [
    { label: "Semua Status", value: "all" },
    { label: "Queued", value: "queued" },
    { label: "Processing", value: "processing" },
    { label: "Completed", value: "completed" },
    { label: "Failed", value: "failed" },
  ];

  const loadJobs = async (): Promise<void> => {
    const firestore = getFirebaseFirestore();

    if (!firestore) {
      setLoadError("Konfigurasi Firebase web belum lengkap, jadi data Firestore belum bisa diambil dari client.");
      setJobs([]);
      setIsLoading(false);

      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const snapshot = await getDocs(query(collection(firestore, "hls_jobs")));
      const nextJobs = snapshot.docs
        .map((document) => normalizeJob(document.id, document.data() as FirestoreJobDocument))
        .sort((left, right) => (right.created_at ?? "").localeCompare(left.created_at ?? ""));

      setJobs(nextJobs);
      setCurrentPage(1);
    } catch (error) {
      console.error(error);
      setLoadError("Gagal mengambil daftar tugas dari Firestore. Pastikan user sudah login Firebase dan Firestore rules mengizinkan akses.");
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadJobs();
  }, []);

  useEffect(() => {
    const auth = getFirebaseAuth();

    if (!auth) {
      console.log("Firebase auth is not initialized.");

      return;
    }

    return onAuthStateChanged(auth, (user) => {
      console.log("Firebase logged in user:", user);
    });
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.job_id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / perPage));
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <>
      <Head title="Tugas Converter HLS" />

      <div className="space-y-6 p-4">
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
                Tugas Video Converter
              </Typography>
              <Typography className="text-slate-500 dark:text-slate-400">
                Pantau proses konversi video ke HLS.
              </Typography>
            </div>
          </div>

          <Button
            color="secondary"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => void loadJobs()}
            disabled={isLoading}
          >
            <RefreshCcwIcon className="h-4 w-4" />
            {isLoading ? "Memuat..." : "Muat Ulang"}
          </Button>
        </div>

        <Card className="border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Card.Body className="p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="w-full md:max-w-sm">
                <Input
                  placeholder="Cari ID job..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <div className="w-full md:max-w-xs">
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? "all")}>
                  <Select.Trigger>
                    {() => statusOptions.find((option) => option.value === statusFilter)?.label ?? "Pilih status"}
                  </Select.Trigger>
                  <Select.List>
                    {statusOptions.map((option) => (
                      <Select.Option key={option.value} value={option.value}>
                        {option.label}
                      </Select.Option>
                    ))}
                  </Select.List>
                </Select>
              </div>
            </div>
          </Card.Body>
        </Card>

        {loadError && (
          <Card className="border border-red-200 bg-red-50 shadow-sm dark:border-red-900/60 dark:bg-red-950/30">
            <Card.Body className="p-4">
              <Typography className="text-sm text-red-700 dark:text-red-300">
                {loadError}
              </Typography>
            </Card.Body>
          </Card>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <Card.Body className="space-y-4 p-5">
                  <div className="h-5 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-24 w-full animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
                </Card.Body>
              </Card>
            ))}
          </div>
        ) : filteredJobs.length > 0 ? (
          <Card className="overflow-hidden border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto text-left">
                <thead>
                  <tr>
                    {["ID", "Status", "Tanggal"].map((head) => (
                      <th
                        key={head}
                        className="border-y border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/50"
                      >
                        <Typography
                          variant="small"
                          className="font-bold leading-none text-slate-500 opacity-70 dark:text-slate-300"
                        >
                          {head}
                        </Typography>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedJobs.map((job) => {
                    const statusMeta = getStatusMeta(job.status);
                    const StatusIcon = statusMeta.icon;

                    return (
                      <tr
                        key={job.id}
                        className="cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                        onClick={() => setSelectedJob(job)}
                      >
                        <td className="p-4">
                          <div>
                            <Typography className="font-medium text-slate-800 dark:text-white">
                              {job.job_id}
                            </Typography>
                            <Typography className="text-xs text-slate-500 dark:text-slate-400">
                              {inferVideoTitle(job)}
                            </Typography>
                          </div>
                        </td>
                        <td className="p-4">
                          <Chip color={statusMeta.color} variant="ghost" size="sm">
                            <Chip.Label className="flex items-center gap-1">
                              <StatusIcon className="h-3.5 w-3.5" />
                              {formatStatus(job.status)}
                            </Chip.Label>
                          </Chip>
                        </td>
                        <td className="p-4">
                          <Typography className="text-sm text-slate-600 dark:text-slate-300">
                            {formatDateTime(job.created_at)}
                          </Typography>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-12 dark:border-slate-700 dark:bg-slate-900">
            <ServerIcon className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
            <Typography className="text-slate-500 dark:text-slate-400">
              {search || statusFilter !== "all"
                ? "Tidak ada tugas yang cocok dengan filter saat ini."
                : "Belum ada tugas converter HLS di Firestore."}
            </Typography>
          </div>
        )}

        {!isLoading && filteredJobs.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <Typography className="text-sm text-slate-500 dark:text-slate-400">
              Menampilkan {paginatedJobs.length} dari {filteredJobs.length} tugas
            </Typography>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                color="secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                Sebelumnya
              </Button>
              <Typography className="text-sm text-slate-600 dark:text-slate-300">
                Halaman {currentPage} / {totalPages}
              </Typography>
              <Button
                size="sm"
                variant="ghost"
                color="secondary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={selectedJob !== null} onOpenChange={() => setSelectedJob(null)} size="lg">
        <Dialog.Overlay>
          <Dialog.Content className="dark:border-slate-800">
            {selectedJob && (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Typography type="h6">
                      Detail Tugas
                    </Typography>
                    <Typography className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {selectedJob.job_id}
                    </Typography>
                  </div>
                  <Chip color={getStatusMeta(selectedJob.status).color} variant="ghost" size="sm">
                    <Chip.Label>{formatStatus(selectedJob.status)}</Chip.Label>
                  </Chip>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                    <Typography variant="small" className="font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Informasi Dasar
                    </Typography>
                    <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                      <div>ID: {selectedJob.job_id}</div>
                      <div>Slug Video: {selectedJob.video_slug ?? "-"}</div>
                      <div>Dibuat: {formatDateTime(selectedJob.created_at)}</div>
                      <div>Mulai: {formatDateTime(selectedJob.started_at)}</div>
                      <div>Selesai: {formatDateTime(selectedJob.completed_at)}</div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                    <Typography variant="small" className="font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Lokasi Output
                    </Typography>
                    <div className="mt-3 space-y-2 break-all text-sm text-slate-600 dark:text-slate-300">
                      <div className="flex items-start gap-2">
                        <ServerIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span>{selectedJob.output_bucket ?? "-"}</span>
                      </div>
                      <div>{selectedJob.output_prefix ?? "-"}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                  <Typography variant="small" className="font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Sumber Video
                  </Typography>
                  <Typography className="mt-3 break-all text-sm text-slate-600 dark:text-slate-300">
                    {selectedJob.source_url ?? "-"}
                  </Typography>
                </div>

                {selectedJob.result?.resolutions && selectedJob.result.resolutions.length > 0 && (
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                    <Typography variant="small" className="font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Hasil Resolusi
                    </Typography>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedJob.result.resolutions.map((resolution, index) => (
                        <Chip key={`${selectedJob.id}-${index}`} size="sm" variant="ghost" color="secondary">
                          <Chip.Label>
                            {resolution.label ?? "Tanpa Label"}{resolution.resolution ? ` - ${resolution.resolution}` : ""}
                          </Chip.Label>
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}

                {selectedJob.error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                    <Typography variant="small" className="font-bold uppercase tracking-wide">
                      Error
                    </Typography>
                    <Typography className="mt-2 break-all text-sm text-current">
                      {selectedJob.error}
                    </Typography>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-end gap-2">
                  {selectedJob.video_slug && (
                    <Button
                      variant="ghost"
                      color="secondary"
                      onClick={() => router.get(route("admin.videos.show", selectedJob.video_slug))}
                    >
                      Buka Video
                    </Button>
                  )}
                  {selectedJob.result?.masterPlaylistUrl && (
                    <Button
                      variant="outline"
                      color="secondary"
                      className="flex items-center gap-2"
                      onClick={() => window.open(selectedJob.result?.masterPlaylistUrl ?? "", "_blank")}
                    >
                      <ExternalLinkIcon className="h-4 w-4" />
                      Playlist Master
                    </Button>
                  )}
                  <Button color="secondary" onClick={() => setSelectedJob(null)}>
                    Tutup
                  </Button>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog>
    </>
  );
}

Jobs.layout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>;
};
