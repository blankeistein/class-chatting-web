import React, { useState } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link, router } from "@inertiajs/react";
import { Button, Dialog, IconButton, Input, Typography } from "@material-tailwind/react";
import {
  PlusIcon,
  ShieldIcon,
  PencilIcon,
  Trash2Icon,
  SearchIcon,
  EyeIcon,
  UsersIcon,
  LockIcon,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import Pagination from "@/Components/Pagination";
import { PageHeader } from "@/Components/PageHeader";

interface RoleItem {
  id: number;
  name: string;
  guard_name: string;
  permissions_count: number;
  users_count: number;
  created_at: string;
}

interface IndexProps {
  roles: {
    data: RoleItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: any[];
  };
  filters?: {
    search?: string;
    per_page?: number;
  };
}

export default function Index({ roles, filters }: IndexProps) {
  const [search, setSearch] = useState(filters?.search || "");
  const [deleteDialog, setDeleteDialog] = useState<RoleItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get(
      route("admin.roles.index"),
      { search },
      { preserveState: true, replace: true }
    );
  };

  const handleDelete = () => {
    if (!deleteDialog) return;

    setIsDeleting(true);
    router.delete(route("admin.roles.destroy", deleteDialog.id), {
      onSuccess: () => {
        toast.success(`Role ${deleteDialog.name} berhasil dihapus.`);
        setDeleteDialog(null);
      },
      onError: (errors) => {
        const errorMsg = Object.values(errors)[0] as string;
        toast.error(errorMsg || "Gagal menghapus role.");
      },
      onFinish: () => setIsDeleting(false),
    });
  };

  const isProtectedRole = (name: string) =>
    ["Admin", "Developer"].includes(name);

  return (
    <AdminLayout>
      <Head title="Manajemen Role" />
      <Toaster position="top-right" />

      <div className="p-6 space-y-6">
        <PageHeader
          title="Manajemen Role"
          description="Kelola role dan penetapan hak akses dalam sistem"
          actions={
            <Link href={route("admin.roles.create")}>
              <Button size="sm" className="flex items-center gap-2">
                <PlusIcon className="w-4 h-4" />
                Tambah Role
              </Button>
            </Link>
          }
        />

        <div className="bg-surface rounded-2xl border border-surface-border p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <form onSubmit={handleSearch} className="w-full md:w-80">
              <div className="relative">
                <Input
                  placeholder="Cari nama role..."
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

          <div className="overflow-x-auto">
            <table className="w-full min-w-max table-auto text-left">
              <thead>
                <tr className="border-b border-surface-border bg-surface-muted/50">
                  <th className="p-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Nama Role
                  </th>
                  <th className="p-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Jumlah Permission
                  </th>
                  <th className="p-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Pengguna
                  </th>
                  <th className="p-4 text-xs font-semibold text-slate-600 dark:text-slate-400 text-center">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {roles.data.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      Tidak ada role yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  roles.data.map((role) => (
                    <tr
                      key={role.id}
                      className="hover:bg-surface-muted/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <ShieldIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm block">
                              {role.name}
                            </span>
                            {isProtectedRole(role.name) && (
                              <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                                <LockIcon className="w-3 h-3" />
                                <span>Role Sistem Terproteksi</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {role.permissions_count} Permission
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <UsersIcon className="w-4 h-4 text-slate-400" />
                          <span>{role.users_count} Pengguna</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1">
                          <Link href={route("admin.roles.show", role.id)}>
                            <IconButton variant="ghost" size="sm">
                              <EyeIcon className="w-4 h-4 text-blue-500" />
                            </IconButton>
                          </Link>

                          <Link href={route("admin.roles.edit", role.id)}>
                            <IconButton variant="ghost" size="sm">
                              <PencilIcon className="w-4 h-4 text-amber-500" />
                            </IconButton>
                          </Link>

                          {!isProtectedRole(role.name) && (
                            <IconButton
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteDialog(role)}
                            >
                              <Trash2Icon className="w-4 h-4 text-red-500" />
                            </IconButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination paginated={roles} />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
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
              Apakah Anda yakin ingin menghapus role{" "}
              <strong className="text-slate-900 dark:text-white">
                {deleteDialog?.name}
              </strong>
              ? Tindakan ini tidak dapat dibatalkan.
            </Typography>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setDeleteDialog(null)}
                disabled={isDeleting}
              >
                Batal
              </Button>
              <Button
                color="error"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Menghapus..." : "Hapus"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog>
    </AdminLayout>
  );
}
