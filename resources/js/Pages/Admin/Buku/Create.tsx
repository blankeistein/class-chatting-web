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
import { ArrowLeftIcon, SaveIcon, ImageIcon, XIcon, TagIcon, LinkIcon, HashIcon, RefreshCcwIcon, FileUpIcon, FileTextIcon } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

const generateCustomID = (length: number = 32): string => {
  const characters: string = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result: string = '';

  for (let i = 0; i < length; i++) {
    const randomIndex: number = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }

  return result;
};

export default function Create() {
  const [thumbPreviewUrl, setThumbPreviewUrl] = useState<string | null>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const bookFileInputRef = useRef<HTMLInputElement>(null);
  const [currentTag, setCurrentTag] = useState("");
  const [isDraggingBookFile, setIsDraggingBookFile] = useState(false);

  const { data, setData, post, processing, errors } = useForm({
    title: "",
    uuid: generateCustomID(32),
    type: "materi",
    tags: [] as string[],
    url: "",
    version: 1,
    cover_url: null as File | null,
    book_file: null as File | null,
  });

  React.useEffect(() => {
    if (data.cover_url) {
      const url = URL.createObjectURL(data.cover_url);
      setThumbPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setThumbPreviewUrl(null);
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

  const generateUuid = () => {
    setData("uuid", generateCustomID(32));
  };

  const handleBookFileChange = (file: File | null) => {
    setData("book_file", file);

    if (file) {
      setData("url", "");
    }
  };

  const handleBookFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingBookFile(false);

    const file = event.dataTransfer.files?.[0] ?? null;

    if (file) {
      handleBookFileChange(file);
    }
  };

  const formatFileSize = (size: number) => {
    if (size < 1024 * 1024) {
      return `${Math.round(size / 1024)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
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
          >
            <ArrowLeftIcon className="w-5 h-5 dark:text-white" />
          </IconButton>
          <div>
            <Typography variant="h4" className="text-xl font-bold text-slate-800 dark:text-white">
              Tambah Buku Baru
            </Typography>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
              <CardBody className="p-6 space-y-6">
                <div className="space-y-1">
                  <Typography as="label" htmlFor="uuid" type="small" className="font-semibold dark:text-white">
                    UID Buku
                  </Typography>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      id="uuid"
                      placeholder="Masukkan UID custom"
                      value={data.uuid}
                      onChange={(e) => setData("uuid", e.target.value)}
                      isError={!!errors.uuid}
                    />
                    <IconButton
                      type="button"
                      variant="ghost"
                      color="secondary"
                      onClick={generateUuid}
                    >
                      <RefreshCcwIcon className="w-4 h-4" />
                    </IconButton>
                  </div>
                  {errors.uuid && (
                    <Typography type="small" color="error" className="mt-1 block">
                      {errors.uuid}
                    </Typography>
                  )}
                </div>

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <Typography as="label" htmlFor="url" type="small" className="font-semibold dark:text-white">
                      Download Link (Optional)
                    </Typography>
                    <Input
                      id="url"
                      placeholder="https://example.com/item"
                      value={data.url}
                      onChange={(e) => setData("url", e.target.value)}
                      isError={!!errors.url}
                      disabled={!!data.book_file}
                    >
                      <Input.Icon><LinkIcon className="w-4 h-4" /></Input.Icon>
                    </Input>
                    <Typography type="small" className="text-xs text-slate-500 dark:text-slate-400">
                      Kosongkan jika ingin memakai upload file buku.
                    </Typography>
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
                  <Typography as="label" htmlFor="book_file" type="small" className="font-semibold dark:text-white">
                    File Buku (Optional)
                  </Typography>
                  <div
                    onClick={() => bookFileInputRef.current?.click()}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDraggingBookFile(true);
                    }}
                    onDragLeave={() => setIsDraggingBookFile(false)}
                    onDrop={handleBookFileDrop}
                    className={`rounded-xl border-2 border-dashed p-5 transition-all cursor-pointer ${isDraggingBookFile
                      ? "border-primary bg-primary/5"
                      : data.book_file
                        ? "border-primary/60 bg-primary/5"
                        : "border-slate-300 dark:border-slate-700 hover:border-primary"
                      }`}
                  >
                    <div className="flex flex-col items-center justify-center gap-3 text-center">
                      {data.book_file ? (
                        <>
                          <FileTextIcon className="h-10 w-10 text-primary" />
                          <div>
                            <Typography className="font-semibold text-slate-800 dark:text-white">
                              {data.book_file.name}
                            </Typography>
                            <Typography className="text-xs text-slate-500 dark:text-slate-400">
                              {formatFileSize(data.book_file.size)}
                            </Typography>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            color="error"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleBookFileChange(null);

                              if (bookFileInputRef.current) {
                                bookFileInputRef.current.value = "";
                              }
                            }}
                          >
                            Hapus File
                          </Button>
                        </>
                      ) : (
                        <>
                          <FileUpIcon className="h-10 w-10 text-slate-400" />
                          <div>
                            <Typography className="font-semibold text-slate-800 dark:text-white">
                              Drag & drop file buku di sini
                            </Typography>
                            <Typography className="text-xs text-slate-500 dark:text-slate-400">
                              atau klik untuk pilih file zip
                            </Typography>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <input
                    id="book_file"
                    type="file"
                    ref={bookFileInputRef}
                    hidden
                    accept=".zip,application/zip,application/x-zip,application/x-zip-compressed"
                    onChange={(e) => handleBookFileChange(e.target.files?.[0] ?? null)}
                  />
                  {errors.book_file && (
                    <Typography type="small" color="error" className="mt-1 block">
                      {errors.book_file}
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
