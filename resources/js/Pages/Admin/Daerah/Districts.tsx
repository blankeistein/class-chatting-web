import React from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import RegionTablePage from "./RegionTablePage";
import { Button, Dialog, IconButton, Input, Select, Typography } from "@material-tailwind/react";
import { router, useForm } from "@inertiajs/react";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

type District = {
  id: number;
  code: string;
  name: string;
  regency?: {
    id: number;
    name: string;
  };
  province?: {
    id: number;
    name: string;
  };
};

export default function Districts({ districts, filters, filterOptions }: { districts: { data: District[] }; filters?: any; filterOptions?: any }) {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingDistrict, setEditingDistrict] = React.useState<District | null>(null);
  const [deletingDistrict, setDeletingDistrict] = React.useState<District | null>(null);
  const [provinceId, setProvinceId] = React.useState(filters?.province_id ? String(filters.province_id) : "");
  const form = useForm({
    regency_id: filters?.regency_id || 0,
    code: "",
    name: "",
  });
  const [editProvinceId, setEditProvinceId] = React.useState("");
  const editForm = useForm({
    regency_id: 0,
    code: "",
    name: "",
    _method: "put",
  });

  const filteredRegencies = (filterOptions?.regencies || []).filter((regency: any) => !provinceId || regency.province_id === Number(provinceId));
  const editFilteredRegencies = (filterOptions?.regencies || []).filter((regency: any) => !editProvinceId || regency.province_id === Number(editProvinceId));

  const closeDialog = () => {
    setIsCreateOpen(false);
    setProvinceId("");
    form.reset();
    form.clearErrors();
  };

  const closeEditDialog = () => {
    setEditingDistrict(null);
    setEditProvinceId("");
    editForm.reset();
    editForm.clearErrors();
  };

  const submit = () => {
    form.post(route("admin.regions.districts.store"), {
      preserveScroll: true,
      onSuccess: () => closeDialog(),
    });
  };

  const openEditDialog = (district: District) => {
    setEditingDistrict(district);
    setEditProvinceId(district.province?.id ? String(district.province.id) : "");
    editForm.setData({
      regency_id: district.regency?.id || 0,
      code: district.code,
      name: district.name,
      _method: "put",
    });
    editForm.clearErrors();
  };

  const submitEdit = () => {
    if (!editingDistrict) {
      return;
    }

    editForm.post(route("admin.regions.districts.update", editingDistrict.code), {
      preserveScroll: true,
      onSuccess: () => closeEditDialog(),
    });
  };

  const deleteDistrict = () => {
    if (!deletingDistrict) {
      return;
    }

    router.delete(route("admin.regions.districts.destroy", deletingDistrict.code), {
      preserveScroll: true,
      onSuccess: () => setDeletingDistrict(null),
    });
  };

  return (
    <>
      <RegionTablePage
        title="Daftar Kecamatan"
        description="Daftar seluruh kecamatan."
        paginated={districts}
        items={districts.data ?? []}
        filters={filters}
        filterOptions={filterOptions}
        routeName="admin.regions.districts.index"
        headings={["No", "Kode", "Nama Daerah", "Kabupaten", "Provinsi", "Aksi"]}
        actions={
          <Button size="sm" className="flex items-center gap-2" onClick={() => setIsCreateOpen(true)}>
            <PlusIcon className="h-4 w-4" />
            Tambah Kecamatan
          </Button>
        }
        renderCells={(district, index) => (
          <>
            <td className="p-4">
              <Typography variant="small" className="text-slate-700 dark:text-slate-200">
                {index + 1}
              </Typography>
            </td>
            <td className="p-4">
              <Typography variant="small" className="text-slate-700 dark:text-slate-200">
                {district.code}
              </Typography>
            </td>
            <td className="p-4">
              <Typography variant="small" className="font-medium text-slate-800 dark:text-slate-100">
                {district.name}
              </Typography>
            </td>
            <td className="p-4">
              <Typography variant="small" className="text-slate-700 dark:text-slate-200">
                {district.regency?.name || "-"}
              </Typography>
            </td>
            <td className="p-4">
              <Typography variant="small" className="text-slate-700 dark:text-slate-200">
                {district.province?.name || "-"}
              </Typography>
            </td>
            <td className="p-4">
              <div className="flex items-center gap-1">
                <IconButton variant="ghost" size="sm" onClick={() => openEditDialog(district)}>
                  <PencilIcon className="h-4 w-4 text-slate-500" />
                </IconButton>
                <IconButton variant="ghost" size="sm" onClick={() => setDeletingDistrict(district)}>
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
            <Typography type="h6">Tambah Kecamatan</Typography>
            <div className="mt-5 space-y-4">
              <div>
                <Typography type="small" className="mb-1 font-semibold dark:text-white">Provinsi</Typography>
                <Select value={provinceId || undefined} onValueChange={(value) => { setProvinceId(value || ""); form.setData("regency_id", 0); }}>
                  <Select.Trigger placeholder="Pilih provinsi" />
                  <Select.List>
                    {(filterOptions?.provinces || []).map((province: any) => <Select.Option key={province.id} value={String(province.id)}>{province.name}</Select.Option>)}
                  </Select.List>
                </Select>
              </div>
              <div>
                <Typography type="small" className="mb-1 font-semibold dark:text-white">Kabupaten/Kota Induk</Typography>
                <Select value={form.data.regency_id ? String(form.data.regency_id) : undefined} onValueChange={(value) => form.setData("regency_id", Number(value) || 0)} disabled={!provinceId}>
                  <Select.Trigger placeholder="Pilih kabupaten/kota" />
                  <Select.List>
                    {filteredRegencies.map((regency: any) => <Select.Option key={regency.id} value={String(regency.id)}>{regency.name}</Select.Option>)}
                  </Select.List>
                </Select>
                {form.errors.regency_id && <Typography type="small" color="error" className="mt-1 block">{form.errors.regency_id}</Typography>}
              </div>
              <div>
                <Typography type="small" className="mb-1 font-semibold dark:text-white">Kode Kecamatan</Typography>
                <Input value={form.data.code} onChange={(event) => form.setData("code", event.target.value)} isError={!!form.errors.code} />
                {form.errors.code && <Typography type="small" color="error" className="mt-1 block">{form.errors.code}</Typography>}
              </div>
              <div>
                <Typography type="small" className="mb-1 font-semibold dark:text-white">Nama Kecamatan</Typography>
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

      <Dialog open={editingDistrict !== null} onOpenChange={closeEditDialog} size="sm">
        <Dialog.Overlay>
          <Dialog.Content>
            <Typography type="h6">Edit Nama Kecamatan</Typography>
            <div className="mt-5 space-y-4">
              <div>
                <Typography type="small" className="mb-1 font-semibold dark:text-white">Provinsi</Typography>
                <Select value={editProvinceId || undefined} onValueChange={(value) => { setEditProvinceId(value || ""); editForm.setData("regency_id", 0); }}>
                  <Select.Trigger placeholder="Pilih provinsi" />
                  <Select.List>
                    {(filterOptions?.provinces || []).map((province: any) => <Select.Option key={province.id} value={String(province.id)}>{province.name}</Select.Option>)}
                  </Select.List>
                </Select>
              </div>
              <div>
                <Typography type="small" className="mb-1 font-semibold dark:text-white">Kabupaten/Kota Induk</Typography>
                <Select value={editForm.data.regency_id ? String(editForm.data.regency_id) : undefined} onValueChange={(value) => editForm.setData("regency_id", Number(value) || 0)} disabled={!editProvinceId}>
                  <Select.Trigger placeholder="Pilih kabupaten/kota" />
                  <Select.List>
                    {editFilteredRegencies.map((regency: any) => <Select.Option key={regency.id} value={String(regency.id)}>{regency.name}</Select.Option>)}
                  </Select.List>
                </Select>
              </div>
              <div>
                <Typography type="small" className="mb-1 font-semibold dark:text-white">Kode Kecamatan</Typography>
                <Input value={editForm.data.code} disabled />
              </div>
              <div>
                <Typography type="small" className="mb-1 font-semibold dark:text-white">Nama Kecamatan</Typography>
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

      <Dialog open={deletingDistrict !== null} onOpenChange={() => setDeletingDistrict(null)} size="sm">
        <Dialog.Overlay>
          <Dialog.Content>
            <Typography type="h6">Hapus Kecamatan</Typography>
            <Typography className="mt-2 text-slate-600 dark:text-slate-300">
              Data <strong>{deletingDistrict?.name}</strong> akan dihapus.
            </Typography>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" color="secondary" onClick={() => setDeletingDistrict(null)}>Batal</Button>
              <Button color="error" onClick={deleteDistrict}>Ya, Hapus</Button>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog>
    </>
  );
}

Districts.layout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>;
};
