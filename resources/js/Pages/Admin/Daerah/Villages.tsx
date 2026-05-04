import React from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import RegionTablePage from "./RegionTablePage";
import { Button, Dialog, IconButton, Input, Select, Typography } from "@material-tailwind/react";
import { router, useForm } from "@inertiajs/react";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

type Village = {
  id: number;
  code: string;
  name: string;
  district?: {
    id: number;
    name: string;
  };
  regency?: {
    id: number;
    name: string;
  };
  province?: {
    id: number;
    name: string;
  };
};

export default function Villages({ villages, filters, filterOptions }: { villages: { data: Village[] }; filters?: any; filterOptions?: any }) {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingVillage, setEditingVillage] = React.useState<Village | null>(null);
  const [deletingVillage, setDeletingVillage] = React.useState<Village | null>(null);
  const [provinceId, setProvinceId] = React.useState(filters?.province_id ? String(filters.province_id) : "");
  const [regencyId, setRegencyId] = React.useState(filters?.regency_id ? String(filters.regency_id) : "");
  const form = useForm({
    district_id: filters?.district_id || 0,
    code: "",
    name: "",
  });
  const [editProvinceId, setEditProvinceId] = React.useState("");
  const [editRegencyId, setEditRegencyId] = React.useState("");
  const editForm = useForm({
    district_id: 0,
    code: "",
    name: "",
    _method: "put",
  });

  const filteredRegencies = (filterOptions?.regencies || []).filter((regency: any) => !provinceId || regency.province_id === Number(provinceId));
  const filteredDistricts = (filterOptions?.districts || []).filter((district: any) => !regencyId || district.regency_id === Number(regencyId));
  const editFilteredRegencies = (filterOptions?.regencies || []).filter((regency: any) => !editProvinceId || regency.province_id === Number(editProvinceId));
  const editFilteredDistricts = (filterOptions?.districts || []).filter((district: any) => !editRegencyId || district.regency_id === Number(editRegencyId));

  const closeDialog = () => {
    setIsCreateOpen(false);
    setProvinceId("");
    setRegencyId("");
    form.reset();
    form.clearErrors();
  };

  const closeEditDialog = () => {
    setEditingVillage(null);
    setEditProvinceId("");
    setEditRegencyId("");
    editForm.reset();
    editForm.clearErrors();
  };

  const submit = () => {
    form.post(route("admin.regions.villages.store"), {
      preserveScroll: true,
      onSuccess: () => closeDialog(),
    });
  };

  const openEditDialog = (village: Village) => {
    setEditingVillage(village);
    setEditProvinceId(village.province?.id ? String(village.province.id) : "");
    setEditRegencyId(village.regency?.id ? String(village.regency.id) : "");
    editForm.setData({
      district_id: village.district?.id || 0,
      code: village.code,
      name: village.name,
      _method: "put",
    });
    editForm.clearErrors();
  };

  const submitEdit = () => {
    if (!editingVillage) {
      return;
    }

    editForm.post(route("admin.regions.villages.update", editingVillage.code), {
      preserveScroll: true,
      onSuccess: () => closeEditDialog(),
    });
  };

  const deleteVillage = () => {
    if (!deletingVillage) {
      return;
    }

    router.delete(route("admin.regions.villages.destroy", deletingVillage.code), {
      preserveScroll: true,
      onSuccess: () => setDeletingVillage(null),
    });
  };

  return (
    <>
      <RegionTablePage
        title="Daftar Desa"
        description="Daftar seluruh desa dan kelurahan."
        paginated={villages}
        items={villages.data ?? []}
        filters={filters}
        routeName="admin.regions.villages.index"
        filterOptions={filterOptions}
        headings={["No", "Kode", "Nama Daerah", "Kecamatan", "Kabupaten", "Provinsi", "Aksi"]}
        actions={
          <Button size="sm" className="flex items-center gap-2" onClick={() => setIsCreateOpen(true)}>
            <PlusIcon className="h-4 w-4" />
            Tambah Desa
          </Button>
        }
        renderCells={(village, index) => (
          <>
            <td className="p-4">
              <Typography variant="small" className="text-slate-700 dark:text-slate-200">
                {index + 1}
              </Typography>
            </td>
            <td className="p-4">
              <Typography variant="small" className="text-slate-700 dark:text-slate-200">
                {village.code}
              </Typography>
            </td>
            <td className="p-4">
              <Typography variant="small" className="font-medium text-slate-800 dark:text-slate-100">
                {village.name}
              </Typography>
            </td>
            <td className="p-4">
              <Typography variant="small" className="text-slate-700 dark:text-slate-200">
                {village.district?.name || "-"}
              </Typography>
            </td>
            <td className="p-4">
              <Typography variant="small" className="text-slate-700 dark:text-slate-200">
                {village.regency?.name || "-"}
              </Typography>
            </td>
            <td className="p-4">
              <Typography variant="small" className="text-slate-700 dark:text-slate-200">
                {village.province?.name || "-"}
              </Typography>
            </td>
            <td className="p-4">
              <div className="flex items-center gap-1">
                <IconButton variant="ghost" size="sm" onClick={() => openEditDialog(village)}>
                  <PencilIcon className="h-4 w-4 text-slate-500" />
                </IconButton>
                <IconButton variant="ghost" size="sm" onClick={() => setDeletingVillage(village)}>
                  <Trash2Icon className="h-4 w-4 text-red-500" />
                </IconButton>
              </div>
            </td>
          </>
        )}
      />

      <Dialog open={isCreateOpen} onOpenChange={closeDialog} size="sm">
        <Dialog.Overlay>
          <Dialog.Content>
            <Typography type="h6">Tambah Desa</Typography>
            <div className="mt-5 space-y-4">
              <div>
                <Typography type="small" className="mb-1 font-semibold dark:text-white">Provinsi</Typography>
                <Select value={provinceId || undefined} onValueChange={(value) => { setProvinceId(value || ""); setRegencyId(""); form.setData("district_id", 0); }}>
                  <Select.Trigger placeholder="Pilih provinsi" />
                  <Select.List>
                    {(filterOptions?.provinces || []).map((province: any) => <Select.Option key={province.id} value={String(province.id)}>{province.name}</Select.Option>)}
                  </Select.List>
                </Select>
              </div>
              <div>
                <Typography type="small" className="mb-1 font-semibold dark:text-white">Kabupaten/Kota</Typography>
                <Select value={regencyId || undefined} onValueChange={(value) => { setRegencyId(value || ""); form.setData("district_id", 0); }} disabled={!provinceId}>
                  <Select.Trigger placeholder="Pilih kabupaten/kota" />
                  <Select.List>
                    {filteredRegencies.map((regency: any) => <Select.Option key={regency.id} value={String(regency.id)}>{regency.name}</Select.Option>)}
                  </Select.List>
                </Select>
              </div>
              <div>
                <Typography type="small" className="mb-1 font-semibold dark:text-white">Kecamatan</Typography>
                <Select value={form.data.district_id ? String(form.data.district_id) : undefined} onValueChange={(value) => form.setData("district_id", Number(value) || 0)} disabled={!regencyId}>
                  <Select.Trigger placeholder="Pilih kecamatan" />
                  <Select.List>
                    {filteredDistricts.map((district: any) => <Select.Option key={district.id} value={String(district.id)}>{district.name}</Select.Option>)}
                  </Select.List>
                </Select>
                {form.errors.district_id && <Typography type="small" color="error" className="mt-1 block">{form.errors.district_id}</Typography>}
              </div>
              <div>
                <Typography type="small" className="mb-1 font-semibold dark:text-white">Kode Desa</Typography>
                <Input value={form.data.code} onChange={(event) => form.setData("code", event.target.value)} isError={!!form.errors.code} />
                {form.errors.code && <Typography type="small" color="error" className="mt-1 block">{form.errors.code}</Typography>}
              </div>
              <div>
                <Typography type="small" className="mb-1 font-semibold dark:text-white">Nama Desa</Typography>
                <Input value={form.data.name} onChange={(event) => form.setData("name", event.target.value)} isError={!!form.errors.name} />
                {form.errors.name && <Typography type="small" color="error" className="mt-1 block">{form.errors.name}</Typography>}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" color="secondary" onClick={closeDialog}>Batal</Button>
              <Button onClick={submit} disabled={form.processing}>{form.processing ? "Menyimpan..." : "Simpan"}</Button>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog>

      <Dialog open={editingVillage !== null} onOpenChange={closeEditDialog} size="sm">
        <Dialog.Overlay>
          <Dialog.Content>
            <Typography type="h6">Edit Nama Desa</Typography>
            <div className="mt-5 space-y-4">
              <div>
                <Typography type="small" className="mb-1 font-semibold dark:text-white">Provinsi</Typography>
                <Select value={editProvinceId || undefined} onValueChange={(value) => { setEditProvinceId(value || ""); setEditRegencyId(""); editForm.setData("district_id", 0); }}>
                  <Select.Trigger placeholder="Pilih provinsi" />
                  <Select.List>
                    {(filterOptions?.provinces || []).map((province: any) => <Select.Option key={province.id} value={String(province.id)}>{province.name}</Select.Option>)}
                  </Select.List>
                </Select>
              </div>
              <div>
                <Typography type="small" className="mb-1 font-semibold dark:text-white">Kabupaten/Kota</Typography>
                <Select value={editRegencyId || undefined} onValueChange={(value) => { setEditRegencyId(value || ""); editForm.setData("district_id", 0); }} disabled={!editProvinceId}>
                  <Select.Trigger placeholder="Pilih kabupaten/kota" />
                  <Select.List>
                    {editFilteredRegencies.map((regency: any) => <Select.Option key={regency.id} value={String(regency.id)}>{regency.name}</Select.Option>)}
                  </Select.List>
                </Select>
              </div>
              <div>
                <Typography type="small" className="mb-1 font-semibold dark:text-white">Kecamatan</Typography>
                <Select value={editForm.data.district_id ? String(editForm.data.district_id) : undefined} onValueChange={(value) => editForm.setData("district_id", Number(value) || 0)} disabled={!editRegencyId}>
                  <Select.Trigger placeholder="Pilih kecamatan" />
                  <Select.List>
                    {editFilteredDistricts.map((district: any) => <Select.Option key={district.id} value={String(district.id)}>{district.name}</Select.Option>)}
                  </Select.List>
                </Select>
              </div>
              <div>
                <Typography type="small" className="mb-1 font-semibold dark:text-white">Kode Desa</Typography>
                <Input value={editForm.data.code} disabled />
              </div>
              <div>
                <Typography type="small" className="mb-1 font-semibold dark:text-white">Nama Desa</Typography>
                <Input value={editForm.data.name} onChange={(event) => editForm.setData("name", event.target.value)} isError={!!editForm.errors.name} />
                {editForm.errors.name && <Typography type="small" color="error" className="mt-1 block">{editForm.errors.name}</Typography>}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" color="secondary" onClick={closeEditDialog}>Batal</Button>
              <Button onClick={submitEdit} disabled={editForm.processing}>{editForm.processing ? "Menyimpan..." : "Simpan"}</Button>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog>

      <Dialog open={deletingVillage !== null} onOpenChange={() => setDeletingVillage(null)} size="sm">
        <Dialog.Overlay>
          <Dialog.Content>
            <Typography type="h6">Hapus Desa</Typography>
            <Typography className="mt-2 text-slate-600 dark:text-slate-300">
              Data <strong>{deletingVillage?.name}</strong> akan dihapus.
            </Typography>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" color="secondary" onClick={() => setDeletingVillage(null)}>Batal</Button>
              <Button color="error" onClick={deleteVillage}>Ya, Hapus</Button>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog>
    </>
  );
}

Villages.layout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>;
};
