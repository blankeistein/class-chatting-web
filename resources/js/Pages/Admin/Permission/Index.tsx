import React, { useState } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { Button, Dialog, IconButton, Input, Typography } from "@material-tailwind/react";
import {
  PlusIcon,
  ShieldCheckIcon,
  PencilIcon,
  Trash2Icon,
  SearchIcon,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { PageHeader } from "@/Components/PageHeader";

interface PermissionItem {
  id: number;
  name: string;
  guard_name: string;
  roles_count: number;
  created_at: string;
}

interface IndexProps {
  permissionGroups: Record<string, PermissionItem[]>;
  filters?: {
    search?: string;
  };
  totalCount: number;
}

const MODULE_LABELS: Record<string, string> = {
  users: "Pengguna (Users)",
  books: "Buku",
  videos: "Video",
  "activation-codes": "Kode Aktivasi",
  schools: "Sekolah",
  students: "Murid (Students)",
  teachers: "Guru (Teachers)",
  regions: "Daerah (Wilayah)",
  settings: "Pengaturan Sistem",
  "email-config": "Konfigurasi Email",
  apps: "Aplikasi Terintegrasi",
  roles: "Manajemen Role",
  permissions: "Manajemen Permission",
};

export default function Index({
  permissionGroups,
  filters,
  totalCount,
}: IndexProps) {
  const [search, setSearch] = useState(filters?.search || "");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editDialog, setEditDialog] = useState<PermissionItem | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<PermissionItem | null>(null);

  const createForm = useForm({
    name: "",
  });

  const editForm = useForm({
    name: "",
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get(
      route("admin.permissions.index"),
      { search },
      { preserveState: true, replace: true }
    );
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createForm.post(route("admin.permissions.store"), {
      onSuccess: () => {
        toast.success("Permission berhasil ditambahkan.");
        createForm.reset();
        setIsCreateOpen(false);
      },
      onError: (err) => {
        const errorMsg = Object.values(err)[0] as string;
        toast.error(errorMsg || "Gagal menambahkan permission.");
      },
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDialog) return;

    editForm.put(route("admin.permissions.update", editDialog.id), {
      onSuccess: () => {
        toast.success("Permission berhasil diperbarui.");
        setEditDialog(null);
      },
      onError: (err) => {
        const errorMsg = Object.values(err)[0] as string;
        toast.error(errorMsg || "Gagal memperbarui permission.");
      },
    });
  };

  const handleDelete = () => {
    if (!deleteDialog) return;

    router.delete(route("admin.permissions.destroy", deleteDialog.id), {
      onSuccess: () => {
        toast.success("Permission berhasil dihapus.");
        setDeleteDialog(null);
      },
      onError: (err) => {
        const errorMsg = Object.values(err)[0] as string;
        toast.error(errorMsg || "Gagal menghapus permission.");
      },
    });
  };

  const openEdit = (permission: PermissionItem) => {
    setEditDialog(permission);
    editForm.setData("name", permission.name);
  };

  return (
    <AdminLayout>
      <Head title="Manajemen Permission" />
      <Toaster position="top-right" />

      <div className="p-6 space-y-6">
        <PageHeader
          title="Manajemen Permission"
          description={`Daftar seluruh hak akses modular dalam sistem (${totalCount} permission)`}
          actions={
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Tambah Permission
            </Button>
          }
        />

        <div className="bg-surface rounded-2xl border border-surface-border p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <form onSubmit={handleSearch} className="w-full md:w-80">
              <div className="relative">
                <Input
                  placeholder="Cari nama permission..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <SearchIcon className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            {Object.keys(permissionGroups).length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                Tidak ada permission yang ditemukan.
              </div>
            ) : (
              Object.entries(permissionGroups).map(([moduleKey, permissions]) => (
                <div
                  key={moduleKey}
                  className="p-4 rounded-xl border border-surface-border bg-surface-muted/30"
                >
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-surface-border">
                    <div className="flex items-center gap-2">
                      <ShieldCheckIcon className="w-4 h-4 text-primary" />
                      <span className="font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide text-xs">
                        {MODULE_LABELS[moduleKey] || moduleKey}
                      </span>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {permissions.length} Permission
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {permissions.map((permission) => (
                      <div
                        key={permission.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-surface-border bg-surface hover:shadow-xs transition-shadow"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 truncate block">
                            {permission.name}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                            Dipakai oleh {permission.roles_count} role
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <IconButton
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(permission)}
                          >
                            <PencilIcon className="w-3.5 h-3.5 text-amber-500" />
                          </IconButton>
                          <IconButton
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteDialog(permission)}
                          >
                            <Trash2Icon className="w-3.5 h-3.5 text-red-500" />
                          </IconButton>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Permission Modal */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={() => setIsCreateOpen(false)}
        size="sm"
      >
        <Dialog.Overlay>
          <Dialog.Content className="p-6">
            <Typography type="h6" className="flex items-center gap-2 mb-4 text-slate-800 dark:text-white">
              <PlusIcon className="w-5 h-5 text-primary" />
              Tambah Permission
            </Typography>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nama Permission *
                </label>
                <Input
                  placeholder="modul.aksi (contoh: reports.export)"
                  value={createForm.data.name}
                  onChange={(e) => createForm.setData("name", e.target.value)}
                  isError={!!createForm.errors.name}
                />
                {createForm.errors.name && (
                  <Typography type="small" color="error" className="mt-1 block">
                    {createForm.errors.name}
                  </Typography>
                )}
                <span className="text-slate-500 text-xs block mt-1">
                  Gunakan format titik untuk pengelompokan otomatis (contoh: <code>modul.view</code>, <code>modul.create</code>).
                </span>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={createForm.processing}
                >
                  {createForm.processing ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog>

      {/* Edit Permission Modal */}
      <Dialog
        open={!!editDialog}
        onOpenChange={() => setEditDialog(null)}
        size="sm"
      >
        <Dialog.Overlay>
          <Dialog.Content className="p-6">
            <Typography type="h6" className="flex items-center gap-2 mb-4 text-slate-800 dark:text-white">
              <PencilIcon className="w-5 h-5 text-amber-500" />
              Edit Permission
            </Typography>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nama Permission *
                </label>
                <Input
                  value={editForm.data.name}
                  onChange={(e) => editForm.setData("name", e.target.value)}
                  isError={!!editForm.errors.name}
                />
                {editForm.errors.name && (
                  <Typography type="small" color="error" className="mt-1 block">
                    {editForm.errors.name}
                  </Typography>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setEditDialog(null)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={editForm.processing}
                >
                  {editForm.processing ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog>

      {/* Delete Permission Dialog */}
      <Dialog
        open={!!deleteDialog}
        onOpenChange={() => setDeleteDialog(null)}
        size="sm"
      >
        <Dialog.Overlay>
          <Dialog.Content className="p-6">
            <Typography type="h6" className="text-red-600 flex items-center gap-2 mb-3">
              <Trash2Icon className="w-5 h-5" />
              Konfirmasi Hapus
            </Typography>
            <Typography type="small" className="text-slate-600 dark:text-slate-300 mb-6">
              Apakah Anda yakin ingin menghapus permission{" "}
              <code className="font-bold text-slate-900 dark:text-white">
                {deleteDialog?.name}
              </code>
              ?
            </Typography>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setDeleteDialog(null)}
              >
                Batal
              </Button>
              <Button color="error" type="button" onClick={handleDelete}>
                Hapus
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog>
    </AdminLayout>
  );
}
