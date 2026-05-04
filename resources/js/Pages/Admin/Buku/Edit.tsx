import React, { useRef, useState } from "react";
import {
  Card,
  CardBody,
  Typography,
  Button,
  Input,
  IconButton,
  Chip,
  Select,
} from "@material-tailwind/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { ArrowLeftIcon, SaveIcon, ImageIcon, XIcon, TagIcon, LinkIcon, HashIcon } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

interface Book {
  id: number;
  uuid: string;
  title: string;
  type: string;
  coverUrl: string;
  tags: string[] | null;
  url: string | null;
  version: number;
}

export default function Edit({ book }: { book: { data: Book } }) {
  const [thumbPreviewUrl, setThumbPreviewUrl] = useState<string | null>(book.data.coverUrl);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const [currentTag, setCurrentTag] = useState("");

  const { data, setData, post, processing, errors } = useForm({
    title: book.data.title,
    type: book.data.type || "materi",
    tags: book.data.tags || [] as string[],
    url: book.data.url || "",
    version: book.data.version || 1,
    cover_url: null as File | null,
    _method: 'put'
  });

  React.useEffect(() => {
    if (data.cover_url) {
      const url = URL.createObjectURL(data.cover_url);
      setThumbPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [data.cover_url]);

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
    post(route("admin.books.update", book.data.id), {
      onSuccess: () => {
        toast.success("Buku berhasil diperbarui.");
      },
      onError: () => toast.error("Gagal memperbarui buku. Periksa kembali form Anda."),
    });
  };

  return (
    <>
      <Head title={`Edit Buku - ${book.data.title}`} />
      <Toaster position="top-center" />

      <div className="p-4 space-y-6">
        <div className="flex items-center gap-4">
          <IconButton
            variant="ghost"
            onClick={() => router.get(route("admin.books.index"))}
          >
            <ArrowLeftIcon className="w-5 h-5 dark:text-white" />
          </IconButton>
          <div>
            <Typography variant="h4" className="text-xl font-bold text-slate-800 dark:text-white">
              Edit Buku
            </Typography>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  />
                  {errors.title && (
                    <Typography type="small" color="error" className="mt-1 block">
                      {errors.title}
                    </Typography>
                  )}
                </div>

                <div className="space-y-1">
                  <Typography as="label" htmlFor="type" type="small" className="font-semibold dark:text-white">
                    Tipe Buku
                  </Typography>
                  <Select
                    value={data.type}
                    onValueChange={(value) => setData("type", value ?? "materi")}
                  >
                    <Select.Trigger id="type" placeholder="Pilih tipe buku">
                      {() => data.type === "penilaian" ? "Penilaian" : "Materi"}
                    </Select.Trigger>
                    <Select.List>
                      <Select.Option value="materi">Materi</Select.Option>
                      <Select.Option value="penilaian">Penilaian</Select.Option>
                    </Select.List>
                  </Select>
                  {errors.type && (
                    <Typography type="small" color="error" className="mt-1 block">
                      {errors.type}
                    </Typography>
                  )}
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
                        className="bg-primary/10 text-primary flex items-center gap-1"
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
                  onChange={(e) => e.target.files && setData("cover_url", e.target.files[0])}
                />
                <Typography variant="small" className="text-slate-400 italic">
                  Kosongkan jika tidak ingin mengubah cover.
                </Typography>
                {errors.cover_url && (
                  <Typography type="small" color="error" className="mt-1 block">
                    {errors.cover_url}
                  </Typography>
                )}
              </CardBody>
            </Card>

          </div>
          <div className="lg:col-span-3 flex flex-col justify-center w-full gap-2 lg:max-w-[80%] mx-auto">
            <Button
              type="submit"
              color="primary"
              disabled={processing}
              size="lg"
              className="flex items-center justify-center gap-2"
              onClick={handleSubmit}
            >
              <SaveIcon className="w-5 h-5" />
              {processing ? "Menyimpan..." : "Simpan Perubahan"}
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

Edit.layout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>;
};
