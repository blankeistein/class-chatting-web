import React from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import RegionTablePage from "./RegionTablePage";
import { Button, Dialog, IconButton, Input, Typography } from "@material-tailwind/react";
import { router, useForm } from "@inertiajs/react";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

type Province = {
  id: number;
  code: string;
  name: string;
};

export default function Provinces({ provinces, filters }: { provinces: { data: Province[] }; filters?: any }) {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingProvince, setEditingProvince] = React.useState<Province | null>(null);
  const [deletingProvince, setDeletingProvince] = React.useState<Province | null>(null);
  const form = useForm({
    code: "",
    name: "",
  });
  const editForm = useForm({
    code: "",
    name: "",
    _method: "put",
  });

  const closeDialog = () => {
    setIsCreateOpen(false);
    form.reset();
    form.clearErrors();
  };

  const closeEditDialog = () => {
    setEditingProvince(null);
    editForm.reset();
    editForm.clearErrors();
  };

  const submit = () => {
    form.post(route("admin.regions.provinces.store"), {
      preserveScroll: true,
      onSuccess: () => closeDialog(),
    });
  };

  const openEditDialog = (province: Province) => {
    setEditingProvince(province);
    editForm.setData({
      code: province.code,
      name: province.name,
      _method: "put",
    });
    editForm.clearErrors();
  };

  const submitEdit = () => {
    if (!editingProvince) {
      return;
    }

    editForm.post(route("admin.regions.provinces.update", editingProvince.code), {
      preserveScroll: true,
      onSuccess: () => closeEditDialog(),
    });
  };

  const deleteProvince = () => {
    if (!deletingProvince) {
      return;
    }

    router.delete(route("admin.regions.provinces.destroy", deletingProvince.code), {
      preserveScroll: true,
      onSuccess: () => setDeletingProvince(null),
    });
  };

  return (
    <>
      <RegionTablePage
        title="Daftar Provinsi"
        description="Daftar seluruh provinsi."
        paginated={provinces}
        items={provinces.data ?? []}
        filters={filters}
        routeName="admin.regions.provinces.index"
        headings={["No", "Kode", "Nama Daerah", "Aksi"]}
        actions={
          <Button size="sm" className="flex items-center gap-2" onClick={() => setIsCreateOpen(true)}>
            <PlusIcon className="h-4 w-4" />
            Tambah Provinsi
          </Button>
        }
        renderCells={(province, index) => (
          <>
            <td className="p-4">
              <Typography variant="small" className="text-slate-700 dark:text-slate-200">
                {index + 1}
              </Typography>
            </td>
            <td className="p-4">
              <Typography variant="small" className="text-slate-700 dark:text-slate-200">
                {province.code}
              </Typography>
            </td>
            <td className="p-4">
              <Typography variant="small" className="font-medium text-slate-800 dark:text-slate-100">
                {province.name}
              </Typography>
            </td>
            <td className="p-4">
              <div className="flex items-center gap-1">
                <IconButton variant="ghost" size="sm" onClick={() => openEditDialog(province)}>
                  <PencilIcon className="h-4 w-4 text-slate-500" />
                </IconButton>
                <IconButton variant="ghost" size="sm" onClick={() => setDeletingProvince(province)}>
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
            <Typography type="h6">Tambah Provinsi</Typography>
            <div className="mt-5 space-y-4">
              <div>
                <Typography type="small" className="mb-1 font-semibold dark:text-white">Kode Provinsi</Typography>
                <Input value={form.data.code} onChange={(event) => form.setData("code", event.target.value)} isError={!!form.errors.code} />
                {form.errors.code && <Typography type="small" color="error" className="mt-1 block">{form.errors.code}</Typography>}
              </div>
              <div>
                <Typography type="small" className="mb-1 font-semibold dark:text-white">Nama Provinsi</Typography>
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

      <Dialog open={editingProvince !== null} onOpenChange={closeEditDialog} size="sm">
        <Dialog.Overlay>
          <Dialog.Content>
            <Typography type="h6">Edit Nama Provinsi</Typography>
            <div className="mt-5 space-y-4">
              <div>
                <Typography type="small" className="mb-1 font-semibold dark:text-white">Kode Provinsi</Typography>
                <Input value={editForm.data.code} disabled />
              </div>
              <div>
                <Typography type="small" className="mb-1 font-semibold dark:text-white">Nama Provinsi</Typography>
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

      <Dialog open={deletingProvince !== null} onOpenChange={() => setDeletingProvince(null)} size="sm">
        <Dialog.Overlay>
          <Dialog.Content>
            <Typography type="h6">Hapus Provinsi</Typography>
            <Typography className="mt-2 text-slate-600 dark:text-slate-300">
              Data <strong>{deletingProvince?.name}</strong> akan dihapus.
            </Typography>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" color="secondary" onClick={() => setDeletingProvince(null)}>Batal</Button>
              <Button color="error" onClick={deleteProvince}>Ya, Hapus</Button>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog>
    </>
  );
}

Provinces.layout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>;
};
