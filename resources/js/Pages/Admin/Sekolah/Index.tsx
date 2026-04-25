import React, { useState } from "react";
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
  const [currentSchool, setCurrentSchool] = useState<School | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const deleteForm = useForm();

  React.useEffect(() => {
    setSchools(paginatedSchools.data);
    setSelectedIds((currentIds) => currentIds.filter((id) => paginatedSchools.data.some((school) => school.id === id)));
  }, [paginatedSchools.data]);

  const filteredRegencies = filterOptions.regencies.filter((item) => !provinceId || item.province_id === Number(provinceId));
  const filteredDistricts = filterOptions.districts.filter((item) => !regencyId || item.regency_id === Number(regencyId));
  const hasActiveFilters = search !== "" || provinceId !== "" || regencyId !== "" || districtId !== "" || status !== "" || bentukPendidikan !== "";
  const [sortBy, sortDirection] = sort.split("|");


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
            <IconButton variant="outline" color="secondary" onClick={() => router.get(route("admin.schools.import-page"))}>
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
