import React, { useRef, useState } from "react";
import {
  Card,
  CardBody,
  Typography,
  Button,
  Input,
  IconButton,
} from "@material-tailwind/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { ArrowLeftIcon, SaveIcon, FileTextIcon, FileUpIcon, HashIcon, LinkIcon } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

interface Book {
  id: number;
  uuid: string;
  title: string;
  coverUrl: string;
  url: string | null;
  version: number;
}

export default function Upload({ book }: { book: { data: Book } }) {
  const bookFileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingBookFile, setIsDraggingBookFile] = useState(false);

  const { data, setData, post, processing, errors } = useForm({
    url: book.data.url || "",
    version: book.data.version || 1,
    book_file: null as File | null,
    _method: "put",
  });

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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    post(route("admin.books.upload.post", book.data.id), {
      onSuccess: () => {
        toast.success("Data buku berhasil diperbarui.");
      },
      onError: () => {
        toast.error("Gagal memperbarui data buku.");
      },
    });
  };

  return (
    <>
      <Head title={`Upload Ulang Buku - ${book.data.title}`} />
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
              Upload Data Buku
            </Typography>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[max-content_1fr]  items-start gap-6">
          <Card className="w-full lg:w-[360px] shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <CardBody className="p-6 space-y-6">
              <div className="space-y-1">
                <img src={book.data.coverUrl} alt={book.data.title} className="w-full h-[360px] object-cover rounded-md" />
              </div>
              <div className="space-y-1">
                <Typography as="label" htmlFor="title" type="small" className="font-semibold dark:text-white">
                  Judul Buku
                </Typography>
                <Input type="text" value={book.data.title} disabled />
              </div>
            </CardBody>
          </Card>

          <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <CardBody className="p-6 space-y-6">
              <div className="space-y-1">
                <Typography as="label" htmlFor="url" type="small" className="font-semibold dark:text-white">
                  Download Link (Optional)
                </Typography>
                <Input
                  id="url"
                  placeholder="https://example.com/item"
                  value={data.url}
                  onChange={(event) => setData("url", event.target.value)}
                  isError={!!errors.url}
                  disabled={!!data.book_file}
                >
                  <Input.Icon><LinkIcon className="w-4 h-4" /></Input.Icon>
                </Input>
                <Typography type="small" className="text-xs text-slate-500 dark:text-slate-400">
                  Isi manual jika tidak ingin upload file buku baru.
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
                  onChange={(event) => setData("version", parseInt(event.target.value) || 1)}
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

              <div className="space-y-2">
                <Typography as="label" htmlFor="book_file" type="small" className="font-semibold dark:text-white">
                  Upload File Buku Baru
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
                          color="secondary"
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
                            Drag & drop file buku baru di sini
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
                  onChange={(event) => handleBookFileChange(event.target.files?.[0] ?? null)}
                />
                <Typography type="small" className="text-xs text-slate-500 dark:text-slate-400">
                  Jika file baru diupload, file lama akan diganti dan URL download buku akan diperbarui otomatis.
                </Typography>
                {errors.book_file && (
                  <Typography type="small" color="error" className="mt-1 block">
                    {errors.book_file}
                  </Typography>
                )}
              </div>
              <div className="flex flex-col justify-center gap-2">
                <Button
                  type="submit"
                  color="primary"
                  disabled={processing}
                  className="flex items-center justify-center gap-2"
                >
                  <SaveIcon className="w-5 h-5" />
                  {processing ? "Sedang Mengunggah..." : "Unggah File"}
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
            </CardBody>
          </Card>

        </form>
      </div>
    </>
  );
}

Upload.layout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>;
};
