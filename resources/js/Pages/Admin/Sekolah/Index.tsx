import React, { useRef, useState } from "react";
import {
  Button,
  Card,
  Dialog,
  DialogRootProps,
  IconButton,
  Input,
  Menu,
  Typography,
} from "@material-tailwind/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, useForm } from "@inertiajs/react";
import {
  Building2Icon,
  FileSpreadsheetIcon,
  EditIcon,
  MoreVerticalIcon,
  PlusIcon,
  SearchIcon,
  UploadCloudIcon,
  XIcon,
  Trash2Icon,
  Copy,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

type School = {
  id: number;
  code: string;
  old_code?: string | null;
  npsn: string | null;
  name: string;
  bentuk_pendidikan: string;
  status: "SWASTA" | "NEGERI";
  province?: {
    id: number;
    code: string;
    name: string;
  };
  regency?: {
    id: number;
    code: string;
    name: string;
    type: string | null;
  };
  district?: {
    id: number;
    code: string;
    name: string;
  };
  address?: string | null;
};

type PaginationLink = {
  url: string | null;
  label: string;
  active: boolean;
};

type SchoolsPayload = {
  data: School[];
  meta?: {
    links: PaginationLink[];
  };
  links?: PaginationLink[];
};

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

export default function Index({ schools: paginatedSchools, filters }: { schools: SchoolsPayload; filters?: { search?: string; per_page?: number } }) {
  const [schools, setSchools] = useState<School[]>(paginatedSchools.data);
  const [search, setSearch] = useState(filters?.search || "");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isImportDragging, setIsImportDragging] = useState(false);
  const [importPreview, setImportPreview] = useState<CsvPreview | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [currentSchool, setCurrentSchool] = useState<School | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewRequestRef = useRef(0);

  const deleteForm = useForm();
  const importForm = useForm<{ file: File | null }>({
    file: null,
  });

  React.useEffect(() => {
    setSchools(paginatedSchools.data);
  }, [paginatedSchools.data]);

  const resetImportState = () => {
    setIsImportOpen(false);
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

  const handleFilter = () => {
    router.get(route("admin.schools.index"), { search }, {
      preserveState: true,
      replace: true,
      only: ["schools", "filters"],
    });
  };

  const openDelete = (school: School) => {
    setCurrentSchool(school);
    setIsDeleteOpen(true);
  };

  const handleDeleteSubmit = () => {
    if (!currentSchool) {
      return;
    }

    deleteForm.delete(route("admin.schools.destroy", currentSchool.code), {
      onSuccess: () => {
        toast.success("Sekolah berhasil dihapus.");
        setIsDeleteOpen(false);
      },
      onError: () => {
        toast.error("Gagal menghapus sekolah.");
      },
    });
  };

  const handleImportSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    importForm.post(route("admin.schools.import"), {
      forceFormData: true,
      onSuccess: () => {
        toast.success("Import sekolah berhasil diproses.");
        resetImportState();
      },
      onError: () => {
        if (typeof importForm.errors === "object") {
          const errorMessages = Object.values(importForm.errors);
          for (const message of errorMessages) {
            toast.error(message);
          }
          console.error("Import errors:", errorMessages);
        } else {
          console.error("Import error:", importForm.errors);
          toast.error("Import sekolah gagal. Periksa file CSV Anda.");
        }
      },
    });
  };

  const handleImportDialogOpenChange: React.Dispatch<React.SetStateAction<boolean>> = (open) => {
    if (!open) {
      resetImportState();
      return;
    }

    setIsImportOpen(true);
  };

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsImportDragging(false);

    const file = event.dataTransfer.files?.[0] ?? null;
    void handleImportFile(file);
  };

  const paginationLinks = paginatedSchools.meta?.links || paginatedSchools.links || [];

  return (
    <>
      <Head title="Manajemen Sekolah" />
      <Toaster position="top-center" />

      <div className="p-4 space-y-6 min-h-screen">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Typography variant="h4" className="font-bold text-slate-800 dark:text-white">
              Manajemen Sekolah
            </Typography>
            <Typography className="text-slate-500 dark:text-slate-400">
              Kelola data sekolah beserta referensi wilayahnya.
            </Typography>
          </div>
          <div className="w-full md:w-auto flex flex-col md:flex-row items-stretch md:items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setIsImportOpen(true)}
            >
              <UploadCloudIcon className="w-4 h-4" />
              Import CSV
            </Button>
            <Button
              size="sm"
              className="flex items-center gap-2"
              onClick={() => router.get(route("admin.schools.create"))}
            >
              <PlusIcon className="w-4 h-4" />
              Tambah Sekolah
            </Button>
          </div>
        </div>

        <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <Card.Body className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="w-full md:w-80">
              <Input
                placeholder="Cari nama sekolah atau NPSN"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleFilter();
                  }
                }}
                className="dark:text-white"
              >
                <Input.Icon>
                  <SearchIcon className="w-4 h-4 cursor-pointer" onClick={handleFilter} />
                </Input.Icon>
              </Input>
            </div>
          </Card.Body>
        </Card>

        {schools.length > 0 ? (
          <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max table-auto text-left">
                <thead>
                  <tr>
                    {["Code", "Sekolah", "Status", "NPSN", "Wilayah", "Aksi"].map((head) => (
                      <th key={head} className="border-y border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-4">
                        <Typography variant="small" className="font-bold leading-none opacity-70 text-slate-500 dark:text-slate-300">
                          {head}
                        </Typography>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {schools.map((school) => (
                    <tr
                      key={school.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800"
                    >
                      <td className="p-4">
                        <Typography variant="small" className="cursor-pointer font-bold text-slate-800 dark:text-white flex gap-2 items-center" onClick={() => {
                          navigator.clipboard.writeText(school.code);
                          toast.success("Kode sekolah disalin ke clipboard.");
                        }} >
                          <Copy className="w-4 h-4 text-slate-400" />
                          {school.code}
                        </Typography>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Typography variant="small" className="font-bold text-slate-800 dark:text-white">
                            {school.name}
                          </Typography>
                        </div>
                      </td>
                      <td className="p-4">
                        <Typography variant="small" className="font-medium text-slate-700 dark:text-slate-200">
                          {school.status}
                        </Typography>
                      </td>
                      <td className="p-4">
                        <Typography variant="small" className="font-medium text-slate-700 dark:text-slate-200">
                          {school.npsn || "-"}
                        </Typography>
                      </td>
                      <td className="p-4">
                        <Typography variant="small" className="text-slate-700 dark:text-slate-200">
                          {school.address || "-"}, {school.district?.name || "-"}
                        </Typography>
                        <Typography variant="small" className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                          {school.regency?.name || "-"}, {school.province?.name || "-"}
                        </Typography>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center">
                          <Menu placement="bottom-end">
                            <Menu.Trigger as={IconButton} variant="ghost" size="sm" color="secondary" className="rounded-full">
                              <MoreVerticalIcon className="w-5 h-5" />
                            </Menu.Trigger>
                            <Menu.Content className="z-20 min-w-[160px] dark:bg-slate-900 border-none shadow-xl">
                              <Menu.Item
                                className="flex items-center gap-2 dark:hover:bg-slate-800"
                                onClick={() => router.get(route("admin.schools.edit", school.code))}
                              >
                                <EditIcon className="w-4 h-4" />
                                Edit Sekolah
                              </Menu.Item>
                              <hr className="!my-1 -mx-1 border-slate-100 dark:border-slate-800" />
                              <Menu.Item
                                className="flex items-center gap-2 text-error dark:text-red-400 dark:hover:bg-slate-800"
                                onClick={() => openDelete(school)}
                              >
                                <Trash2Icon className="w-4 h-4" />
                                Hapus
                              </Menu.Item>
                            </Menu.Content>
                          </Menu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-slate-50 border border-dashed border-slate-300 rounded-lg dark:bg-slate-900 dark:border-slate-700">
            <Building2Icon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
            <Typography className="text-slate-500 dark:text-slate-400">
              Belum ada data sekolah.
            </Typography>
          </div>
        )}

        <div className="mt-8 flex justify-center gap-2">
          {paginationLinks.map((link, key) => (
            <Button
              key={key}
              variant={link.active ? "solid" : "ghost"}
              size="sm"
              color={link.active ? "primary" : "secondary"}
              className={`flex items-center gap-2 ${!link.url ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
              dangerouslySetInnerHTML={{ __html: link.label }}
              disabled={!link.url}
            />
          ))}
        </div>
      </div>

      <Dialog open={isImportOpen} onOpenChange={handleImportDialogOpenChange} size="xl">
        <Dialog.Overlay>
          <Dialog.Content className="dark:border-slate-800 max-w-4xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Typography type="h6" className="dark:text-white">
                  Import Sekolah dari CSV
                </Typography>
                <Typography className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Seret file CSV ke area di bawah atau pilih dari perangkat Anda. Preview akan muncul sebelum data diunggah.
                </Typography>
              </div>
              <IconButton variant="ghost" color="secondary" onClick={resetImportState}>
                <XIcon className="h-4 w-4" />
              </IconButton>
            </div>

            <form className="mt-6 space-y-6" onSubmit={handleImportSubmit}>
              {
                !importForm.data.file && (
                  <div
                    className={`rounded-2xl border-2 border-dashed p-6 transition-colors ${isImportDragging ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/30" : "border-slate-300 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-900"}`}
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
                          Atau buka file dari komputer untuk melihat preview terlebih dahulu.
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
                )
              }

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

              {
                isPreviewLoading || importPreview?.headers.length &&
                (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    {isPreviewLoading ? (
                      <div className="mt-4 animate-pulse rounded-xl bg-slate-100 p-6 dark:bg-slate-900">
                        <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
                        <div className="mt-4 h-32 rounded bg-slate-200 dark:bg-slate-800" />
                      </div>
                    ) : importPreview?.headers.length && (
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
                    )}
                  </div>
                )
              }

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                <Button type="button" variant="ghost" color="secondary" onClick={resetImportState}>
                  Batal
                </Button>
                <Button type="submit" disabled={importForm.processing || !importForm.data.file || isPreviewLoading}>
                  {importForm.processing ? "Import..." : "Import CSV"}
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={() => setIsDeleteOpen(false)} size="sm">
        <Dialog.Overlay>
          <Dialog.Content className="dark:border-slate-800">
            <Typography type="h6" className="dark:text-white">Hapus Sekolah</Typography>
            <Typography className="mb-6 mt-2 text-foreground">
              Apakah Anda yakin ingin menghapus sekolah <strong>{currentSchool?.name}</strong>?
            </Typography>
            <div className="mb-1 flex items-center justify-end gap-2">
              <Button variant="ghost" color="secondary" onClick={() => setIsDeleteOpen(false)} className="mr-2">
                Batal
              </Button>
              <Button color="error" onClick={handleDeleteSubmit} disabled={deleteForm.processing}>
                {deleteForm.processing ? "Menghapus..." : "Ya, Hapus"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog>
    </>
  );
}

Index.layout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>;
};
