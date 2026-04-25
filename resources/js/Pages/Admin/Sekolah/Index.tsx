import React, { useRef, useState } from "react";
import {
  Button,
  Card,
  Dialog,
  IconButton,
  Input,
  Menu,
  Select,
  Typography,
} from "@material-tailwind/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Checkbox from "@/Components/Checkbox";
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
  Filter,
  Search,
  DownloadCloud,
  EyeIcon,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import Pagination from "@/Components/Pagination";

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

type Province = {
  id: number;
  code: string;
  name: string;
};

type Regency = {
  id: number;
  province_id: number;
  code: string;
  name: string;
  type: string | null;
};

type District = {
  id: number;
  regency_id: number;
  code: string;
  name: string;
};

type Filters = {
  search?: string;
  per_page?: number;
  province_id?: number;
  regency_id?: number;
  district_id?: number;
  status?: string;
  bentuk_pendidikan?: string;
  sort_by?: string;
  sort_direction?: string;
};

type FilterOptions = {
  provinces: Province[];
  regencies: Regency[];
  districts: District[];
  bentukPendidikan: string[];
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

export default function Index({ schools: paginatedSchools, filters, filterOptions }: { schools: SchoolsPayload; filters?: Filters; filterOptions: FilterOptions }) {
  const [schools, setSchools] = useState<School[]>(paginatedSchools.data);
  const [search, setSearch] = useState(filters?.search || "");
  const [provinceId, setProvinceId] = useState(filters?.province_id ? String(filters.province_id) : "");
  const [regencyId, setRegencyId] = useState(filters?.regency_id ? String(filters.regency_id) : "");
  const [districtId, setDistrictId] = useState(filters?.district_id ? String(filters.district_id) : "");
  const [status, setStatus] = useState(filters?.status || "");
  const [bentukPendidikan, setBentukPendidikan] = useState(filters?.bentuk_pendidikan || "");
  const [sort, setSort] = useState(`${filters?.sort_by || "name"}|${filters?.sort_direction || "asc"}`);
  const [perPage, setPerPage] = useState(filters?.per_page ? String(filters.per_page) : "20");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isImportDragging, setIsImportDragging] = useState(false);
  const [importPreview, setImportPreview] = useState<CsvPreview | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [currentSchool, setCurrentSchool] = useState<School | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewRequestRef = useRef(0);

  const deleteForm = useForm();
  const importForm = useForm<{ file: File | null }>({
    file: null,
  });

  React.useEffect(() => {
    setSchools(paginatedSchools.data);
    setSelectedIds((currentIds) => currentIds.filter((id) => paginatedSchools.data.some((school) => school.id === id)));
  }, [paginatedSchools.data]);

  const filteredRegencies = filterOptions.regencies.filter((item) => !provinceId || item.province_id === Number(provinceId));
  const filteredDistricts = filterOptions.districts.filter((item) => !regencyId || item.regency_id === Number(regencyId));
  const hasActiveFilters = search !== "" || provinceId !== "" || regencyId !== "" || districtId !== "" || status !== "" || bentukPendidikan !== "";
  const [sortBy, sortDirection] = sort.split("|");

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
    setIsFilterOpen(false);

    router.get(route("admin.schools.index"), {
      search,
      province_id: provinceId,
      regency_id: regencyId,
      district_id: districtId,
      status,
      bentuk_pendidikan: bentukPendidikan,
      sort_by: sortBy,
      sort_direction: sortDirection,
      per_page: perPage,
    }, {
      preserveState: true,
      replace: true,
      only: ["schools", "filters"],
    });
  };

  const resetFilters = () => {
    setSearch("");
    setProvinceId("");
    setRegencyId("");
    setDistrictId("");
    setStatus("");
    setBentukPendidikan("");
    setSort("name|asc");
    setPerPage("20");
    setIsFilterOpen(false);

    router.get(route("admin.schools.index"), { sort_by: "name", sort_direction: "asc", per_page: 20 }, {
      preserveState: true,
      replace: true,
      only: ["schools", "filters"],
    });
  };

  const openDelete = (school: School) => {
    setCurrentSchool(school);
    setIsDeleteOpen(true);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((currentIds) => (currentIds.includes(id) ? currentIds.filter((item) => item !== id) : [...currentIds, id]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === schools.length && schools.length > 0) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(schools.map((school) => school.id));
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

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} sekolah terpilih?`)) {
      return;
    }

    router.delete(route("admin.schools.bulk-delete"), {
      data: { ids: selectedIds },
      preserveScroll: true,
      onSuccess: () => {
        setSelectedIds([]);
        toast.success("Sekolah terpilih berhasil dihapus.");
      },
      onError: () => {
        toast.error("Gagal menghapus sekolah terpilih.");
      },
    });
  };

  const handleBulkExport = () => {
    if (selectedIds.length === 0) {
      toast.error("Pilih minimal satu sekolah untuk export.");
      return;
    }

    window.location.href = route("admin.schools.bulk-export", { ids: selectedIds.join(",") });
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
              className="flex items-center gap-2"
              onClick={() => router.get(route("admin.schools.create"))}
            >
              <PlusIcon className="w-4 h-4" />
              Tambah Sekolah
            </Button>
            <IconButton variant="outline" color="secondary" onClick={() => setIsImportOpen(true)}>
              <UploadCloudIcon className="w-4 h-4" />
            </IconButton>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <Card color="secondary" className="fixed bottom-8 left-1/2 z-30 flex w-[90%] -translate-x-1/2 flex-row items-center justify-between gap-3 p-3 text-white shadow-xl lg:w-[620px]">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedIds.length === schools.length && schools.length > 0}
                onChange={toggleSelectAll}
                color="primary"
              />
              <Typography variant="small" className="font-bold text-white">
                {selectedIds.length} Sekolah Terpilih
              </Typography>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                color="secondary"
                className="flex items-center gap-2 text-white"
                onClick={handleBulkExport}
              >
                <DownloadCloud className="h-4 w-4" />
                Export CSV
              </Button>
              <Button
                size="sm"
                variant="ghost"
                color="error"
                className="flex items-center gap-2"
                onClick={handleBulkDelete}
              >
                <Trash2Icon className="h-4 w-4" />
                Hapus Terpilih
              </Button>
            </div>
          </Card>
        )}

        <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <Card.Body className="p-4 space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="w-full md:w-96">
                <Select value={sort} onValueChange={(value) => setSort(value || "name|asc")}>
                  <Select.Trigger placeholder="Urutkan berdasarkan">
                    {() => {
                      const labels: Record<string, string> = {
                        "created_at|desc": "Terbaru",
                        "created_at|asc": "Terlama",
                        "name|asc": "Nama (A-Z)",
                        "name|desc": "Nama (Z-A)",
                        "npsn|asc": "NPSN (A-Z)",
                        "npsn|desc": "NPSN (Z-A)",
                      };

                      return labels[sort] || "Urutkan berdasarkan";
                    }}
                  </Select.Trigger>
                  <Select.List>
                    <Select.Option value="created_at|desc">Terbaru</Select.Option>
                    <Select.Option value="created_at|asc">Terlama</Select.Option>
                    <Select.Option value="name|asc">Nama (A-Z)</Select.Option>
                    <Select.Option value="name|desc">Nama (Z-A)</Select.Option>
                    <Select.Option value="npsn|asc">NPSN (A-Z)</Select.Option>
                    <Select.Option value="npsn|desc">NPSN (Z-A)</Select.Option>
                  </Select.List>
                </Select>
              </div>

              <div className="w-full md:w-52">
                <Select value={perPage} onValueChange={(value) => setPerPage(value || "20")}>
                  <Select.Trigger placeholder="25 data">
                    {() => `${perPage} data`}
                  </Select.Trigger>
                  <Select.List>
                    <Select.Option value="25">25 data</Select.Option>
                    <Select.Option value="50">50 data</Select.Option>
                    <Select.Option value="100">100 data</Select.Option>
                  </Select.List>
                </Select>
              </div>

              <Input
                placeholder="Cari nama sekolah atau NPSN atau kode sekolah..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleFilter();
                  }
                }}
                className="dark:text-white"
              >
              </Input>
              <IconButton variant="outline" color="secondary" onClick={handleFilter} className="shrink-0">
                <Search className="w-4 h-4" />
              </IconButton>
              <IconButton
                color={hasActiveFilters ? "primary" : "secondary"}
                variant={hasActiveFilters ? "solid" : "outline"}
                onClick={() => setIsFilterOpen(true)}
                className="shrink-0"
              >
                <Filter className="w-4 h-4" />
              </IconButton>
            </div>
          </Card.Body>
        </Card>

        <Pagination paginated={paginatedSchools} />

        {schools.length > 0 ? (
          <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max table-auto text-left">
                <thead>
                  <tr>
                    <th className="w-10 border-y border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-4">
                      <Checkbox
                        checked={selectedIds.length === schools.length && schools.length > 0}
                        onChange={toggleSelectAll}
                        color="primary"
                      />
                    </th>
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
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 ${selectedIds.includes(school.id) ? "bg-blue-50/30 dark:bg-blue-900/10" : ""}`}
                    >
                      <td className="p-4">
                        <Checkbox
                          checked={selectedIds.includes(school.id)}
                          onChange={() => toggleSelect(school.id)}
                          color="primary"
                        />
                      </td>
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
                                onClick={() => router.get(route("admin.schools.show", school.code))}
                              >
                                <EyeIcon className="w-4 h-4" />
                                Lihat Info
                              </Menu.Item>
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

        <Pagination paginated={paginatedSchools} />
      </div>

      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen} size="md">
        <Dialog.Overlay>
          <Dialog.Content className="dark:border-slate-800">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Typography type="h6" className="dark:text-white">
                  Filter Sekolah
                </Typography>
                <Typography className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Pilih wilayah, status, atau bentuk pendidikan untuk menyaring data sekolah.
                </Typography>
              </div>
              <IconButton variant="ghost" color="secondary" onClick={() => setIsFilterOpen(false)}>
                <XIcon className="h-4 w-4" />
              </IconButton>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                value={provinceId}
                onValueChange={(value) => {
                  setProvinceId(value || "");
                  setRegencyId("");
                  setDistrictId("");
                }}
              >
                <Select.Trigger placeholder="Semua provinsi" className="dark:text-white">
                  {() => filterOptions.provinces.find((item) => String(item.id) === provinceId)?.name || "Semua provinsi"}
                </Select.Trigger>
                <Select.List className="overflow-auto">
                  <Select.Option value="">Semua provinsi</Select.Option>
                  {filterOptions.provinces.map((item) => (
                    <Select.Option key={item.id} value={String(item.id)}>
                      {item.code} - {item.name}
                    </Select.Option>
                  ))}
                </Select.List>
              </Select>

              <Select
                value={regencyId}
                onValueChange={(value) => {
                  setRegencyId(value || "");
                  setDistrictId("");
                }}
                disabled={!provinceId}
              >
                <Select.Trigger placeholder="Semua kabupaten/kota" className="dark:text-white">
                  {() => filteredRegencies.find((item) => String(item.id) === regencyId)?.name || "Semua kabupaten/kota"}
                </Select.Trigger>
                <Select.List className="overflow-auto">
                  <Select.Option value="">Semua kabupaten/kota</Select.Option>
                  {filteredRegencies.map((item) => (
                    <Select.Option key={item.id} value={String(item.id)}>
                      {item.code} - {item.name}
                    </Select.Option>
                  ))}
                </Select.List>
              </Select>

              <Select
                value={districtId}
                onValueChange={(value) => setDistrictId(value || "")}
                disabled={!regencyId}
              >
                <Select.Trigger placeholder="Semua kecamatan" className="dark:text-white">
                  {() => filteredDistricts.find((item) => String(item.id) === districtId)?.name || "Semua kecamatan"}
                </Select.Trigger>
                <Select.List className="overflow-auto">
                  <Select.Option value="">Semua kecamatan</Select.Option>
                  {filteredDistricts.map((item) => (
                    <Select.Option key={item.id} value={String(item.id)}>
                      {item.code} - {item.name}
                    </Select.Option>
                  ))}
                </Select.List>
              </Select>

              <Select value={status} onValueChange={(value) => setStatus(value || "")}>
                <Select.Trigger placeholder="Semua status" className="dark:text-white">
                  {() => status || "Semua status"}
                </Select.Trigger>
                <Select.List>
                  <Select.Option value="">Semua status</Select.Option>
                  <Select.Option value="NEGERI">NEGERI</Select.Option>
                  <Select.Option value="SWASTA">SWASTA</Select.Option>
                </Select.List>
              </Select>

              <div className="md:col-span-2">
                <Select value={bentukPendidikan} onValueChange={(value) => setBentukPendidikan(value || "")}>
                  <Select.Trigger placeholder="Semua bentuk pendidikan" className="dark:text-white">
                    {() => bentukPendidikan || "Semua bentuk pendidikan"}
                  </Select.Trigger>
                  <Select.List className="overflow-auto">
                    <Select.Option value="">Semua bentuk pendidikan</Select.Option>
                    {filterOptions.bentukPendidikan.map((item) => (
                      <Select.Option key={item} value={item}>
                        {item}
                      </Select.Option>
                    ))}
                  </Select.List>
                </Select>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                color={hasActiveFilters ? "error" : "secondary"}
                className="flex items-center justify-center gap-2"
                onClick={resetFilters}
                disabled={!hasActiveFilters}
              >
                <XIcon className="h-4 w-4" />
                Reset
              </Button>
              <Button type="button" className="flex items-center justify-center gap-2" onClick={handleFilter}>
                <SearchIcon className="h-4 w-4" />
                Terapkan Filter
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog>

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
