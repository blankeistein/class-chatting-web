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
  Select,
  Tabs,
  Textarea,
  Typography,
} from "@material-tailwind/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, useForm } from "@inertiajs/react";
import {
  ArrowLeftIcon,
  CameraIcon,
  FileTextIcon,
  ImageIcon,
  SaveIcon,
  Tag,
  Trash2Icon,
  UploadCloudIcon,
  VideoIcon,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { resolveYoutubeId } from "./Create";
import { PageHeader } from "@/Components/PageHeader";
import { getFirebaseStorage } from "@/lib/firebase";
import { deleteObject, listAll, ref, uploadBytesResumable, UploadTask } from "firebase/storage";

interface Video {
  id: number;
  slug: string;
  title: string;
  description: string;
  provider: string;
  video_url: string | null;
  storage_path: string | null;
  thumbnail: string | null;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

const formatDate = (value?: string) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export default function Edit({ video }: { video: Video }) {
  const [activeTab, setActiveTab] = useState("info");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentTag, setCurrentTag] = useState("");

  // Info form
  const infoForm = useForm({
    title: video.title,
    description: video.description || "",
    tags: video.tags || [],
    _method: "put" as const,
  });

  // Video upload form
  const initialProvider = video.provider === "firebase" ? "file" : video.provider === "youtube" ? "youtube" : "file";
  const videoForm = useForm({
    provider: initialProvider as "file" | "youtube",
    storage_path: null as string | null,
    yt_url: video.provider === "youtube" ? (video.video_url ?? "") : "",
    _method: "patch" as const,
  });

  // Firebase upload state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const uploadTaskRef = useRef<UploadTask | null>(null);

  // Thumbnail form
  const thumbForm = useForm({
    thumbnail_url: null as string | null,
    _method: "patch" as const,
  });

  const deleteForm = useForm({});

  // Video preview
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isVideoDragging, setIsVideoDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Thumbnail preview
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreviewUrl, setThumbPreviewUrl] = useState<string | null>(video.thumbnail);
  const [isThumbDragging, setIsThumbDragging] = useState(false);
  const [isThumbUploading, setIsThumbUploading] = useState(false);
  const [thumbUploadProgress, setThumbUploadProgress] = useState(0);
  const [thumbUploadComplete, setThumbUploadComplete] = useState(false);
  const [thumbUploadError, setThumbUploadError] = useState<string | null>(null);
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const thumbUploadTaskRef = useRef<UploadTask | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (!videoFile) {
      setVideoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(videoFile);
    setVideoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  React.useEffect(() => {
    if (thumbFile) {
      const url = URL.createObjectURL(thumbFile);
      setThumbPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setThumbPreviewUrl(video.thumbnail);
  }, [thumbFile, video.thumbnail]);

  const activeVideoUrl = videoForm.data.provider === "file"
    ? videoPreviewUrl || (video.provider === "firebase" ? video.video_url : null)
    : null;
  const activeYoutubeId = videoForm.data.provider === "youtube"
    ? resolveYoutubeId(videoForm.data.yt_url || video.video_url || "")
    : null;
  const canCaptureFrame = videoForm.data.provider === "file" && Boolean(activeVideoUrl);
  const hasExistingVideo = Boolean(video.storage_path || video.video_url);

  // --- Info handlers ---
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newTag = currentTag.trim();
      if (newTag && !infoForm.data.tags.includes(newTag)) {
        infoForm.setData("tags", [...infoForm.data.tags, newTag]);
      }
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    infoForm.setData("tags", infoForm.data.tags.filter((tag) => tag !== tagToRemove));
  };

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    infoForm.post(route("admin.videos.update", video.slug), {
      onSuccess: () => toast.success("Informasi video berhasil diperbarui."),
      onError: () => toast.error("Gagal memperbarui informasi video."),
    });
  };

  // --- Video upload handlers ---
  const handleVideoDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsVideoDragging(true); };
  const handleVideoDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsVideoDragging(false); };
  const handleVideoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsVideoDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleVideoFileSelected(e.dataTransfer.files[0]);
    }
  };

  const generateStoragePath = (file: File): string => {
    const extension = file.name.split(".").pop() || "mp4";
    const originalName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    // const uniqueId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    return `videos/${video.slug}/${originalName}.${extension}`;
  };

  const handleVideoFileSelected = (file: File | null) => {
    // Cancel ongoing upload
    if (uploadTaskRef.current) {
      uploadTaskRef.current.cancel();
      uploadTaskRef.current = null;
    }
    setIsUploading(false);
    setUploadProgress(0);
    setUploadComplete(false);
    setUploadError(null);
    videoForm.setData("storage_path", null);
    setVideoFile(file);
  };

  const deleteFirebaseFile = async (path: string | null): Promise<void> => {
    if (!path) return;
    const storage = getFirebaseStorage();
    if (!storage) return;
    try {
      const fileRef = ref(storage, path);
      await deleteObject(fileRef);
    } catch {
      // File might not exist, ignore
    }
  };

  const deleteFirebaseDirectory = async (prefix: string): Promise<void> => {
    const storage = getFirebaseStorage();
    if (!storage) return;
    try {
      const dirRef = ref(storage, prefix);
      const result = await listAll(dirRef);
      await Promise.all(result.items.map((item) => deleteObject(item)));
      // Recursively delete subdirectories
      await Promise.all(result.prefixes.map((subDir) => deleteFirebaseDirectory(subDir.fullPath)));
    } catch {
      // Directory might not exist, ignore
    }
  };

  const startFirebaseUpload = async (): Promise<string> => {
    if (!videoFile) {
      toast.error("Pilih file video terlebih dahulu.");
      return Promise.reject();
    }

    const storage = getFirebaseStorage();
    if (!storage) {
      toast.error("Firebase Storage belum dikonfigurasi.");
      setUploadError("Firebase Storage belum dikonfigurasi. Pastikan environment variable VITE_FIREBASE_* sudah diisi.");
      return Promise.reject();
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadComplete(false);
    setUploadError(null);

    // Delete old video file and HLS directory from Firebase if exists
    if (video.storage_path) {
      await deleteFirebaseFile(video.storage_path);
    }
    await deleteFirebaseDirectory(`hls/${video.slug}`);

    const storagePath = generateStoragePath(videoFile);
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, videoFile);
    uploadTaskRef.current = uploadTask;

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(percent);
        },
        (error) => {
          setIsUploading(false);
          setUploadError(error.message);
          toast.error("Upload gagal: " + error.message);
          uploadTaskRef.current = null;
          reject(error);
        },
        () => {
          setIsUploading(false);
          setUploadComplete(true);
          toast.success("Video berhasil diupload ke Firebase.");
          uploadTaskRef.current = null;
          resolve(storagePath);
        },
      );
    });
  };

  const cancelFirebaseUpload = () => {
    if (uploadTaskRef.current) {
      uploadTaskRef.current.cancel();
      uploadTaskRef.current = null;
    }
    setIsUploading(false);
    setUploadProgress(0);
    setUploadComplete(false);
    setUploadError(null);
    videoForm.setData("storage_path", null);
  };

  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (videoForm.data.provider === "youtube") {
      videoForm.post(route("admin.videos.upload-video", video.slug), {
        onSuccess: () => toast.success("URL Youtube berhasil disimpan."),
        onError: () => toast.error("Gagal menyimpan URL Youtube."),
      });
      return;
    }

    try {
      const storagePath = await startFirebaseUpload();

      router.patch(route("admin.videos.upload-video", video.slug), {
        provider: "file",
        storage_path: storagePath,
        file_size: videoFile?.size || 0,
      }, {
        onSuccess: () => {
          toast.success("Video berhasil disimpan.");
          setVideoFile(null);
          setUploadComplete(false);
        },
        onError: () => toast.error("Gagal menyimpan data video."),
      });
    } catch {
      // Error already handled in startFirebaseUpload
    }
  };

  // --- Thumbnail handlers ---
  const handleThumbDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsThumbDragging(true); };
  const handleThumbDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsThumbDragging(false); };
  const handleThumbDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsThumbDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setThumbFile(e.dataTransfer.files[0]);
      setThumbUploadComplete(false);
      setThumbUploadError(null);
      thumbForm.setData("thumbnail_url", null);
    }
  };

  const extractFirebasePath = (url: string | null): string | null => {
    if (!url) return null;
    const match = url.match(/\/o\/(.+?)(\?|$)/);
    if (!match) return null;
    return decodeURIComponent(match[1]);
  };

  const generateThumbnailPath = (): string => {
    // const uniqueId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    return `videos/${video.slug}/thumbnail.webp`;
  };

  const startThumbUpload = async (): Promise<string> => {
    if (!thumbFile) {
      toast.error("Pilih file thumbnail terlebih dahulu.");
      return Promise.reject();
    }

    const storage = getFirebaseStorage();
    if (!storage) {
      toast.error("Firebase Storage belum dikonfigurasi.");
      setThumbUploadError("Firebase Storage belum dikonfigurasi.");
      return Promise.reject();
    }

    setIsThumbUploading(true);
    setThumbUploadProgress(0);
    setThumbUploadComplete(false);
    setThumbUploadError(null);

    // Delete old thumbnail from Firebase if exists
    const oldPath = extractFirebasePath(video.thumbnail);
    if (oldPath) {
      await deleteFirebaseFile(oldPath);
    }

    // Convert to WebP via canvas before upload
    const webpBlob = await convertToWebp(thumbFile);
    const thumbPath = generateThumbnailPath();
    const storageRef = ref(storage, thumbPath);
    const uploadTask = uploadBytesResumable(storageRef, webpBlob);
    thumbUploadTaskRef.current = uploadTask;

    return new Promise((res, rej) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setThumbUploadProgress(percent);
        },
        (error) => {
          setIsThumbUploading(false);
          setThumbUploadError(error.message);
          toast.error("Upload thumbnail gagal: " + error.message);
          thumbUploadTaskRef.current = null;
          rej()
        },
        () => {
          setIsThumbUploading(false);
          setThumbUploadComplete(true);
          const bucketName = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
          const thumbnailUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(thumbPath)}?alt=media`;
          res(thumbnailUrl)
          toast.success("Thumbnail berhasil diupload ke Firebase.");
          thumbUploadTaskRef.current = null;
        },
      );
    })

  };

  const convertToWebp = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas context not available")); return; }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => { if (blob) resolve(blob); else reject(new Error("Failed to convert to WebP")); },
          "image/webp",
          0.7,
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  const captureThumbnail = () => {
    if (!videoRef.current) return;
    const previewVideo = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = previewVideo.videoWidth;
    canvas.height = previewVideo.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(previewVideo, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) { toast.error("Browser gagal membuat thumbnail WebP."); return; }
        const file = new File([blob], "captured-thumbnail.webp", { type: "image/webp" });
        setThumbFile(file);
        setThumbUploadComplete(false);
        setThumbUploadError(null);
        thumbForm.setData("thumbnail_url", null);
        toast.success("Thumbnail berhasil diambil dari video.");
        setIsCaptureModalOpen(false);
      },
      "image/webp",
      0.7,
    );
  };

  const handleThumbSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const thumbnailUrl = await startThumbUpload();

      if (!thumbnailUrl) {
        toast.error("Upload thumbnail gagal.");
        return;
      }

      router.patch(route("admin.videos.upload-thumbnail", video.slug), {
        thumbnail_url: thumbnailUrl,
      }, {
        onSuccess: () => {
          toast.success("Thumbnail berhasil disimpan.");
          setThumbFile(null);
          setThumbUploadComplete(false);
        },
        onError: () => toast.error("Gagal menyimpan thumbnail."),
      });
    } catch {
      // Error already handled in startThumbUpload
    }
  };

  const handleDelete = () => {
    deleteForm.delete(route("admin.videos.destroy", video.slug), {
      onSuccess: () => { toast.success("Video berhasil dihapus."); setIsDeleteModalOpen(false); },
      onError: () => toast.error("Gagal menghapus video."),
    });
  };

  return (
    <>
      <Head title="Edit Video" />
      <Toaster position="top-center" />

      <div className="space-y-6 p-4">
        <PageHeader
          title="Edit Video"
          description="Perbarui informasi, upload video, dan atur thumbnail."
          actions={
            <>
              <Button
                color="error"
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Trash2Icon className="h-4 w-4" />
                Hapus
              </Button>
            </>
          }
          backAction={
            <IconButton
              variant="ghost"
              onClick={() => router.get(route("admin.videos.show", video.slug))}
            >
              <ArrowLeftIcon className="h-5 w-5 dark:text-white" />
            </IconButton>
          }
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <Tabs.List className="w-full">
                <Tabs.Trigger className="flex items-center gap-2" value="info">
                  <FileTextIcon className="h-4 w-4" />
                  Informasi
                </Tabs.Trigger>
                <Tabs.Trigger className="flex items-center gap-2" value="video">
                  <VideoIcon className="h-4 w-4" />
                  Upload Video
                </Tabs.Trigger>
                <Tabs.Trigger className="flex items-center gap-2" value="thumbnail">
                  <ImageIcon className="h-4 w-4" />
                  Thumbnail
                </Tabs.Trigger>
                <Tabs.TriggerIndicator />
              </Tabs.List>

              {/* Tab: Informasi */}
              <Tabs.Panel value="info">
                <form onSubmit={handleInfoSubmit} className="mt-6 space-y-6">
                  <Card className="border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <CardBody className="space-y-6 p-6">
                      <div className="space-y-1">
                        <Typography as="label" htmlFor="title" type="small" color="default" className="font-semibold dark:text-white">
                          Judul Video
                        </Typography>
                        <Input
                          id="title"
                          placeholder="Masukkan judul video"
                          value={infoForm.data.title}
                          onChange={(e) => infoForm.setData("title", e.target.value)}
                          isError={!!infoForm.errors.title}
                        />
                        {infoForm.errors.title && (
                          <Typography type="small" color="error" className="mt-1 block">{infoForm.errors.title}</Typography>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Typography as="label" htmlFor="description" type="small" color="default" className="font-semibold dark:text-white">
                          Deskripsi
                        </Typography>
                        <Textarea
                          id="description"
                          placeholder="Tuliskan deskripsi video ini"
                          value={infoForm.data.description}
                          onChange={(e) => infoForm.setData("description", e.target.value)}
                          isError={!!infoForm.errors.description}
                          className="min-h-[140px] dark:text-white"
                        />
                        {infoForm.errors.description && (
                          <Typography type="small" color="error" className="mt-1 block">{infoForm.errors.description}</Typography>
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
                          {infoForm.data.tags.map((tag) => (
                            <Chip key={tag}>
                              <Chip.Icon><Tag className="h-full w-full" /></Chip.Icon>
                              <Chip.Label>{tag}</Chip.Label>
                              <Chip.DismissTrigger onClick={() => handleRemoveTag(tag)} />
                            </Chip>
                          ))}
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  <div className="flex justify-end">
                    <Button type="submit" color="primary" disabled={infoForm.processing} className="flex items-center gap-2">
                      <SaveIcon className="h-4 w-4" />
                      {infoForm.processing ? "Menyimpan..." : "Simpan Informasi"}
                    </Button>
                  </div>
                </form>
              </Tabs.Panel>

              {/* Tab: Upload Video */}
              <Tabs.Panel value="video">
                <form onSubmit={handleVideoSubmit} className="mt-6 space-y-6">
                  <Card className="border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <CardBody className="space-y-5 p-6">
                      <div className="space-y-1">
                        <Typography as="label" type="small" color="default" className="font-semibold dark:text-white">
                          Sumber Video
                        </Typography>
                        <Select value={videoForm.data.provider} onValueChange={(value) => videoForm.setData("provider", value as "file" | "youtube")}>
                          <Select.Trigger className="w-full" value="Sumber Video" />
                          <Select.List>
                            <Select.Option value="file">File</Select.Option>
                            <Select.Option value="youtube">Youtube</Select.Option>
                          </Select.List>
                        </Select>
                      </div>

                      {videoForm.data.provider === "youtube" ? (
                        <div className="space-y-1">
                          <Typography as="label" htmlFor="yt_url" type="small" color="default" className="font-semibold dark:text-white">
                            URL Youtube
                          </Typography>
                          <Input
                            id="yt_url"
                            placeholder="Masukkan URL video Youtube"
                            value={videoForm.data.yt_url}
                            onChange={(e) => videoForm.setData("yt_url", e.target.value)}
                            isError={!!videoForm.errors.yt_url}
                          />
                          {videoForm.errors.yt_url && (
                            <Typography type="small" color="error" className="mt-1 block">{videoForm.errors.yt_url}</Typography>
                          )}
                        </div>
                      ) : (
                        <>
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
                              type="file"
                              accept="video/mp4,video/quicktime,video/x-msvideo"
                              className="hidden"
                              onChange={(e) => handleVideoFileSelected(e.target.files?.[0] || null)}
                            />
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                              <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                  <VideoIcon className="h-6 w-6" />
                                </div>
                                <div className="min-w-0">
                                  <Typography className="font-semibold text-slate-800 dark:text-white">
                                    {videoFile?.name || "Belum ada video dipilih"}
                                  </Typography>
                                  <Typography className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    {videoFile
                                      ? `${(videoFile.size / (1024 * 1024)).toFixed(2)} MB`
                                      : video.storage_path ? "Video saat ini tersimpan di Firebase." : "Pilih file video baru."}
                                  </Typography>
                                </div>
                              </div>
                              <Button type="button" variant="outline" color="secondary" className="flex items-center gap-2" onClick={() => fileInputRef.current?.click()}>
                                <UploadCloudIcon className="h-4 w-4" />
                                Pilih Video
                              </Button>
                            </div>
                            <Typography className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                              Drag & drop atau pilih manual. Format: MP4, MOV, AVI.
                            </Typography>
                          </div>

                          {videoFile && !isUploading && !uploadComplete && (
                            <Button type="submit" color="primary" className="flex w-full items-center justify-center gap-2">
                              <UploadCloudIcon className="h-4 w-4" />
                              Upload & Simpan
                            </Button>
                          )}

                          {isUploading && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between gap-3">
                                <Typography className="font-medium text-slate-800 dark:text-white">Mengupload ke Firebase...</Typography>
                                <Typography className="text-sm text-slate-500 dark:text-slate-400">{uploadProgress}%</Typography>
                              </div>
                              <Progress value={uploadProgress} color="primary">
                                <Progress.Bar />
                              </Progress>
                              <Button type="button" variant="outline" color="error" className="flex items-center gap-2" onClick={cancelFirebaseUpload}>
                                Batalkan Upload
                              </Button>
                            </div>
                          )}

                          {uploadError && (
                            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                              <Typography className="text-sm text-red-700 dark:text-red-300">{uploadError}</Typography>
                            </div>
                          )}
                        </>
                      )}

                      {videoForm.errors.storage_path && (
                        <Typography type="small" color="error" className="mt-1 block">{videoForm.errors.storage_path}</Typography>
                      )}
                    </CardBody>
                  </Card>

                  {videoForm.data.provider === "youtube" && (
                    <div className="flex justify-end">
                      <Button type="submit" color="primary" disabled={videoForm.processing} className="flex items-center gap-2">
                        <SaveIcon className="h-4 w-4" />
                        {videoForm.processing ? "Menyimpan..." : "Simpan"}
                      </Button>
                    </div>
                  )}
                </form>
              </Tabs.Panel>

              {/* Tab: Thumbnail */}
              <Tabs.Panel value="thumbnail">
                <form onSubmit={handleThumbSubmit} className="mt-6 space-y-6">
                  <Card className="border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <CardBody className="space-y-5 p-6">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <Typography variant="h6" className="font-bold text-slate-800 dark:text-white">
                            Thumbnail
                          </Typography>
                          <Typography className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Upload gambar baru atau ambil frame dari video.
                          </Typography>
                        </div>
                        {(canCaptureFrame || hasExistingVideo) && (
                          <Button size="sm" color="info" variant="outline" className="flex items-center gap-2" onClick={() => setIsCaptureModalOpen(true)} type="button">
                            <CameraIcon className="h-4 w-4" />
                            Ambil Frame
                          </Button>
                        )}
                      </div>

                      <div
                        className={`relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ${isThumbDragging
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
                          type="file"
                          accept="image/jpeg,image/png,image/jpg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setThumbFile(file);
                            setThumbUploadComplete(false);
                            setThumbUploadError(null);
                            thumbForm.setData("thumbnail_url", null);
                          }}
                        />
                        {thumbPreviewUrl ? (
                          <div className="relative p-3">
                            <img src={thumbPreviewUrl} alt="Thumbnail Preview" className="aspect-video w-full rounded-xl border border-slate-200 object-cover dark:border-slate-700" />
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-4 py-1 text-xs font-medium text-slate-800 shadow-sm dark:bg-slate-900/90 dark:text-white">
                              Klik untuk ganti thumbnail
                            </div>
                          </div>
                        ) : (
                          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-6 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
                              <ImageIcon className="h-6 w-6 text-slate-500 dark:text-slate-400" />
                            </div>
                            <Typography className="font-semibold text-slate-800 dark:text-white">Tambahkan thumbnail</Typography>
                            <Typography className="text-sm text-slate-500 dark:text-slate-400">JPG, PNG, atau WEBP. Disimpan sebagai WEBP 70%.</Typography>
                          </div>
                        )}
                      </div>

                      {thumbForm.errors.thumbnail_url && (
                        <Typography type="small" color="error" className="mt-1 block">{thumbForm.errors.thumbnail_url}</Typography>
                      )}
                      {isThumbUploading && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <Typography className="font-medium text-slate-800 dark:text-white">Mengupload thumbnail...</Typography>
                            <Typography className="text-sm text-slate-500 dark:text-slate-400">{thumbUploadProgress}%</Typography>
                          </div>
                          <Progress value={thumbUploadProgress} color="primary">
                            <Progress.Bar />
                          </Progress>
                        </div>
                      )}

                      {thumbUploadError && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                          <Typography className="text-sm text-red-700 dark:text-red-300">{thumbUploadError}</Typography>
                        </div>
                      )}

                      <div className="flex w-full">
                        <Button type="submit" color="primary" disabled={!thumbFile || isThumbUploading} className="flex items-center gap-2 w-full">
                          <SaveIcon className="h-4 w-4" />
                          {isThumbUploading ? "Mengupload..." : "Simpan Thumbnail"}
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                </form>
              </Tabs.Panel>
            </Tabs>
          </div>

          {/* Sidebar: Preview & Info */}
          <div className="space-y-6">
            <Card className="overflow-hidden border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/40">
                <Typography variant="h6" className="font-bold text-slate-800 dark:text-white">Preview</Typography>
              </div>
              <CardBody className="space-y-4 p-5">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-inner dark:border-slate-800">
                  {videoForm.data.provider === "youtube" && activeYoutubeId ? (
                    <div className="flex aspect-video items-center justify-center bg-black">
                      <iframe
                        src={`https://www.youtube.com/embed/${activeYoutubeId}`}
                        title="YouTube Video Preview"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="h-full w-full"
                      />
                    </div>
                  ) : activeVideoUrl ? (
                    <video
                      ref={videoRef}
                      key={activeVideoUrl}
                      preload="metadata"
                      controls
                      crossOrigin="anonymous"
                      className="aspect-video w-full bg-black"
                      poster={thumbPreviewUrl || undefined}
                    >
                      <source src={activeVideoUrl} />
                    </video>
                  ) : (
                    <div className="flex aspect-video items-center justify-center px-6 text-center text-sm text-slate-400">
                      {videoForm.data.provider === "youtube"
                        ? "Masukkan URL YouTube yang valid untuk preview."
                        : "Belum ada video. Upload file untuk melihat preview."}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/50">
                    <Typography className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Slug</Typography>
                    <Typography className="mt-1 text-sm font-medium text-slate-800 dark:text-white">{video.slug}</Typography>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/50">
                    <Typography className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Dibuat</Typography>
                    <Typography className="mt-1 text-sm font-medium text-slate-800 dark:text-white">{formatDate(video.created_at)}</Typography>
                  </div>
                  <div className="col-span-2 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/50">
                    <Typography className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Provider</Typography>
                    <Typography className="mt-1 text-sm font-medium text-slate-800 dark:text-white">{video.provider}</Typography>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>

      {/* Capture Modal */}
      <Dialog open={isCaptureModalOpen} onOpenChange={() => setIsCaptureModalOpen(false)} size="lg">
        <Dialog.Overlay>
          <Dialog.Content className="border-0 p-0 shadow-lg shadow-black/10 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-700">
              <Typography type="h6">Ambil Thumbnail dari Video</Typography>
              <IconButton variant="ghost" size="sm" onClick={() => setIsCaptureModalOpen(false)}>
                <span className="sr-only">Tutup</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </IconButton>
            </div>
            <div className="flex w-full justify-center bg-black">
              {(canCaptureFrame || hasExistingVideo) && (activeVideoUrl || video.video_url) ? (
                <video ref={videoRef} preload="metadata" controls crossOrigin="anonymous" className="max-h-[500px] w-full object-contain" poster={thumbPreviewUrl || undefined}>
                  <source src={activeVideoUrl || video.video_url || ""} />
                </video>
              ) : (
                <div className="flex min-h-[320px] w-full items-center justify-center px-6 text-center text-sm text-slate-300">
                  Thumbnail dari frame hanya tersedia untuk video file yang bisa diputar lewat HTML5.
                </div>
              )}
            </div>
            <div className="border-t border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex w-full flex-col items-center justify-between gap-4 sm:flex-row">
                <Typography variant="small" className="text-slate-600 dark:text-slate-400">
                  Geser video ke frame yang tepat lalu klik "Simpan Frame".
                </Typography>
                <Button size="md" color="primary" className="flex flex-shrink-0 items-center gap-2" onClick={captureThumbnail} type="button" disabled={!(canCaptureFrame || hasExistingVideo)}>
                  <CameraIcon className="h-4 w-4" />
                  Simpan Frame
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={() => setIsDeleteModalOpen(false)} size="sm">
        <Dialog.Overlay>
          <Dialog.Content className="dark:border-slate-800">
            <Typography type="h6">Hapus Video</Typography>
            <Typography className="mb-6 mt-2 text-foreground">
              Apakah Anda yakin ingin menghapus video <strong>{video.title}</strong>? Asset Firebase yang terkait juga akan dihapus.
            </Typography>
            <div className="mb-1 flex items-center justify-end gap-2">
              <Button variant="ghost" color="secondary" onClick={() => setIsDeleteModalOpen(false)} disabled={deleteForm.processing}>Batal</Button>
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
