import React, { useRef, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Dialog,
  IconButton,
  Input,
  Progress,
  Textarea,
  Typography,
} from "@material-tailwind/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, useForm } from "@inertiajs/react";
import {
  ArrowLeftIcon,
  CameraIcon,
  ImageIcon,
  SaveIcon,
  Tag,
  Trash2Icon,
  UploadCloudIcon,
  VideoIcon,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

interface Video {
  id: number;
  slug: string;
  title: string;
  description: string;
  video_url: string | null;
  thumbnail: string | null;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

const formatDate = (value?: string) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export default function Edit({ video }: { video: Video }) {
  const [isVideoDragging, setIsVideoDragging] = useState(false);
  const [isThumbDragging, setIsThumbDragging] = useState(false);
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [thumbPreviewUrl, setThumbPreviewUrl] = useState<string | null>(video.thumbnail);
  const [currentTag, setCurrentTag] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { data, setData, post, processing, errors, progress } = useForm({
    title: video.title,
    description: video.description,
    tags: video.tags || [],
    video: null as File | null,
    thumbnail: null as File | null,
    _method: "put",
  });
  const deleteForm = useForm({});

  React.useEffect(() => {
    if (!data.video) {
      setVideoPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(data.video);
    setVideoPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [data.video]);

  React.useEffect(() => {
    if (data.thumbnail) {
      const url = URL.createObjectURL(data.thumbnail);
      setThumbPreviewUrl(url);

      return () => URL.revokeObjectURL(url);
    }

    setThumbPreviewUrl(video.thumbnail);
  }, [data.thumbnail, video.thumbnail]);

  const activeVideoUrl = videoPreviewUrl || video.video_url;
  const activeVideoName = data.video?.name || "Video saat ini";
  const activeVideoSize = data.video ? `${(data.video.size / (1024 * 1024)).toFixed(2)} MB` : "File tersimpan di server";

  const handleVideoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsVideoDragging(true);
  };

  const handleVideoDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsVideoDragging(false);
  };

  const handleVideoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsVideoDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setData("video", e.dataTransfer.files[0]);
    }
  };

  const handleThumbDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsThumbDragging(true);
  };

  const handleThumbDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsThumbDragging(false);
  };

  const handleThumbDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsThumbDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setData("thumbnail", e.dataTransfer.files[0]);
    }
  };

  const captureThumbnail = () => {
    if (!videoRef.current) {
      return;
    }

    const previewVideo = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = previewVideo.videoWidth;
    canvas.height = previewVideo.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.drawImage(previewVideo, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error("Browser gagal membuat thumbnail WebP.");
          return;
        }

        const file = new File([blob], "captured-thumbnail.webp", { type: "image/webp" });
        setData("thumbnail", file);
        toast.success("Thumbnail WebP berhasil diambil dari video.");
        setIsCaptureModalOpen(false);
      },
      "image/webp",
      0.7,
    );
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newTag = currentTag.trim();

      if (newTag && !data.tags.includes(newTag)) {
        setData("tags", [...data.tags, newTag]);
      }

      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setData(
      "tags",
      data.tags.filter((tag) => tag !== tagToRemove),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    post(route("admin.videos.update", video.slug), {
      onSuccess: () => {
        toast.success("Video berhasil diperbarui.");
      },
      onError: () => {
        toast.error("Gagal memperbarui video.");
      },
    });
  };

  const handleDelete = () => {
    deleteForm.delete(route("admin.videos.destroy", video.slug), {
      onSuccess: () => {
        toast.success("Video berhasil dihapus.");
        setIsDeleteModalOpen(false);
      },
      onError: () => {
        toast.error("Gagal menghapus video.");
      },
    });
  };

  return (
    <>
      <Head title="Edit Video" />
      <Toaster position="top-center" />

      <div className="space-y-6 p-4">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <IconButton
              variant="ghost"
              color="secondary"
              onClick={() => router.get(route("admin.videos.show", video.slug))}
              className="rounded-full"
            >
              <ArrowLeftIcon className="h-5 w-5 dark:text-white" />
            </IconButton>
            <div>
              <Typography variant="h4" className="font-bold text-slate-800 dark:text-white">
                Edit Video
              </Typography>
              <Typography className="text-slate-500 dark:text-slate-400">
                Perbarui metadata, thumbnail, dan ganti file video bila diperlukan.
              </Typography>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              color="secondary"
              onClick={() => router.get(route("admin.videos.show", video.slug))}
            >
              Kembali
            </Button>
            <Button
              variant="outline"
              color="error"
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Trash2Icon className="h-4 w-4" />
              Hapus
            </Button>
            <Button
              color="primary"
              disabled={processing}
              onClick={handleSubmit}
              className="flex items-center gap-2"
            >
              <SaveIcon className="h-4 w-4" />
              {processing ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_420px]">
          <div className="space-y-6">
            <Card className="overflow-hidden border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <CardBody className="space-y-6 p-6">
                <div>
                  <Typography variant="h6" className="font-bold text-slate-800 dark:text-white">
                    Informasi Dasar
                  </Typography>
                  <Typography className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Atur judul, deskripsi, dan tag agar video lebih mudah ditemukan.
                  </Typography>
                </div>

                <div className="space-y-1">
                  <Typography as="label" htmlFor="title" type="small" color="default" className="font-semibold dark:text-white">
                    Judul Video
                  </Typography>
                  <Input
                    id="title"
                    placeholder="Masukkan judul video"
                    value={data.title}
                    onChange={(e) => setData("title", e.target.value)}
                    isError={!!errors.title}
                  />
                  {errors.title && (
                    <Typography type="small" color="error" className="mt-1 block">
                      {errors.title}
                    </Typography>
                  )}
                </div>

                <div className="space-y-1">
                  <Typography as="label" htmlFor="description" type="small" color="default" className="font-semibold dark:text-white">
                    Deskripsi
                  </Typography>
                  <Textarea
                    id="description"
                    placeholder="Tuliskan deskripsi video ini"
                    value={data.description}
                    onChange={(e) => setData("description", e.target.value)}
                    isError={!!errors.description}
                    className="min-h-[160px] dark:text-white"
                  />
                  {errors.description && (
                    <Typography type="small" color="error" className="mt-1 block">
                      {errors.description}
                    </Typography>
                  )}
                </div>

                <div className="space-y-2">
                  <Typography as="label" htmlFor="tags" type="small" color="default" className="font-semibold dark:text-white">
                    Tags
                  </Typography>
                  <Input
                    id="tags"
                    placeholder="Ketik tag lalu tekan Enter"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyDown={handleAddTag}
                  />
                  <div className="flex flex-wrap gap-2">
                    {data.tags.map((tag) => (
                      <Chip key={tag}>
                        <Chip.Icon>
                          <Tag className="h-full w-full" />
                        </Chip.Icon>
                        <Chip.Label>{tag}</Chip.Label>
                        <Chip.DismissTrigger onClick={() => handleRemoveTag(tag)} />
                      </Chip>
                    ))}
                  </div>
                  {errors.tags && (
                    <Typography type="small" color="error" className="mt-1 block">
                      {errors.tags}
                    </Typography>
                  )}
                </div>
              </CardBody>
            </Card>

            <Card className="overflow-hidden border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <CardBody className="space-y-5 p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Typography variant="h6" className="font-bold text-slate-800 dark:text-white">
                      Ganti Video
                    </Typography>
                    <Typography className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Upload file baru jika Anda ingin menggantikan video yang saat ini tersimpan.
                    </Typography>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    color="secondary"
                    className="flex items-center gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadCloudIcon className="h-4 w-4" />
                    Pilih Video
                  </Button>
                </div>

                <div
                  className={`rounded-2xl border-2 border-dashed p-5 transition-all duration-300 ${isVideoDragging
                    ? "border-primary bg-primary/10 dark:bg-primary/20"
                    : "border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40"
                    }`}
                  onDragOver={handleVideoDragOver}
                  onDragLeave={handleVideoDragLeave}
                  onDrop={handleVideoDrop}
                >
                  <input
                    ref={fileInputRef}
                    id="video"
                    type="file"
                    accept="video/mp4,video/quicktime,video/x-msvideo"
                    className="hidden"
                    onChange={(e) => setData("video", e.target.files?.[0] || null)}
                  />

                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <VideoIcon className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <Typography className="font-semibold text-slate-800 dark:text-white">
                          {activeVideoName}
                        </Typography>
                        <Typography className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {data.video ? "Video baru siap diunggah saat disimpan." : "Belum memilih file baru. Video lama akan tetap dipakai."}
                        </Typography>
                        <Typography className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                          {activeVideoSize}
                        </Typography>
                      </div>
                    </div>

                    {data.video && (
                      <Button
                        type="button"
                        variant="ghost"
                        color="secondary"
                        onClick={() => setData("video", null)}
                      >
                        Batalkan Ganti Video
                      </Button>
                    )}
                  </div>

                  <Typography className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                    Drag & drop video ke area ini atau pilih manual. Format: MP4, MOV, AVI. Maks 100MB.
                  </Typography>
                </div>

                {errors.video && (
                  <Typography type="small" color="error" className="mt-1 block">
                    {errors.video}
                  </Typography>
                )}
              </CardBody>
            </Card>

            <Card className="overflow-hidden border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <CardBody className="space-y-5 p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Typography variant="h6" className="font-bold text-slate-800 dark:text-white">
                      Thumbnail
                    </Typography>
                    <Typography className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Anda bisa unggah gambar baru atau ambil frame langsung dari video aktif.
                    </Typography>
                  </div>
                  <Button
                    size="sm"
                    color="info"
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => setIsCaptureModalOpen(true)}
                    type="button"
                  >
                    <CameraIcon className="h-4 w-4" />
                    Ambil Frame
                  </Button>
                </div>

                <div
                  className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ${isThumbDragging
                    ? "border-primary bg-primary/10 dark:bg-primary/20"
                    : "border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40"
                    }`}
                  onDragOver={handleThumbDragOver}
                  onDragLeave={handleThumbDragLeave}
                  onDrop={handleThumbDrop}
                  onClick={() => thumbInputRef.current?.click()}
                >
                  <input
                    ref={thumbInputRef}
                    id="thumbnail"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    className="hidden"
                    onChange={(e) => setData("thumbnail", e.target.files?.[0] || null)}
                  />

                  {thumbPreviewUrl ? (
                    <div className="relative p-3">
                      <img
                        src={thumbPreviewUrl}
                        alt="Thumbnail Preview"
                        className="aspect-video w-full rounded-xl border border-slate-200 object-cover dark:border-slate-700"
                      />
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-4 py-1 text-xs font-medium text-slate-800 shadow-sm dark:bg-slate-900/90 dark:text-white">
                        Klik untuk ganti thumbnail
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-6 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
                        <ImageIcon className="h-6 w-6 text-slate-500 dark:text-slate-400" />
                      </div>
                      <Typography className="font-semibold text-slate-800 dark:text-white">
                        Tambahkan thumbnail baru
                      </Typography>
                      <Typography className="text-sm text-slate-500 dark:text-slate-400">
                        JPG, PNG, atau WEBP. Hasil akhir akan disimpan sebagai WEBP kualitas 70%.
                      </Typography>
                    </div>
                  )}
                </div>

                {errors.thumbnail && (
                  <Typography type="small" color="error" className="mt-1 block">
                    {errors.thumbnail}
                  </Typography>
                )}
              </CardBody>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="overflow-hidden border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/40">
                <Typography variant="h6" className="font-bold text-slate-800 dark:text-white">
                  Preview Video
                </Typography>
                <Typography className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Viewer ini memakai video aktif, termasuk file baru jika Anda memilih pengganti.
                </Typography>
              </div>
              <CardBody className="space-y-4 p-5">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-inner dark:border-slate-800">
                  {activeVideoUrl ? (
                    <>
                      <video
                        ref={videoRef}
                        key={activeVideoUrl}
                        preload="metadata"
                        controls
                        className="aspect-video w-full bg-black"
                        poster={thumbPreviewUrl || undefined}
                      >
                        <source src={activeVideoUrl} />
                        Browser Anda tidak mendukung pemutaran video HTML5.
                      </video>
                    </>

                  ) : (
                    <div className="flex aspect-video items-center justify-center px-6 text-center text-sm text-slate-300">
                      URL HLS belum tersedia. Preview akan muncul setelah service transcoding mengirim callback.
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                    <Typography className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Slug
                    </Typography>
                    <Typography className="mt-1 font-medium text-slate-800 dark:text-white">
                      {video.slug}
                    </Typography>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                    <Typography className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Dibuat
                    </Typography>
                    <Typography className="mt-1 font-medium text-slate-800 dark:text-white">
                      {formatDate(video.created_at)}
                    </Typography>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50 sm:col-span-2">
                    <Typography className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Status Video
                    </Typography>
                    <Typography className="mt-1 font-medium text-slate-800 dark:text-white">
                      {data.video
                        ? "Akan diganti setelah tombol simpan ditekan."
                        : activeVideoUrl
                          ? "Masih menggunakan video yang saat ini tersimpan."
                          : "Menunggu URL HLS dari service transcoding."}
                    </Typography>
                  </div>
                </div>
              </CardBody>
            </Card>

            {progress && (
              <Card className="border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <CardBody className="space-y-3 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <Typography className="font-medium text-slate-800 dark:text-white">
                      Mengunggah perubahan
                    </Typography>
                    <Typography className="text-sm text-slate-500 dark:text-slate-400">
                      {progress.percentage}%
                    </Typography>
                  </div>
                  <Progress value={progress.percentage} color="primary" />
                </CardBody>
              </Card>
            )}
          </div>
        </form>
      </div>

      <Dialog open={isCaptureModalOpen} onOpenChange={() => setIsCaptureModalOpen(false)} size="lg">
        <Dialog.Overlay>
          <Dialog.Content className="border-0 p-0 shadow-lg shadow-black/10 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-700">
              <Typography type="h6">
                Ambil Thumbnail dari Video
              </Typography>
              <IconButton variant="ghost" size="sm" onClick={() => setIsCaptureModalOpen(false)}>
                <span className="sr-only">Tutup</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </IconButton>
            </div>

            <div className="flex w-full justify-center bg-black">
              {activeVideoUrl ? (
                <video
                  ref={videoRef}
                  preload="metadata"
                  controls
                  className="max-h-[500px] w-full object-contain"
                  poster={thumbPreviewUrl || undefined}
                >
                  <source src={activeVideoUrl} />
                  Browser Anda tidak mendukung pemutaran video HTML5.
                </video>
              ) : (
                <div className="flex min-h-[320px] w-full items-center justify-center px-6 text-center text-sm text-slate-300">
                  Tidak ada URL HLS yang bisa dipakai untuk mengambil frame saat ini.
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex w-full flex-col items-center justify-between gap-4 sm:flex-row">
                <Typography variant="small" className="text-slate-600 dark:text-slate-400">
                  Geser video ke frame yang tepat lalu klik "Simpan Frame".
                </Typography>
                <Button
                  size="md"
                  color="primary"
                  className="flex flex-shrink-0 items-center gap-2"
                  onClick={captureThumbnail}
                  type="button"
                  disabled={!activeVideoUrl}
                >
                  <CameraIcon className="h-4 w-4" />
                  Simpan Frame
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={() => setIsDeleteModalOpen(false)} size="sm">
        <Dialog.Overlay>
          <Dialog.Content className="dark:border-slate-800">
            <Typography type="h6">
              Hapus Video
            </Typography>
            <Typography className="mb-6 mt-2 text-foreground">
              Apakah Anda yakin ingin menghapus video <strong>{video.title}</strong>? File video dan thumbnail terkait juga akan dihapus dari penyimpanan.
            </Typography>
            <div className="mb-1 flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                color="secondary"
                onClick={() => setIsDeleteModalOpen(false)}
                className="mr-2"
                disabled={deleteForm.processing}
              >
                Batal
              </Button>
              <Button color="error" onClick={handleDelete} disabled={deleteForm.processing}>
                {deleteForm.processing ? "Menghapus..." : "Ya, Hapus"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog>
    </>
  );
}

Edit.layout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>;
};
