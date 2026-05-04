import React, { useRef, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  IconButton,
  Typography,
} from "@material-tailwind/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { ArrowLeftIcon, FileSpreadsheetIcon, UploadCloudIcon, XIcon } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

type CsvPreview = {
  fileName: string;
  fileSize: string;
  headers: string[];
  rows: string[][];
  totalRows: number;
};

function formatFileSize(sizeInBytes: number): string {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  }

  const sizeInKilobytes = sizeInBytes / 1024;

  if (sizeInKilobytes < 1024) {
    return `${sizeInKilobytes.toFixed(1)} KB`;
  }

  return `${(sizeInKilobytes / 1024).toFixed(1)} MB`;
}

function parseCsvContent(content: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let isInsideQuotes = false;

  const pushCell = () => {
    currentRow.push(currentCell);
    currentCell = "";
  };

  const pushRow = () => {
    const hasMeaningfulContent = currentRow.length > 0 || currentCell.trim() !== "";

    if (hasMeaningfulContent) {
      pushCell();
      rows.push(currentRow);
    }

    currentRow = [];
    currentCell = "";
  };

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];

    if (isInsideQuotes) {
      if (character === '"') {
        if (content[index + 1] === '"') {
          currentCell += '"';
          index += 1;
        } else {
          isInsideQuotes = false;
        }

        continue;
      }

      currentCell += character;
      continue;
    }

    if (character === '"') {
      isInsideQuotes = true;
      continue;
    }

    if (character === ",") {
      pushCell();
      continue;
    }

    if (character === "\n") {
      pushRow();
      continue;
    }

    if (character !== "\r") {
      currentCell += character;
    }
  }

  if (currentRow.length > 0 || currentCell.trim() !== "") {
    pushRow();
  }

  return rows;
}

async function buildCsvPreview(file: File): Promise<CsvPreview> {
  const rows = parseCsvContent(await file.text());
  const headers = rows[0] ?? [];
  const bodyRows = rows.slice(1);

  return {
    fileName: file.name,
    fileSize: formatFileSize(file.size),
    headers,
    rows: bodyRows.slice(0, 5),
    totalRows: bodyRows.length,
  };
}

