import React, { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Chip,
  IconButton,
  Input,
  Select,
  Textarea,
  Typography,
} from "@material-tailwind/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, useForm } from "@inertiajs/react";
import {
  ArrowLeftIcon,
  SaveIcon,
  Tag,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { PageHeader } from "@/Components/PageHeader";

export function resolveYoutubeId(input: string): string | null {
  if (!input) return null;

  const value = input.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) {
    return value;
  }

  try {
    const url = new URL(value);

    const v = url.searchParams.get("v");
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) {
      return v;
    }

    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    const parts = url.pathname.split("/").filter(Boolean);
    const possibleId = parts.find((part) =>
      /^[a-zA-Z0-9_-]{11}$/.test(part)
    );

    return possibleId ?? null;
  } catch {
    return null;
  }
}

export default function Create() {
  const [currentTag, setCurrentTag] = useState("");

  const { data, setData, post, processing, errors } = useForm({
    title: "",
    description: "",
    provider: "file" as "file" | "youtube",
    yt_url: "",
    tags: [] as string[],
  });

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

    post(route("admin.videos.store"), {
      onSuccess: () => {
        toast.success("Video berhasil dibuat. Silakan upload file video dan thumbnail.");
      },
      onError: () => {
        toast.error("Gagal menyimpan video.");
      },
    });
  };

  return (
    <>
      <Head title="Buat Video Baru" />
      <Toaster position="top-center" />

      <div className="space-y-6 p-4">
        <PageHeader
          title="Buat Video Baru"
          description="Isi informasi dasar video. Setelah disimpan, Anda bisa upload file video dan thumbnail."
          backAction={
            <IconButton
              variant="ghost"
              onClick={() => router.get(route("admin.videos.index"))}
            >
              <ArrowLeftIcon className="h-5 w-5 dark:text-white" />
            </IconButton>
          }
        />

        <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
          <Card className="border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <CardBody className="space-y-6 p-6">
              <div>
                <Typography variant="h5" className="font-bold text-slate-800 dark:text-white">
                  Informasi Video
                </Typography>
                <Typography className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Isi judul, deskripsi, dan pilih sumber video.
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
                  className="min-h-[140px] dark:text-white"
                />
                {errors.description && (
                  <Typography type="small" color="error" className="mt-1 block">
                    {errors.description}
                  </Typography>
                )}
              </div>

              <div className="space-y-1">
                <Typography as="label" type="small" color="default" className="font-semibold dark:text-white">
                  Sumber Video
                </Typography>
                <Select value={data.provider} onValueChange={(value) => setData("provider", value as "file" | "youtube")}>
                  <Select.Trigger className="w-full" value="Sumber Video" />
                  <Select.List>
                    <Select.Option value="file">File (Upload setelah simpan)</Select.Option>
                    <Select.Option value="youtube">Youtube</Select.Option>
                  </Select.List>
                </Select>
              </div>

              {data.provider === "youtube" && (
                <div className="space-y-1">
                  <Typography as="label" htmlFor="yt_url" type="small" color="default" className="font-semibold dark:text-white">
                    URL Youtube
                  </Typography>
                  <Input
                    id="yt_url"
                    placeholder="Masukkan URL video Youtube"
                    value={data.yt_url}
                    onChange={(e) => setData("yt_url", e.target.value)}
                    isError={!!errors.yt_url}
                  />
                  {errors.yt_url && (
                    <Typography type="small" color="error" className="mt-1 block">
                      {errors.yt_url}
                    </Typography>
                  )}
                  {data.yt_url && resolveYoutubeId(data.yt_url) && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                      <iframe
                        src={`https://www.youtube.com/embed/${resolveYoutubeId(data.yt_url)}`}
                        title="YouTube Video Preview"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="aspect-video w-full"
                      />
                    </div>
                  )}
                </div>
              )}

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

          {data.provider === "file" && (
            <Card className="border border-blue-200 bg-blue-50 shadow-sm dark:border-blue-800 dark:bg-blue-900/20">
              <CardBody className="p-4">
                <Typography className="text-sm text-blue-700 dark:text-blue-300">
                  Setelah data disimpan, Anda akan diarahkan ke halaman edit untuk upload file video dan menentukan thumbnail.
                </Typography>
              </CardBody>
            </Card>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              color="secondary"
              onClick={() => router.get(route("admin.videos.index"))}
            >
              Batal
            </Button>
            <Button
              type="submit"
              color="primary"
              disabled={processing}
              className="flex items-center gap-2"
            >
              <SaveIcon className="h-4 w-4" />
              {processing ? "Menyimpan..." : "Simpan & Lanjut Upload"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

Create.layout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>;
};
