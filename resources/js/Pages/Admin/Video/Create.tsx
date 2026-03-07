import React, { useRef, useState } from "react";
import {
  Card,
  CardBody,
  Typography,
  Button,
  Input,
  Textarea,
  Progress,
  IconButton,
  Dialog,
  Chip,
} from "@material-tailwind/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { ArrowLeftIcon, SaveIcon, UploadCloudIcon, VideoIcon, ImageIcon, CameraIcon, XIcon, Tag } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

export default function Create() {
  const [isDragging, setIsDragging] = useState(false);
  const [isThumbDragging, setIsThumbDragging] = useState(false);
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [thumbPreviewUrl, setThumbPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [currentTag, setCurrentTag] = useState("");

  const { data, setData, post, processing, errors, progress } = useForm({
    title: "",
    description: "",
    thumbnail: null as File | null,
    video: null as File | null,
    tags: [] as string[],
  });

  React.useEffect(() => {
    if (data.video) {
      const url = URL.createObjectURL(data.video);
      setVideoPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setVideoPreviewUrl(null);
    }
  }, [data.video]);

  React.useEffect(() => {
    if (data.thumbnail) {
      const url = URL.createObjectURL(data.thumbnail);
      setThumbPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setThumbPreviewUrl(null);
    }
  }, [data.thumbnail]);

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
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "captured-thumbnail.jpg", { type: "image/jpeg" });
            setData("thumbnail", file);
            toast.success("Thumbnail berhasil diambil dari video.");
            setIsCaptureModalOpen(false);
          }
        }, "image/jpeg", 0.9);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setData("video", e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route("admin.videos.store"), {
      onSuccess: () => {
        toast.success("Video berhasil diunggah.");
      },
      onError: () => toast.error("Gagal mengunggah video."),
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
    setData("tags", data.tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <>
      <Head title="Unggah Video Baru" />
      <Toaster position="top-center" />

      <div className="p-4 space-y-6">
        <div className="flex items-center gap-4">
          <IconButton
            variant="ghost"
            onClick={() => router.get(route("admin.videos.index"))}
            className="rounded-full flex-shrink-0"
          >
            <ArrowLeftIcon className="w-5 h-5 dark:text-white" />
          </IconButton>
          <div>
            <Typography variant="h4" className="text-xl font-bold text-slate-800 dark:text-white">
              Unggah Video Baru
            </Typography>
          </div>
        </div>

        <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900 overflow-hidden max-w-3xl mx-auto">
          <CardBody className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <Typography as="label" htmlFor="title" type="small" color="default" className="font-semibold dark:text-white">
                  Judul Video
                </Typography>
                <Input
                  id="title"
                  placeholder="Masukkan judul video (contoh: Belajar Matematika Dasar)"
                  value={data.title}
                  onChange={(e) => setData("title", e.target.value)}
                  isError={!!errors.title}
                  className="dark:text-white"
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
                  placeholder="Tuliskan deskripsi lengkap mengenai isi video ini..."
                  value={data.description}
                  onChange={(e) => setData("description", e.target.value)}
                  isError={!!errors.description}
                  className="dark:text-white min-h-[120px]"
                />
                {errors.description && (
                  <Typography type="small" color="error" className="mt-1 block">
                    {errors.description}
                  </Typography>
                )}
              </div>

              <div className="space-y-1">
                <Typography as="label" htmlFor="tags" type="small" color="default" className="font-semibold dark:text-white">
                  Tags (Opsional)
                </Typography>
                <div className="flex flex-col gap-2">
                  <Input
                    id="tags"
                    placeholder="Ketik tag lalu tekan Enter (misal: edukasi, tutorial)"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="dark:text-white"
                  />
                  {data.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {data.tags.map((tag) => (
                        <Chip key={tag}>
                          <Chip.Icon><Tag className="h-full w-full" /></Chip.Icon>
                          <Chip.Label>{tag}</Chip.Label>
                          <Chip.DismissTrigger onClick={() => handleRemoveTag(tag)} />
                        </Chip>
                      ))}
                    </div>
                  )}
                  {errors.tags && (
                    <Typography type="small" color="error" className="mt-1 block">
                      {errors.tags}
                    </Typography>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <Typography as="label" type="small" color="default" className="font-semibold dark:text-white">
                    Thumbnail / Cover Video (Opsional, Max 5MB)
                  </Typography>
                  {videoPreviewUrl && (
                    <Button
                      size="sm"
                      color="info"
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => setIsCaptureModalOpen(true)}
                      type="button"
                    >
                      <CameraIcon className="w-4 h-4" />
                      Ambil Frame dari Video
                    </Button>
                  )}
                </div>

                <div
                  className={`mt-1 flex flex-col items-center justify-center w-full min-h-[160px] border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 relative overflow-hidden ${isThumbDragging
                    ? 'border-primary bg-primary/10 dark:bg-primary/20'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
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
                    accept="image/jpeg,image/png,image/jpg"
                    className="hidden"
                    onChange={(e) => setData("thumbnail", e.target.files?.[0] || null)}
                  />

                  {thumbPreviewUrl ? (
                    <div className="flex flex-col items-center justify-center w-full h-full p-2">
                      <img src={thumbPreviewUrl} alt="Thumbnail Preview" className="max-h-[200px] object-contain rounded-lg shadow-sm" />
                      <Typography variant="small" className="text-primary mt-3 flex items-center justify-center gap-1 font-medium bg-white/80 dark:bg-slate-900/80 px-3 py-1 rounded-full absolute bottom-4">
                        Klik atau drag untuk mengganti gambar
                      </Typography>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-4 text-center">
                      <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                      </div>
                      <Typography className="font-semibold text-slate-800 dark:text-white mt-2">
                        Pilih gambar atau drag & drop ke sini
                      </Typography>
                      <Typography variant="small" className="text-slate-500">
                        JPG, PNG. Maks 5MB.
                      </Typography>
                    </div>
                  )}
                </div>

                {errors.thumbnail && (
                  <Typography type="small" color="error" className="mt-1 block">
                    {errors.thumbnail}
                  </Typography>
                )}
              </div>

              <div className="space-y-1">
                <Typography as="label" type="small" color="default" className="font-semibold dark:text-white">
                  File Video (MP4, Max 100MB)
                </Typography>

                <div
                  className={`mt-1 flex flex-col items-center justify-center w-full min-h-[160px] border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${isDragging
                    ? 'border-primary bg-primary/10 dark:bg-primary/20'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    id="video"
                    type="file"
                    accept="video/mp4,video/quicktime,video/x-msvideo"
                    className="hidden"
                    onChange={(e) => setData("video", e.target.files?.[0] || null)}
                  />

                  {data.video ? (
                    <div className="flex flex-col items-center gap-4 p-4 text-center w-full" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm w-full">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                            <VideoIcon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="text-left min-w-0">
                            <Typography className="font-semibold text-slate-800 dark:text-white truncate">
                              {data.video.name}
                            </Typography>
                            <Typography variant="small" className="text-slate-500">
                              {(data.video.size / (1024 * 1024)).toFixed(2)} MB
                            </Typography>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" color="primary" onClick={() => fileInputRef.current?.click()}>
                          Ganti
                        </Button>
                      </div>

                      {videoPreviewUrl && (
                        <div className="w-full mt-2 flex justify-center max-w-full">
                          <video
                            src={videoPreviewUrl}
                            controls
                            className="max-h-[300px] rounded-xl bg-black border border-slate-200 dark:border-slate-800"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-4 text-center">
                      <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                        <UploadCloudIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                      </div>
                      <Typography className="font-semibold text-slate-800 dark:text-white mt-2">
                        Pilih file atau drag & drop ke sini
                      </Typography>
                      <Typography variant="small" className="text-slate-500">
                        MP4, MOV, atau AVI. Maks 100MB.
                      </Typography>
                    </div>
                  )}
                </div>

                {errors.video && (
                  <Typography type="small" color="error" className="mt-1 block">
                    {errors.video}
                  </Typography>
                )}
              </div>

              {progress && (
                <div className="w-full mt-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
                  <Typography variant="small" className="mb-2 dark:text-white font-medium flex justify-between">
                    <span>Mengunggah file...</span>
                    <span>{progress.percentage}%</span>
                  </Typography>
                  <Progress value={progress.percentage} color="primary" />
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800 mt-6 gap-2">
                <Button
                  variant="ghost"
                  color="secondary"
                  type="button"
                  onClick={() => router.get(route("admin.videos.index"))}
                  className="mr-2"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  disabled={processing}
                  className="flex items-center gap-2"
                >
                  {processing ? "Menyimpan..." : (
                    <>
                      <SaveIcon className="w-4 h-4" /> Simpan Video
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>

      {/* Capture Modal */}
      <Dialog open={isCaptureModalOpen} onOpenChange={() => setIsCaptureModalOpen(false)} size="lg">
        <Dialog.Overlay>
          <Dialog.Content className="dark:border-slate-800 p-0 border-0 shadow-lg shadow-black/10">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <Typography type="h6" className="dark:text-white">Ambil Thumbnail dari Video</Typography>
              <IconButton variant="ghost" size="sm" onClick={() => setIsCaptureModalOpen(false)}>
                <span className="sr-only">Tutup</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </IconButton>
            </div>

            {videoPreviewUrl && (
              <div className="w-full flex justify-center bg-black">
                <video
                  ref={videoRef}
                  src={videoPreviewUrl}
                  controls
                  className="w-full max-h-[500px] object-cover"
                  crossOrigin="anonymous"
                />
              </div>
            )}

            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700">
              <div className="flex flex-col sm:flex-row w-full justify-between items-center gap-4">
                <Typography variant="small" className="text-slate-600 dark:text-slate-400">
                  Geser video ke frame yang tepat lalu klik "Simpan Frame"
                </Typography>
                <Button
                  size="md"
                  color="primary"
                  className="flex items-center gap-2 flex-shrink-0"
                  onClick={captureThumbnail}
                  type="button"
                >
                  <CameraIcon className="w-4 h-4" />
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
