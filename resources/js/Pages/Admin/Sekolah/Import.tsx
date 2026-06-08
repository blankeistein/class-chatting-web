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
import { PageHeader } from "@/Components/PageHeader";
import axios from "axios";

type CsvPreview = {
  fileName: string;
  fileSize: string;
  headers: string[];
  rows: string[][];
  totalRows: number;
};

type ImportResult = {
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
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

    if (character === ";") {
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
    rows: bodyRows.slice(0, 100),
    totalRows: bodyRows.length,
  };
}

export default function Import() {
  const [isImportDragging, setIsImportDragging] = useState(false);
  const [importPreview, setImportPreview] = useState<CsvPreview | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importProcessing, setImportProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewRequestRef = useRef(0);

  const importForm = useForm<{ file: File | null }>({
    file: null,
  });

  const resetImportState = () => {
    setIsImportDragging(false);
    setIsPreviewLoading(false);
    setImportPreview(null);
    setImportResult(null);
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

  const handleImportSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!importForm.data.file) {
      toast.error("Pilih file CSV terlebih dahulu.");
      return;
    }

    const formData = new FormData();
    formData.append("file", importForm.data.file);

    setImportProcessing(true);

    try {
      const response = await axios.post(route("admin.schools.import"), formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const result = response.data;

      if (!result.success) {
        toast.error(result.message || "Import sekolah gagal.");
        setImportProcessing(false);
        return;
      }

      setImportResult(result.data);
      toast.success(result.message || "Import sekolah berhasil diproses.");
      setImportProcessing(false);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Terjadi kesalahan saat import. Silakan coba lagi.";
      toast.error(errorMessage);
      setImportProcessing(false);
    }
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
        <PageHeader
          title="Import Sekolah"
          description="Upload file CSV untuk menambahkan atau memperbarui data sekolah."
          backAction={
            <IconButton
              variant="ghost"
              onClick={() => router.get(route("admin.schools.index"))}
            >
              <ArrowLeftIcon className="w-5 h-5 dark:text-white" />
            </IconButton>
          }
        />

        <Card className="mx-auto max-w-5xl overflow-hidden bg-secondary/20">
          <CardBody className="p-6">
            <form className="space-y-6" onSubmit={handleImportSubmit}>
              {!importForm.data.file ? (
                <Card
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
                </Card>
              ) : null}

              {importForm.data.file ? (
                <Card>
                  <Card.Body className="p-4">
                    <div className="flex gap-3 sm:flex-row sm:items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary">
                          <FileSpreadsheetIcon className="h-5 w-5 text-secondary-foreground/80" />
                        </div>
                        <div>
                          <Typography className="font-semibold">
                            {importForm.data.file.name}
                          </Typography>
                          <Typography className="text-sm text-primary/70">
                            {formatFileSize(importForm.data.file.size)}
                          </Typography>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
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
                      <div className="rounded-xl bg-secondary p-3">
                        <Typography className="text-xs uppercase tracking-wide text-secondary-foreground">
                          Kolom
                        </Typography>
                        <Typography className="mt-1 font-semibold text-secondary-foreground/80">
                          {importPreview?.headers.length ?? 0}
                        </Typography>
                      </div>
                      <div className="rounded-xl bg-secondary p-3">
                        <Typography className="text-xs uppercase tracking-wide text-secondary-foreground">
                          Baris data
                        </Typography>
                        <Typography className="mt-1 font-semibold text-secondary-foreground/80">
                          {importPreview?.totalRows ?? 0}
                        </Typography>
                      </div>
                      <div className="rounded-xl bg-secondary p-3">
                        <Typography className="text-xs uppercase tracking-wide text-secondary-foreground">
                          Preview
                        </Typography>
                        <Typography className="mt-1 font-semibold text-secondary-foreground/80">
                          {isPreviewLoading ? "Memuat..." : `${Math.min(importPreview?.rows.length ?? 0, 100)} baris`}
                        </Typography>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              ) : null}

              {(importPreview && importResult) && (
                <Card>
                  <Card.Body className="p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <Typography className="text-lg font-semibold">
                        Hasil Import
                      </Typography>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          resetImportState();
                          router.get(route("admin.schools.index"));
                        }}
                      >
                        Lihat Data Sekolah
                      </Button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-4">

                      <div className="rounded-xl bg-info p-4">
                        <Typography className="text-xs uppercase tracking-wide text-info-foreground">
                          Total Diproses
                        </Typography>
                        <Typography className="mt-2 text-2xl font-bold text-info-foreground">
                          {importResult.processed}
                        </Typography>
                      </div>

                      <div className="rounded-xl bg-success p-4">
                        <Typography className="text-xs uppercase tracking-wide text-success-foreground">
                          Berhasil Dibuat
                        </Typography>
                        <Typography className="mt-2 text-2xl font-bold text-success-foreground">
                          {importResult.created}
                        </Typography>
                      </div>

                      <div className="rounded-xl bg-warning p-4">
                        <Typography className="text-xs uppercase tracking-wide text-warning-foreground">
                          Berhasil Diperbarui
                        </Typography>
                        <Typography className="mt-2 text-2xl font-bold text-warning-foreground">
                          {importResult.updated}
                        </Typography>
                      </div>

                      <div className="rounded-xl bg-error p-4">
                        <Typography className="text-xs uppercase tracking-wide text-error-foreground">
                          Dilewati
                        </Typography>
                        <Typography className="mt-2 text-2xl font-bold text-error-foreground">
                          {importResult.skipped}
                        </Typography>
                      </div>
                    </div>
                    {importResult.errors.length > 0 && (
                      <div className="mt-4 rounded-xl bg-error/10 p-4">
                        <Typography className="mb-2 text-sm font-semibold text-error">
                          Error Details ({importResult.errors.length} baris):
                        </Typography>
                        <div className="max-h-40 space-y-1 overflow-y-auto">
                          {importResult.errors.slice(0, 10).map((error, index) => (
                            <Typography key={index} className="text-xs text-error">
                              • {error}
                            </Typography>
                          ))}
                          {importResult.errors.length > 10 && (
                            <Typography className="text-xs italic text-error">
                              ... dan {importResult.errors.length - 10} error lainnya
                            </Typography>
                          )}
                        </div>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              )}

              {(isPreviewLoading || importPreview?.headers.length) && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                  {isPreviewLoading ? (
                    <div className="animate-pulse rounded-xl bg-slate-100 p-6 dark:bg-slate-900">
                      <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
                      <div className="mt-4 h-32 rounded bg-slate-200 dark:bg-slate-800" />
                    </div>
                  ) : importPreview?.headers.length ? (
                    <>

                      <div className="max-h-[500px] overflow-auto overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                        <table className="min-w-full table-auto text-left">
                          <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0">
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
                    </>
                  ) : null}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                <Button type="submit" disabled={importProcessing || !importForm.data.file || isPreviewLoading} className="flex items-center gap-2">
                  <UploadCloudIcon className="h-4 w-4" />
                  {importProcessing ? "Import..." : "Import CSV"}
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
