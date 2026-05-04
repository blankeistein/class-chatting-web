import React from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import RegionTablePage from "./RegionTablePage";
import { Button, Dialog, IconButton, Input, Select, Typography } from "@material-tailwind/react";
import { router, useForm } from "@inertiajs/react";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

type Regency = {
  id: number;
  code: string;
  name: string;
  type?: string | null;
  province?: {
    id: number;
    name: string;
  };
};

export default function Regencies({ regencies, filters, filterOptions }: { regencies: { data: Regency[] }; filters?: any; filterOptions?: any }) {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingRegency, setEditingRegency] = React.useState<Regency | null>(null);
  const [deletingRegency, setDeletingRegency] = React.useState<Regency | null>(null);
  const form = useForm({
    province_id: filters?.province_id || 0,
    code: "",
    name: "",
    type: "kabupaten",
  });
  const editForm = useForm({
    province_id: 0,
    code: "",
    name: "",
    type: "kabupaten",
    _method: "put",
  });

  const closeDialog = () => {
    setIsCreateOpen(false);
    form.reset();
    form.clearErrors();
  };

  const closeEditDialog = () => {
    setEditingRegency(null);
    editForm.reset();
    editForm.clearErrors();
  };

  const submit = () => {
    form.post(route("admin.regions.regencies.store"), {
      preserveScroll: true,
      onSuccess: () => closeDialog(),
    });
  };

  const openEditDialog = (regency: Regency) => {
    setEditingRegency(regency);
    editForm.setData({
      province_id: regency.province?.id || 0,
      code: regency.code,
      name: regency.name,
      type: regency.type || "kabupaten",
      _method: "put",
    });
    editForm.clearErrors();
  };

  const submitEdit = () => {
    if (!editingRegency) {
      return;
    }

    editForm.post(route("admin.regions.regencies.update", editingRegency.code), {
      preserveScroll: true,
      onSuccess: () => closeEditDialog(),
    });
  };

  const deleteRegency = () => {
    if (!deletingRegency) {
      return;
    }

    router.delete(route("admin.regions.regencies.destroy", deletingRegency.code), {
      preserveScroll: true,
      onSuccess: () => setDeletingRegency(null),
    });
  };

  return (
    <>
      <RegionTablePage
        title="Daftar Kabupaten"
        description="Daftar seluruh kabupaten dan kota."
        paginated={regencies}
        items={regencies.data ?? []}
        filters={filters}
        routeName="admin.regions.regencies.index"
        filterOptions={filterOptions}
        headings={["No", "Kode", "Nama Daerah", "Provinsi", "Aksi"]}
        actions={
          <Button size="sm" className="flex items-center gap-2" onClick={() => setIsCreateOpen(true)}>
            <PlusIcon className="h-4 w-4" />
            Tambah Kabupaten
          </Button>
        }
        renderCells={(regency, index) => (
          <>
            <td className="p-4">
              <Typography variant="small" className="text-slate-700 dark:text-slate-200">
                {index + 1}
              </Typography>
            </td>
            <td className="p-4">
              <Typography variant="small" className="text-slate-700 dark:text-slate-200">
                {regency.code}
              </Typography>
            </td>
            <td className="p-4">
              <Typography variant="small" className="font-medium text-slate-800 dark:text-slate-100">
                {regency.name}
              </Typography>
            </td>
            <td className="p-4">
              <Typography variant="small" className="text-slate-700 dark:text-slate-200">
                {regency.province?.name || "-"}
              </Typography>
            </td>
            <td className="p-4">
              <div className="flex items-center gap-1">
                <IconButton variant="ghost" size="sm" onClick={() => openEditDialog(regency)}>
                  <PencilIcon className="h-4 w-4 text-slate-500" />
                </IconButton>
                <IconButton variant="ghost" size="sm" onClick={() => setDeletingRegency(regency)}>
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
            <Typography type="h6">Tambah Kabupaten/Kota</Typography>
            <div className="mt-5 space-y-4">
              <div>
                <Typography type="small" className="mb-1 font-semibold dark:text-white">Provinsi Induk</Typography>
                <Select value={form.data.province_id ? String(form.data.province_id) : undefined} onValueChange={(value) => form.setData("province_id", Number(value) || 0)}>
                  <Select.Trigger placeholder="Pilih provinsi" />
                  <Select.List>
                    {(filterOptions?.provinces || []).map((province: any) => <Select.Option key={province.id} value={String(province.id)}>{province.name}</Select.Option>)}
                  </Select.List>
                </Select>
                {form.errors.province_id && <Typography type="small" color="error" className="mt-1 block">{form.errors.province_id}</Typography>}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Typography type="small" className="mb-1 font-semibold dark:text-white">Kode</Typography>
                  <Input value={form.data.code} onChange={(event) => form.setData("code", event.target.value)} isError={!!form.errors.code} />
                  {form.errors.code && <Typography type="small" color="error" className="mt-1 block">{form.errors.code}</Typography>}
                </div>
                <div>
                  <Typography type="small" className="mb-1 font-semibold dark:text-white">Tipe</Typography>
                  <Select value={form.data.type || undefined} onValueChange={(value) => form.setData("type", value || "kabupaten")}>
                    <Select.Trigger placeholder="Pilih tipe" />
                    <Select.List>
                      <Select.Option value="kabupaten">Kabupaten</Select.Option>
                      <Select.Option value="kota">Kota</Select.Option>
                    </Select.List>
                  </Select>
                  {form.errors.type && <Typography type="small" color="error" className="mt-1 block">{form.errors.type}</Typography>}
                </div>
              </div>
              <div>
                <Typography type="small" className="mb-1 font-semibold dark:text-white">Nama Kabupaten/Kota</Typography>
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

      <Dialog open={editingRegency !== null} onOpenChange={closeEditDialog} size="sm">
        <Dialog.Overlay>
          <Dialog.Content>
            <Typography type="h6">Edit Nama Kabupaten/Kota</Typography>
            <div className="mt-5 space-y-4">
              <div>
                <Typography type="small" className="mb-1 font-semibold dark:text-white">Provinsi Induk</Typography>
                <Select value={editForm.data.province_id ? String(editForm.data.province_id) : undefined} onValueChange={(value) => editForm.setData("province_id", Number(value) || 0)}>
                  <Select.Trigger placeholder="Pilih provinsi" />
                  <Select.List>
                    {(filterOptions?.provinces || []).map((province: any) => <Select.Option key={province.id} value={String(province.id)}>{province.name}</Select.Option>)}
                  </Select.List>
                </Select>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Typography type="small" className="mb-1 font-semibold dark:text-white">Kode</Typography>
                  <Input value={editForm.data.code} disabled />
                </div>
                <div>
                  <Typography type="small" className="mb-1 font-semibold dark:text-white">Tipe</Typography>
                  <Select value={editForm.data.type || undefined} onValueChange={(value) => editForm.setData("type", value || "kabupaten")}>
                    <Select.Trigger placeholder="Pilih tipe" />
                    <Select.List>
                      <Select.Option value="kabupaten">Kabupaten</Select.Option>
                      <Select.Option value="kota">Kota</Select.Option>
                    </Select.List>
                  </Select>
                </div>
              </div>
              <div>
                <Typography type="small" className="mb-1 font-semibold dark:text-white">Nama Kabupaten/Kota</Typography>
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

      <Dialog open={deletingRegency !== null} onOpenChange={() => setDeletingRegency(null)} size="sm">
        <Dialog.Overlay>
          <Dialog.Content>
            <Typography type="h6">Hapus Kabupaten/Kota</Typography>
            <Typography className="mt-2 text-slate-600 dark:text-slate-300">
              Data <strong>{deletingRegency?.name}</strong> akan dihapus.
            </Typography>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" color="secondary" onClick={() => setDeletingRegency(null)}>Batal</Button>
              <Button color="error" onClick={deleteRegency}>Ya, Hapus</Button>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog>
    </>
  );
}

Regencies.layout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>;
};
