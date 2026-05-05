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
  ArrowRightIcon,
  CameraIcon,
  CheckCircleIcon,
  ImageIcon,
  SaveIcon,
  Tag,
  UploadCloudIcon,
  VideoIcon,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

const STEPS = [
  {
    id: 1,
    title: "Informasi",
    description: "Judul, deskripsi, dan tag video.",
  },
  {
    id: 2,
    title: "Video",
    description: "Upload file utama dan cek preview.",
  },
  {
    id: 3,
    title: "Thumbnail",
    description: "Pilih cover lalu review sebelum simpan.",
  },
] as const;

export default function Create() {
  const [currentStep, setCurrentStep] = useState<(typeof STEPS)[number]["id"]>(1);
  const [isVideoDragging, setIsVideoDragging] = useState(false);
  const [isThumbDragging, setIsThumbDragging] = useState(false);
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [thumbPreviewUrl, setThumbPreviewUrl] = useState<string | null>(null);
  const [currentTag, setCurrentTag] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { data, setData, post, processing, errors, progress } = useForm({
    title: "",
    description: "",
    thumbnail: null as File | null,
    video: null as File | null,
    tags: [] as string[],
  });

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
    if (!data.thumbnail) {
      setThumbPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(data.thumbnail);
    setThumbPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [data.thumbnail]);

  const activeVideoName = data.video?.name || "Belum ada video dipilih";
  const activeVideoSize = data.video ? `${(data.video.size / (1024 * 1024)).toFixed(2)} MB` : "Pilih video untuk melihat preview";

  const goToStep = (step: (typeof STEPS)[number]["id"]) => {
    setCurrentStep(step);
  };

  const goNext = () => {
    if (currentStep === 1 && !data.title.trim()) {
      toast.error("Judul video perlu diisi dulu.");
      return;
    }

    if (currentStep === 2 && !data.video) {
      toast.error("Pilih file video sebelum lanjut.");
      return;
    }

    if (currentStep >= 3) {
      handleSubmit();
      return;
    }

    setCurrentStep((step) => Math.min(step + 1, STEPS.length) as (typeof STEPS)[number]["id"]);
  };

  const goBack = () => {
    setCurrentStep((step) => Math.max(step - 1, 1) as (typeof STEPS)[number]["id"]);
  };

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

  const handleSubmit = () => {
    post(route("admin.videos.store"), {
      onSuccess: () => {
        toast.success("Video berhasil diunggah.");
      },
      onError: () => {
        toast.error("Gagal mengunggah video.");
      },
    });
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

  return (
    <>
      <Head title="Unggah Video Baru" />
      <Toaster position="top-center" />

      <div className="space-y-6 p-4">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <IconButton
              variant="ghost"
              onClick={() => router.get(route("admin.videos.index"))}
            >
              <ArrowLeftIcon className="h-5 w-5 dark:text-white" />
            </IconButton>
            <div>
              <Typography variant="h4" className="font-bold text-slate-800 dark:text-white">
                Unggah Video Baru
              </Typography>
              <Typography className="text-slate-500 dark:text-slate-400">
                Ikuti langkah berikut untuk menyiapkan video sebelum dipublikasikan.
              </Typography>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
          <Card className="border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <CardBody className="space-y-4 p-5">
              <Typography variant="h6" className="font-bold text-slate-800 dark:text-white">
                Langkah Upload
              </Typography>
              <div className="space-y-3">
                {STEPS.map((step) => {
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;

                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => goToStep(step.id)}
                      className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all ${isActive
                        ? "border-primary bg-primary/10 dark:bg-primary/15"
                        : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                        }`}
                    >
                      <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${isCompleted
                        ? "bg-primary text-white"
                        : isActive
                          ? "bg-primary/15 text-primary"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        }`}>
                        {isCompleted ? <CheckCircleIcon className="h-4 w-4" /> : step.id}
                      </div>
                      <div>
                        <Typography className="font-semibold text-slate-800 dark:text-white">
                          {step.title}
                        </Typography>
                        <Typography className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {step.description}
                        </Typography>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <Typography className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Progress
                </Typography>
                <Typography className="mt-1 font-medium text-slate-800 dark:text-white">
                  Langkah {currentStep} dari {STEPS.length}
                </Typography>
              </div>
            </CardBody>
          </Card>

          <form>
            {currentStep === 1 && (
              <Card className="border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <CardBody className="space-y-6 p-6">
                  <div>
                    <Typography variant="h5" className="font-bold text-slate-800 dark:text-white">
                      Informasi Dasar
                    </Typography>
                    <Typography className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Isi informasi utama video sebelum memilih file yang akan diunggah.
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
                      className="min-h-[180px] dark:text-white"
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
            )}

            {currentStep === 2 && (
              <Card className="border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <CardBody className="space-y-6 p-6">
                  <div>
                    <Typography variant="h5" className="font-bold text-slate-800 dark:text-white">
                      Upload Video
                    </Typography>
                    <Typography className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Tambahkan file utama, lalu cek preview sebelum lanjut ke thumbnail.
                    </Typography>
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
                            {data.video ? "File video siap diunggah saat formulir disimpan." : "Belum memilih file video."}
                          </Typography>
                          <Typography className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                            {activeVideoSize}
                          </Typography>
                        </div>
                      </div>

                      <div className="flex flex-wrap justify-end gap-2">
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
                        {data.video && (
                          <Button
                            type="button"
                            variant="ghost"
                            color="secondary"
                            onClick={() => setData("video", null)}
                          >
                            Batalkan Pilihan
                          </Button>
                        )}
                      </div>
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

                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-inner dark:border-slate-800">
                    {videoPreviewUrl ? (
                      <video
                        ref={videoRef}
                        src={videoPreviewUrl}
                        controls
                        className="aspect-video w-full bg-black"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="flex aspect-video items-center justify-center bg-slate-950 text-slate-500">
                        <div className="text-center">
                          <VideoIcon className="mx-auto h-10 w-10" />
                          <Typography className="mt-3 text-sm text-slate-400">
                            Preview video akan muncul di sini.
                          </Typography>
                        </div>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <Card className="border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <CardBody className="space-y-6 p-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <Typography variant="h5" className="font-bold text-slate-800 dark:text-white">
                          Thumbnail dan Review
                        </Typography>
                        <Typography className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          Tambahkan cover dan pastikan semua data sudah benar sebelum upload.
                        </Typography>
                      </div>
                      {videoPreviewUrl && (
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
                      )}
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
                            Tambahkan thumbnail
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

                <Card className="border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <CardBody className="space-y-4 p-6">
                    <Typography variant="h6" className="font-bold text-slate-800 dark:text-white">
                      Ringkasan Upload
                    </Typography>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50 sm:col-span-2">
                        <Typography className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Judul
                        </Typography>
                        <Typography className="mt-1 font-medium text-slate-800 dark:text-white">
                          {data.title || "Belum diisi"}
                        </Typography>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                        <Typography className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Video
                        </Typography>
                        <Typography className="mt-1 font-medium text-slate-800 dark:text-white">
                          {data.video ? "Siap diunggah" : "Belum ada file"}
                        </Typography>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                        <Typography className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Thumbnail
                        </Typography>
                        <Typography className="mt-1 font-medium text-slate-800 dark:text-white">
                          {data.thumbnail ? "Sudah dipilih" : "Opsional"}
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
                          Mengunggah video
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
            )}

            <div className="mt-6 flex flex-col-reverse justify-between gap-3 border-t border-slate-200 pt-5 sm:flex-row dark:border-slate-800">
              <Button
                type="button"
                variant="ghost"
                color="secondary"
                onClick={currentStep === 1 ? () => router.get(route("admin.videos.index")) : goBack}
                className="flex items-center justify-center gap-2"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                {currentStep === 1 ? "Batal" : "Kembali"}
              </Button>

              {
                (currentStep < STEPS.length) ?
                  <Button type="button" color="primary" onClick={goNext} className="flex items-center justify-center gap-2">
                    Lanjut
                    <ArrowRightIcon className="h-4 w-4" />
                  </Button>
                  :
                  <Button type="button" color="primary" onClick={goNext} disabled={processing || !(currentStep >= STEPS.length)} className="flex items-center justify-center gap-2">
                    <SaveIcon className="h-4 w-4" />
                    {processing ? "Mengunggah..." : "Simpan Video"}
                  </Button>
              }

            </div>
          </form>
        </div >
      </div >

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

            {videoPreviewUrl && (
              <div className="flex w-full justify-center bg-black max-h-[70vh] overflow-auto">
                <video
                  ref={videoRef}
                  src={videoPreviewUrl}
                  controls
                  className="w-full max-h-[500px] object-cover"
                  crossOrigin="anonymous"
                />
              </div>
            )}

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
                >
                  <CameraIcon className="h-4 w-4" />
                  Simpan Frame
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog>
    </>
  );
}

Create.layout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>;
};
