import React, { useState } from "react";
import {
  Button,
  Card,
  Chip,
  Dialog,
  IconButton,
  Input,
  Menu,
  Select,
  Typography,
} from "@material-tailwind/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, useForm } from "@inertiajs/react";
import {
  Building2Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  LandmarkIcon,
  MapIcon,
  MapPinnedIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

type Province = {
  id: number;
  code: string;
  name: string;
  regencies_count?: number;
  districts_count?: number;
};

type Regency = {
  id: number;
  code: string;
  name: string;
  type: string | null;
  districts_count?: number;
  province?: {
    id: number;
    code: string;
    name: string;
  };
};

type District = {
  id: number;
  code: string;
  name: string;
  regency?: {
    id: number;
    code: string;
    name: string;
    type: string | null;
  };
  province?: {
    id: number;
    code: string;
    name: string;
  };
};

type DialogState = {
  entity: "province" | "regency" | "district";
  mode: "create" | "edit" | "delete";
  item?: Province | Regency | District;
} | null;

const TYPE_OPTIONS = [
  { label: "Kabupaten", value: "kabupaten" },
  { label: "Kota", value: "kota" },
];

function StatCard({
  title,
  value,
  caption,
  icon: Icon,
}: {
  title: string;
  value: number;
  caption: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) {
  return (
    <Card className="border border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4 p-5">
        <div>
          <Typography className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</Typography>
          <Typography variant="h3" className="mt-2 font-bold text-slate-900 dark:text-white">{value}</Typography>
          <Typography className="mt-1 text-xs text-slate-400 dark:text-slate-500">{caption}</Typography>
        </div>
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-900/80">
      <Typography className="font-semibold text-slate-700 dark:text-slate-200">{title}</Typography>
      <Typography className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</Typography>
    </div>
  );
}

export default function Index({
  stats,
  provinces,
  regencies,
  districts,
  selectedProvince,
  selectedRegency,
}: {
  stats: { provinces: number; regencies: number; districts: number };
  provinces: { data: Province[] };
  regencies: { data: Regency[] };
  districts: { data: District[] };
  selectedProvince: { id: number; code: string; name: string } | null;
  selectedRegency: { id: number; code: string; name: string; type: string | null } | null;
}) {
  const provinceItems = provinces.data ?? [];
  const regencyItems = regencies.data ?? [];
  const districtItems = districts.data ?? [];

  const [provinceSearch, setProvinceSearch] = useState("");
  const [regencySearch, setRegencySearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");
  const [dialog, setDialog] = useState<DialogState>(null);

  const deferredProvinceSearch = React.useDeferredValue(provinceSearch);
  const deferredRegencySearch = React.useDeferredValue(regencySearch);
  const deferredDistrictSearch = React.useDeferredValue(districtSearch);

  const provinceForm = useForm({
    code: "",
    name: "",
    _method: "post",
  });

  const regencyForm = useForm({
    province_id: selectedProvince?.id ?? 0,
    code: "",
    name: "",
    type: "kabupaten",
    _method: "post",
  });

  const districtForm = useForm({
    regency_id: selectedRegency?.id ?? 0,
    code: "",
    name: "",
    _method: "post",
  });

  const filteredProvinces = provinceItems.filter((province) => {
    const keyword = deferredProvinceSearch.trim().toLowerCase();

    if (!keyword) {
      return true;
    }

    return `${province.code} ${province.name}`.toLowerCase().includes(keyword);
  });

  const filteredRegencies = regencyItems.filter((regency) => {
    const keyword = deferredRegencySearch.trim().toLowerCase();

    if (!keyword) {
      return true;
    }

    return `${regency.code} ${regency.name} ${regency.type ?? ""}`.toLowerCase().includes(keyword);
  });

  const filteredDistricts = districtItems.filter((district) => {
    const keyword = deferredDistrictSearch.trim().toLowerCase();

    if (!keyword) {
      return true;
    }

    return `${district.code} ${district.name}`.toLowerCase().includes(keyword);
  });

  const visitHierarchy = (provinceCode?: string | null, regencyCode?: string | null) => {
    router.get(
      route("admin.regions.index"),
      {
        province: provinceCode || undefined,
        regency: regencyCode || undefined,
      },
      {
        preserveState: true,
        preserveScroll: true,
        replace: true,
        only: ["stats", "provinces", "regencies", "districts", "selectedProvince", "selectedRegency"],
      },
    );
  };

  const closeDialog = () => {
    setDialog(null);
  };

  const openProvinceDialog = (mode: "create" | "edit", province?: Province) => {
    provinceForm.clearErrors();
    provinceForm.setData({
      code: province?.code ?? "",
      name: province?.name ?? "",
      _method: mode === "edit" ? "put" : "post",
    });
    setDialog({ entity: "province", mode, item: province });
  };

  const openRegencyDialog = (mode: "create" | "edit", regency?: Regency) => {
    regencyForm.clearErrors();
    regencyForm.setData({
      province_id: regency?.province?.id ?? selectedProvince?.id ?? 0,
      code: regency?.code ?? "",
      name: regency?.name ?? "",
      type: regency?.type ?? "kabupaten",
      _method: mode === "edit" ? "put" : "post",
    });
    setDialog({ entity: "regency", mode, item: regency });
  };
  const openDistrictDialog = (mode: "create" | "edit", district?: District) => {
    districtForm.clearErrors();
    districtForm.setData({
      regency_id: district?.regency?.id ?? selectedRegency?.id ?? 0,
      code: district?.code ?? "",
      name: district?.name ?? "",
      _method: mode === "edit" ? "put" : "post",
    });
    setDialog({ entity: "district", mode, item: district });
  };

  const openDeleteDialog = (entity: DialogState["entity"], item: Province | Regency | District) => {
    setDialog({ entity, mode: "delete", item });
  };

  const submitProvince = () => {
    const isEdit = dialog?.mode === "edit";
    const target = isEdit
      ? route("admin.regions.provinces.update", (dialog?.item as Province).code)
      : route("admin.regions.provinces.store");

    provinceForm.post(target, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success(isEdit ? "Provinsi diperbarui." : "Provinsi ditambahkan.");
        closeDialog();
      },
      onError: () => toast.error("Simpan provinsi gagal. Periksa kembali form Anda."),
    });
  };

  const submitRegency = () => {
    const isEdit = dialog?.mode === "edit";
    const target = isEdit
      ? route("admin.regions.regencies.update", (dialog?.item as Regency).code)
      : route("admin.regions.regencies.store");

    regencyForm.post(target, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success(isEdit ? "Kabupaten atau kota diperbarui." : "Kabupaten atau kota ditambahkan.");
        closeDialog();
      },
      onError: () => toast.error("Simpan kabupaten atau kota gagal. Periksa kembali form Anda."),
    });
  };

  const submitDistrict = () => {
    const isEdit = dialog?.mode === "edit";
    const target = isEdit
      ? route("admin.regions.districts.update", (dialog?.item as District).code)
      : route("admin.regions.districts.store");

    districtForm.post(target, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success(isEdit ? "Kecamatan diperbarui." : "Kecamatan ditambahkan.");
        closeDialog();
      },
      onError: () => toast.error("Simpan kecamatan gagal. Periksa kembali form Anda."),
    });
  };

  const deleteCurrentItem = () => {
    if (!dialog?.item || dialog.mode !== "delete") {
      return;
    }

    const routeMap = {
      province: route("admin.regions.provinces.destroy", (dialog.item as Province).code),
      regency: route("admin.regions.regencies.destroy", (dialog.item as Regency).code),
      district: route("admin.regions.districts.destroy", (dialog.item as District).code),
    };

    router.delete(routeMap[dialog.entity], {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Data daerah berhasil dihapus.");
        closeDialog();
      },
      onError: () => toast.error("Hapus data daerah gagal."),
    });
  };

  return (
    <>
      <Head title="Manajemen Daerah" />
      <Toaster position="top-center" />

      <div className="space-y-6 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Typography variant="h4" className="font-bold text-slate-900 dark:text-white">
              Manajemen Daerah
            </Typography>
            <Typography className="mt-1 text-slate-500 dark:text-slate-400">
              Kelola hierarki provinsi, kabupaten atau kota, dan kecamatan dari satu dashboard.
            </Typography>
          </div>
          <Menu placement="bottom-end">
            <Menu.Trigger
              as={Button}
              size="sm"
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Tambah Daerah
              <ChevronDownIcon className="h-4 w-4" />
            </Menu.Trigger>
            <Menu.Content className="z-20 min-w-[220px] border-none shadow-xl dark:bg-slate-900">
              <Menu.Item className="flex items-center gap-2 dark:hover:bg-slate-800" onClick={() => openProvinceDialog("create")}>
                <LandmarkIcon className="h-4 w-4" />
                Tambah Provinsi
              </Menu.Item>
              <Menu.Item
                className={`flex items-center gap-2 dark:hover:bg-slate-800 ${!selectedProvince ? "pointer-events-none opacity-50" : ""}`}
                onClick={() => selectedProvince && openRegencyDialog("create")}
              >
                <Building2Icon className="h-4 w-4" />
                Tambah Kabupaten/Kota
              </Menu.Item>
              <Menu.Item
                className={`flex items-center gap-2 dark:hover:bg-slate-800 ${!selectedRegency ? "pointer-events-none opacity-50" : ""}`}
                onClick={() => selectedRegency && openDistrictDialog("create")}
              >
                <MapPinnedIcon className="h-4 w-4" />
                Tambah Kecamatan
              </Menu.Item>
            </Menu.Content>
          </Menu>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard title="Provinsi" value={stats.provinces} caption="Level administratif tertinggi" icon={LandmarkIcon} />
          <StatCard title="Kabupaten/Kota" value={stats.regencies} caption="Turunan aktif dari seluruh provinsi" icon={Building2Icon} />
          <StatCard title="Kecamatan" value={stats.districts} caption="Unit layanan yang paling sering diakses" icon={MapPinnedIcon} />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 p-5 dark:border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Typography variant="h6" className="font-bold text-slate-900 dark:text-white">Provinsi</Typography>
                  <Typography className="mt-1 text-sm text-slate-500 dark:text-slate-400">Pilih provinsi untuk membuka turunan wilayah.</Typography>
                </div>
              </div>
              <div className="mt-4">
                <Input value={provinceSearch} onChange={(event) => setProvinceSearch(event.target.value)} placeholder="Cari provinsi..." className="dark:text-white">
                  <Input.Icon><SearchIcon className="h-4 w-4" /></Input.Icon>
                </Input>
              </div>
            </div>
            <div className="max-h-[560px] space-y-3 overflow-auto p-4">
              {filteredProvinces.length > 0 ? filteredProvinces.map((province) => {
                const active = province.code === selectedProvince?.code;

                return (
                  <button
                    key={province.code}
                    type="button"
                    onClick={() => visitHierarchy(province.code, undefined)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${active ? "border-primary bg-primary/5" : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Typography className="font-semibold text-slate-900 dark:text-white">{province.name}</Typography>
                        <Typography className="mt-1 text-xs text-slate-500 dark:text-slate-400">Kode {province.code}</Typography>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Chip size="sm" variant="ghost" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"><Chip.Label>{province.regencies_count ?? 0} kab/kota</Chip.Label></Chip>
                          <Chip size="sm" variant="ghost" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"><Chip.Label>{province.districts_count ?? 0} kecamatan</Chip.Label></Chip>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <IconButton variant="ghost" size="sm" onClick={(event) => { event.stopPropagation(); openProvinceDialog("edit", province); }}>
                          <PencilIcon className="h-4 w-4 text-slate-500" />
                        </IconButton>
                        <IconButton variant="ghost" size="sm" onClick={(event) => { event.stopPropagation(); openDeleteDialog("province", province); }}>
                          <Trash2Icon className="h-4 w-4 text-red-500" />
                        </IconButton>
                        <ChevronRightIcon className={`h-4 w-4 ${active ? "text-primary" : "text-slate-400"}`} />
                      </div>
                    </div>
                  </button>
                );
              }) : <EmptyState title="Provinsi tidak ditemukan" description="Coba ubah kata kunci pencarian Anda." />}
            </div>
          </Card>
          <Card className="border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 p-5 dark:border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Typography variant="h6" className="font-bold text-slate-900 dark:text-white">Kabupaten / Kota</Typography>
                  <Typography className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {selectedProvince ? `Turunan dari ${selectedProvince.name}.` : "Pilih provinsi lebih dulu."}
                  </Typography>
                </div>
              </div>
              <div className="mt-4">
                <Input value={regencySearch} onChange={(event) => setRegencySearch(event.target.value)} placeholder="Cari kabupaten/kota..." disabled={!selectedProvince} className="dark:text-white">
                  <Input.Icon><SearchIcon className="h-4 w-4" /></Input.Icon>
                </Input>
              </div>
            </div>
            <div className="max-h-[560px] space-y-3 overflow-auto p-4">
              {selectedProvince ? (filteredRegencies.length > 0 ? filteredRegencies.map((regency) => {
                const active = regency.code === selectedRegency?.code;

                return (
                  <button
                    key={regency.code}
                    type="button"
                    onClick={() => visitHierarchy(selectedProvince.code, regency.code)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${active ? "border-primary bg-primary/5" : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Typography className="font-semibold text-slate-900 dark:text-white">{regency.name}</Typography>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <Typography className="text-xs text-slate-500 dark:text-slate-400">Kode {regency.code}</Typography>
                          {regency.type && (
                            <Chip size="sm" variant="ghost" className="bg-slate-100 text-slate-700 capitalize dark:bg-slate-800 dark:text-slate-200">
                              <Chip.Label>{regency.type}</Chip.Label>
                            </Chip>
                          )}
                        </div>
                        <div className="mt-3">
                          <Chip size="sm" variant="ghost" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            <Chip.Label>{regency.districts_count ?? 0} kecamatan</Chip.Label>
                          </Chip>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <IconButton variant="ghost" size="sm" onClick={(event) => { event.stopPropagation(); openRegencyDialog("edit", regency); }}>
                          <PencilIcon className="h-4 w-4 text-slate-500" />
                        </IconButton>
                        <IconButton variant="ghost" size="sm" onClick={(event) => { event.stopPropagation(); openDeleteDialog("regency", regency); }}>
                          <Trash2Icon className="h-4 w-4 text-red-500" />
                        </IconButton>
                        <ChevronRightIcon className={`h-4 w-4 ${active ? "text-primary" : "text-slate-400"}`} />
                      </div>
                    </div>
                  </button>
                );
              }) : <EmptyState title="Kabupaten/kota tidak ditemukan" description="Tambahkan data baru atau ganti kata kunci pencarian." />) : <EmptyState title="Belum ada provinsi terpilih" description="Klik salah satu provinsi untuk memuat kabupaten atau kota." />}
            </div>
          </Card>

          <Card className="border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 p-5 dark:border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Typography variant="h6" className="font-bold text-slate-900 dark:text-white">Kecamatan</Typography>
                  <Typography className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {selectedRegency ? `Turunan dari ${selectedRegency.name}.` : "Pilih kabupaten atau kota lebih dulu."}
                  </Typography>
                </div>
              </div>
              <div className="mt-4">
                <Input value={districtSearch} onChange={(event) => setDistrictSearch(event.target.value)} placeholder="Cari kecamatan..." disabled={!selectedRegency} className="dark:text-white">
                  <Input.Icon><SearchIcon className="h-4 w-4" /></Input.Icon>
                </Input>
              </div>
            </div>
            <div className="max-h-[560px] space-y-3 overflow-auto p-4">
              {selectedRegency ? (filteredDistricts.length > 0 ? filteredDistricts.map((district) => (
                <div key={district.code} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Typography className="font-semibold text-slate-900 dark:text-white">{district.name}</Typography>
                      <Typography className="mt-1 text-xs text-slate-500 dark:text-slate-400">Kode {district.code}</Typography>
                      <Typography className="mt-3 text-xs text-slate-400 dark:text-slate-500">{selectedProvince?.name} / {selectedRegency.name}</Typography>
                    </div>
                    <div className="flex items-center gap-1">
                      <IconButton variant="ghost" size="sm" onClick={() => openDistrictDialog("edit", district)}>
                        <PencilIcon className="h-4 w-4 text-slate-500" />
                      </IconButton>
                      <IconButton variant="ghost" size="sm" onClick={() => openDeleteDialog("district", district)}>
                        <Trash2Icon className="h-4 w-4 text-red-500" />
                      </IconButton>
                    </div>
                  </div>
                </div>
              )) : <EmptyState title="Kecamatan tidak ditemukan" description="Tambahkan data baru atau ganti kata kunci pencarian." />) : <EmptyState title="Belum ada kabupaten/kota terpilih" description="Klik salah satu kabupaten atau kota untuk memuat kecamatannya." />}
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={dialog?.entity === "province" && dialog.mode !== "delete"} onOpenChange={closeDialog} size="sm">
        <Dialog.Overlay>
          <Dialog.Content className="dark:border-slate-800 dark:bg-slate-900">
            <Typography type="h6" className="dark:text-white">{dialog?.mode === "edit" ? "Edit Provinsi" : "Tambah Provinsi"}</Typography>
            <div className="mt-5 space-y-4">
              <div>
                <Typography type="small" className="mb-1 font-semibold dark:text-white">Kode Provinsi</Typography>
                <Input value={provinceForm.data.code} onChange={(event) => provinceForm.setData("code", event.target.value)} placeholder="Contoh: 31" isError={!!provinceForm.errors.code} className="dark:text-white" />
                {provinceForm.errors.code && <Typography type="small" color="error" className="mt-1 block">{provinceForm.errors.code}</Typography>}
              </div>
              <div>
                <Typography type="small" className="mb-1 font-semibold dark:text-white">Nama Provinsi</Typography>
                <Input value={provinceForm.data.name} onChange={(event) => provinceForm.setData("name", event.target.value)} placeholder="Contoh: DKI Jakarta" isError={!!provinceForm.errors.name} className="dark:text-white" />
                {provinceForm.errors.name && <Typography type="small" color="error" className="mt-1 block">{provinceForm.errors.name}</Typography>}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" color="secondary" onClick={closeDialog}>Batal</Button>
              <Button onClick={submitProvince} disabled={provinceForm.processing}>{provinceForm.processing ? "Menyimpan..." : "Simpan"}</Button>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog>

      <Dialog open={dialog?.entity === "regency" && dialog.mode !== "delete"} onOpenChange={closeDialog} size="sm">
        <Dialog.Overlay>
          <Dialog.Content className="dark:border-slate-800 dark:bg-slate-900">
            <Typography type="h6" className="dark:text-white">{dialog?.mode === "edit" ? "Edit Kabupaten/Kota" : "Tambah Kabupaten/Kota"}</Typography>
            <div className="mt-5 space-y-4">
              <div>
                <Typography type="small" className="mb-1 font-semibold dark:text-white">Provinsi Induk</Typography>
                <Select value={regencyForm.data.province_id ? String(regencyForm.data.province_id) : undefined} onValueChange={(value) => regencyForm.setData("province_id", Number(value) || 0)}>
                  <Select.Trigger className="dark:text-white" placeholder="Pilih provinsi" />
                  <Select.List>
                    {provinceItems.map((province) => <Select.Option key={province.id} value={String(province.id)}>{province.name}</Select.Option>)}
                  </Select.List>
                </Select>
                {regencyForm.errors.province_id && <Typography type="small" color="error" className="mt-1 block">{regencyForm.errors.province_id}</Typography>}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Typography type="small" className="mb-1 font-semibold dark:text-white">Kode</Typography>
                  <Input value={regencyForm.data.code} onChange={(event) => regencyForm.setData("code", event.target.value)} placeholder="Contoh: 3171" isError={!!regencyForm.errors.code} className="dark:text-white" />
                  {regencyForm.errors.code && <Typography type="small" color="error" className="mt-1 block">{regencyForm.errors.code}</Typography>}
                </div>
                <div>
                  <Typography type="small" className="mb-1 font-semibold dark:text-white">Tipe</Typography>
                  <Select value={regencyForm.data.type || undefined} onValueChange={(value) => regencyForm.setData("type", value || "kabupaten")}>
                    <Select.Trigger className="dark:text-white" placeholder="Pilih tipe" />
                    <Select.List>
                      {TYPE_OPTIONS.map((option) => <Select.Option key={option.value} value={option.value}>{option.label}</Select.Option>)}
                    </Select.List>
                  </Select>
                  {regencyForm.errors.type && <Typography type="small" color="error" className="mt-1 block">{regencyForm.errors.type}</Typography>}
                </div>
              </div>
              <div>
                <Typography type="small" className="mb-1 font-semibold dark:text-white">Nama Kabupaten/Kota</Typography>
                <Input value={regencyForm.data.name} onChange={(event) => regencyForm.setData("name", event.target.value)} placeholder="Contoh: Jakarta Selatan" isError={!!regencyForm.errors.name} className="dark:text-white" />
                {regencyForm.errors.name && <Typography type="small" color="error" className="mt-1 block">{regencyForm.errors.name}</Typography>}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" color="secondary" onClick={closeDialog}>Batal</Button>
              <Button onClick={submitRegency} disabled={regencyForm.processing}>{regencyForm.processing ? "Menyimpan..." : "Simpan"}</Button>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog>
      <Dialog open={dialog?.entity === "district" && dialog.mode !== "delete"} onOpenChange={closeDialog} size="sm">
        <Dialog.Overlay>
          <Dialog.Content className="dark:border-slate-800 dark:bg-slate-900">
            <Typography type="h6" className="dark:text-white">{dialog?.mode === "edit" ? "Edit Kecamatan" : "Tambah Kecamatan"}</Typography>
            <div className="mt-5 space-y-4">
              <div>
                <Typography type="small" className="mb-1 font-semibold dark:text-white">Kabupaten/Kota Induk</Typography>
                <Select value={districtForm.data.regency_id ? String(districtForm.data.regency_id) : undefined} onValueChange={(value) => districtForm.setData("regency_id", Number(value) || 0)}>
                  <Select.Trigger className="dark:text-white" placeholder="Pilih kabupaten/kota" />
                  <Select.List>
                    {regencyItems.map((regency) => <Select.Option key={regency.id} value={String(regency.id)}>{regency.name}</Select.Option>)}
                  </Select.List>
                </Select>
                {districtForm.errors.regency_id && <Typography type="small" color="error" className="mt-1 block">{districtForm.errors.regency_id}</Typography>}
              </div>
              <div>
                <Typography type="small" className="mb-1 font-semibold dark:text-white">Kode Kecamatan</Typography>
                <Input value={districtForm.data.code} onChange={(event) => districtForm.setData("code", event.target.value)} placeholder="Contoh: 3171010" isError={!!districtForm.errors.code} className="dark:text-white" />
                {districtForm.errors.code && <Typography type="small" color="error" className="mt-1 block">{districtForm.errors.code}</Typography>}
              </div>
              <div>
                <Typography type="small" className="mb-1 font-semibold dark:text-white">Nama Kecamatan</Typography>
                <Input value={districtForm.data.name} onChange={(event) => districtForm.setData("name", event.target.value)} placeholder="Contoh: Kebayoran Baru" isError={!!districtForm.errors.name} className="dark:text-white" />
                {districtForm.errors.name && <Typography type="small" color="error" className="mt-1 block">{districtForm.errors.name}</Typography>}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" color="secondary" onClick={closeDialog}>Batal</Button>
              <Button onClick={submitDistrict} disabled={districtForm.processing}>{districtForm.processing ? "Menyimpan..." : "Simpan"}</Button>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog>

      <Dialog open={dialog?.mode === "delete"} onOpenChange={closeDialog} size="sm">
        <Dialog.Overlay>
          <Dialog.Content className="dark:border-slate-800 dark:bg-slate-900">
            <Typography type="h6" className="dark:text-white">Hapus Data Daerah</Typography>
            <Typography className="mt-2 text-slate-600 dark:text-slate-300">
              Data <strong>{dialog?.item?.name as string}</strong> akan dihapus beserta turunan yang terkait jika ada. Tindakan ini tidak dapat dibatalkan.
            </Typography>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" color="secondary" onClick={closeDialog}>Batal</Button>
              <Button color="error" onClick={deleteCurrentItem}>Ya, Hapus</Button>
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