export default function Import() {
  const [isImportDragging, setIsImportDragging] = useState(false);
  const [importPreview, setImportPreview] = useState<CsvPreview | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewRequestRef = useRef(0);

  const importForm = useForm<{ file: File | null }>({
    file: null,
  });

  const resetImportState = () => {
    setIsImportDragging(false);
    setIsPreviewLoading(false);
    setImportPreview(null);
    importForm.reset();
    importForm.clearErrors();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImportFile = async (file: File | null) => {
    if (!file) {
      importForm.setData("file", null);
      setImportPreview(null);
      setIsPreviewLoading(false);
      return;
    }

    importForm.setData("file", file);
    importForm.clearErrors();
    setIsPreviewLoading(true);

    const currentRequestId = previewRequestRef.current + 1;
    previewRequestRef.current = currentRequestId;

    try {
      const preview = await buildCsvPreview(file);

      if (previewRequestRef.current === currentRequestId) {
        setImportPreview(preview);
      }
    } catch {
      if (previewRequestRef.current === currentRequestId) {
        setImportPreview(null);
        toast.error("Gagal membaca file CSV. Pastikan format file valid.");
      }
    } finally {
      if (previewRequestRef.current === currentRequestId) {
        setIsPreviewLoading(false);
      }
    }
  };

  const handleImportSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    importForm.post(route("admin.schools.import"), {
      forceFormData: true,
      onSuccess: () => {
        toast.success("Import sekolah berhasil diproses.");
        resetImportState();
        router.get(route("admin.schools.index"));
      },
      onError: () => {
        if (typeof importForm.errors === "object") {
          Object.values(importForm.errors).forEach((message) => {
            toast.error(message);
          });
        } else {
          toast.error("Import sekolah gagal. Periksa file CSV Anda.");
        }
      },
    });
  };

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsImportDragging(false);

    const file = event.dataTransfer.files?.[0] ?? null;
    void handleImportFile(file);
  };

  return (
    <>
      <Head title="Import Sekolah" />
      <Toaster position="top-center" />

      <div className="p-4 space-y-6">
        <div className="flex items-center gap-4">
          <IconButton
            variant="ghost"
            onClick={() => router.get(route("admin.schools.index"))}
          >
            <ArrowLeftIcon className="w-5 h-5 dark:text-white" />
          </IconButton>
          <div>
            <Typography variant="h4" className="text-xl font-bold text-slate-800 dark:text-white">
              Import Sekolah
            </Typography>
            <Typography className="text-slate-500 dark:text-slate-400">
              Upload file CSV untuk menambahkan atau memperbarui data sekolah.
            </Typography>
          </div>
        </div>

        <Card className="mx-auto max-w-5xl overflow-hidden border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardBody className="p-6">
            <form className="space-y-6" onSubmit={handleImportSubmit}>
              {!importForm.data.file ? (
                <div
                  className={`rounded-2xl border-2 border-dashed p-8 transition-colors ${isImportDragging ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/30" : "border-slate-300 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-900"}`}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setIsImportDragging(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsImportDragging(true);
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    setIsImportDragging(false);
                  }}
                  onDrop={handleFileDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      void handleImportFile(file);
                    }}
                  />
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm dark:bg-slate-800">
                      <FileSpreadsheetIcon className="h-7 w-7 text-slate-500" />
                    </div>
                    <div className="space-y-1">
                      <Typography className="font-semibold text-slate-800 dark:text-white">
                        Seret dan lepas file CSV di sini
                      </Typography>
                      <Typography className="text-sm text-slate-500 dark:text-slate-400">
                        Atau pilih file dari komputer untuk melihat preview sebelum import.
                      </Typography>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
                        Pilih File
                      </Button>
                      <Typography className="text-xs text-slate-500 dark:text-slate-400">
                        Format yang didukung: .csv
                      </Typography>
                    </div>
                  </div>
                </div>
              ) : null}

              {importForm.data.file ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                        <FileSpreadsheetIcon className="h-5 w-5 text-slate-500" />
                      </div>
                      <div>
                        <Typography className="font-semibold text-slate-800 dark:text-white">
                          {importForm.data.file.name}
                        </Typography>
                        <Typography className="text-sm text-slate-500 dark:text-slate-400">
                          {formatFileSize(importForm.data.file.size)}
                        </Typography>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      color="error"
                      className="self-start"
                      onClick={() => {
                        void handleImportFile(null);

                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                    >
                      Batal
                    </Button>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                      <Typography className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Kolom
                      </Typography>
                      <Typography className="mt-1 font-semibold text-slate-800 dark:text-white">
                        {importPreview?.headers.length ?? 0}
                      </Typography>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                      <Typography className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Baris data
                      </Typography>
                      <Typography className="mt-1 font-semibold text-slate-800 dark:text-white">
                        {importPreview?.totalRows ?? 0}
                      </Typography>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                      <Typography className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Preview
                      </Typography>
                      <Typography className="mt-1 font-semibold text-slate-800 dark:text-white">
                        {isPreviewLoading ? "Memuat..." : `${Math.min(importPreview?.rows.length ?? 0, 5)} baris`}
                      </Typography>
                    </div>
                  </div>
                </div>
              ) : null}

              {(isPreviewLoading || importPreview?.headers.length) && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                  {isPreviewLoading ? (
                    <div className="mt-4 animate-pulse rounded-xl bg-slate-100 p-6 dark:bg-slate-900">
                      <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
                      <div className="mt-4 h-32 rounded bg-slate-200 dark:bg-slate-800" />
                    </div>
                  ) : importPreview?.headers.length ? (
                    <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="min-w-full table-auto text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900">
                          <tr>
                            {importPreview.headers.map((header, index) => (
                              <th key={`${header}-${index}`} className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                                <Typography variant="small" className="font-bold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                                  {header || `Kolom ${index + 1}`}
                                </Typography>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {importPreview.rows.length > 0 ? (
                            importPreview.rows.map((row, rowIndex) => (
                              <tr key={`${rowIndex}-${row.join("-")}`} className="border-b border-slate-100 last:border-b-0 dark:border-slate-800">
                                {importPreview.headers.map((_, columnIndex) => (
                                  <td key={`${rowIndex}-${columnIndex}`} className="px-4 py-3 align-top text-sm text-slate-700 dark:text-slate-200">
                                    {row[columnIndex] || "-"}
                                  </td>
                                ))}
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={Math.max(importPreview.headers.length, 1)} className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                                Tidak ada baris data untuk ditampilkan.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                <Button type="submit" disabled={importForm.processing || !importForm.data.file || isPreviewLoading} className="flex items-center gap-2">
                  <UploadCloudIcon className="h-4 w-4" />
                  {importForm.processing ? "Import..." : "Import CSV"}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

Import.layout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>;
};
