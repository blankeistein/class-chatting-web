import React, { useRef, useState } from "react";
import {
  Card,
  CardBody,
  Typography,
  Button,
  Input,
  IconButton,
  Chip,
} from "@material-tailwind/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { ArrowLeftIcon, SaveIcon, ImageIcon, XIcon, TagIcon, LinkIcon, HashIcon } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

export default function Create() {
  const [thumbPreviewUrl, setThumbPreviewUrl] = useState<string | null>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const [currentTag, setCurrentTag] = useState("");

  const { data, setData, post, processing, errors } = useForm({
    title: "",
    tags: [] as string[],
    url: "",
    version: 1,
    cover_image: null as File | null,
  });

  React.useEffect(() => {
    if (data.cover_image) {
      const url = URL.createObjectURL(data.cover_image);
      setThumbPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setThumbPreviewUrl(null);
    }
  }, [data.cover_image]);

  const handleTagAdd = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && currentTag.trim()) {
      e.preventDefault();
      if (!data.tags.includes(currentTag.trim())) {
        setData("tags", [...data.tags, currentTag.trim()]);
      }
      setCurrentTag("");
    }
  };

  const removeTag = (index: number) => {
    setData("tags", data.tags.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route("admin.books.store"), {
      onSuccess: () => {
        toast.success("Buku berhasil ditambahkan.");
      },
      onError: () => {
        console.error(errors);
        toast.error("Gagal menambahkan buku. Periksa kembali form Anda.")
      }
    });
  };

  return (
    <>
      <Head title="Tambah Buku Baru" />
      <Toaster position="top-center" />
      <div className="p-4 space-y-6">
        <div className="flex items-center gap-4">
          <IconButton
            variant="ghost"
            onClick={() => router.get(route("admin.books.index"))}
            className="rounded-full flex-shrink-0"
          >
            <ArrowLeftIcon className="w-5 h-5 dark:text-white" />
          </IconButton>
          <div>
            <Typography variant="h4" className="text-xl font-bold text-slate-800 dark:text-white">
              Tambah Buku Baru
            </Typography>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                <CardBody className="p-6 space-y-6">
                  <div className="space-y-1">
                    <Typography as="label" htmlFor="title" type="small" className="font-semibold dark:text-white">
                      Judul Buku
                    </Typography>
                    <Input
                      id="title"
                      placeholder="Masukkan judul buku"
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <Typography as="label" htmlFor="url" type="small" className="font-semibold dark:text-white">
                        URL Buku (Optional)
                      </Typography>
                      <Input
                        id="url"
                        placeholder="https://example.com/item"
                        value={data.url}
                        onChange={(e) => setData("url", e.target.value)}
                        isError={!!errors.url}
                        className="dark:text-white"
                      >
                        <Input.Icon><LinkIcon className="w-4 h-4" /></Input.Icon>
                      </Input>
                      {errors.url && (
                        <Typography type="small" color="error" className="mt-1 block">
                          {errors.url}
                        </Typography>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Typography as="label" htmlFor="version" type="small" className="font-semibold dark:text-white">
                        Versi
                      </Typography>
                      <Input
                        id="version"
                        type="number"
                        placeholder="1"
                        value={data.version}
                        onChange={(e) => setData("version", parseInt(e.target.value) || 1)}
                        isError={!!errors.version}
                        className="dark:text-white"
                      >
                        <Input.Icon><HashIcon className="w-4 h-4" /></Input.Icon>
                      </Input>
                      {errors.version && (
                        <Typography type="small" color="error" className="mt-1 block">
                          {errors.version}
                        </Typography>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Typography as="label" htmlFor="tags" type="small" className="font-semibold dark:text-white">
                      Tags
                    </Typography>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {data.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          size="sm"
                          variant="ghost"
                          className="bg-primary/10 text-primary capitalize flex items-center gap-1"
                        >
                          <Chip.Label>{tag}</Chip.Label>
                          <XIcon className="w-3 h-3 cursor-pointer" onClick={() => removeTag(index)} />
                        </Chip>
                      ))}
                    </div>
                    <Input
                      placeholder="Tambah tag dan tekan Enter"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyDown={handleTagAdd}
                      className="dark:text-white"
                    >
                      <Input.Icon><TagIcon className="w-4 h-4" /></Input.Icon>
                    </Input>
                  </div>
                </CardBody>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                <CardBody className="p-6 space-y-4 text-center">
                  <Typography variant="h6" className="text-left font-bold dark:text-white">
                    Cover Buku
                  </Typography>
                  <div
                    onClick={() => thumbInputRef.current?.click()}
                    className={`aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${thumbPreviewUrl ? 'border-primary' : 'border-slate-300 dark:border-slate-700 hover:border-primary'
                      }`}
                  >
                    {thumbPreviewUrl ? (
                      <img src={thumbPreviewUrl} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <>
                        <ImageIcon className="w-12 h-12 text-slate-300 mb-2" />
                        <Typography className="text-slate-500 text-xs">Klik untuk upload cover</Typography>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={thumbInputRef}
                    hidden
                    accept="image/*"
                    onChange={(e) => e.target.files && setData("cover_image", e.target.files[0])}
                  />
                  {errors.cover_image && (
                    <Typography type="small" color="error" className="mt-1 block">
                      {errors.cover_image}
                    </Typography>
                  )}
                </CardBody>
              </Card>

            </div>
          </div>
          <div className="flex flex-col gap-2 mx-auto w-full max-w-[300px]">
            <Button
              type="submit"
              color="primary"
              disabled={processing}
              className="flex items-center justify-center gap-2"
              onClick={handleSubmit}
            >
              <SaveIcon className="w-5 h-5" />
              {processing ? "Menyimpan..." : "Simpan Buku"}
            </Button>
            <Button
              variant="ghost"
              color="secondary"
              type="button"
              onClick={() => router.get(route("admin.books.index"))}
            >
              Batal
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
