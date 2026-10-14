import React from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { Button, Input, Typography } from "@material-tailwind/react";
import { ArrowLeftIcon, ShieldIcon, CheckSquareIcon, SquareIcon } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { PageHeader } from "@/Components/PageHeader";

interface PermissionItem {
  id: number;
  name: string;
}

interface CreateProps {
  permissionGroups: Record<string, PermissionItem[]>;
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

export default function Create({ permissionGroups }: CreateProps) {
  const { data, setData, post, processing, errors } = useForm<{
    name: string;
    permissions: string[];
  }>({
    name: "",
    permissions: [],
  });

  const allPermissionNames = Object.values(permissionGroups)
    .flat()
    .map((p) => p.name);

  const isAllSelected =
    allPermissionNames.length > 0 &&
    allPermissionNames.every((name) => data.permissions.includes(name));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setData("permissions", []);
    } else {
      setData("permissions", [...allPermissionNames]);
    }
  };

  const toggleModulePermissions = (moduleName: string) => {
    const modulePermissions = permissionGroups[moduleName].map((p) => p.name);
    const isModuleAllSelected = modulePermissions.every((name) =>
      data.permissions.includes(name)
    );

    if (isModuleAllSelected) {
      setData(
        "permissions",
        data.permissions.filter((name) => !modulePermissions.includes(name))
      );
    } else {
      const merged = Array.from(
        new Set([...data.permissions, ...modulePermissions])
      );
      setData("permissions", merged);
    }
  };

  const toggleSinglePermission = (permissionName: string) => {
    if (data.permissions.includes(permissionName)) {
      setData(
        "permissions",
        data.permissions.filter((name) => name !== permissionName)
      );
    } else {
      setData("permissions", [...data.permissions, permissionName]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route("admin.roles.store"), {
      onError: (err) => {
        const firstError = Object.values(err)[0] as string;
        toast.error(firstError || "Gagal membuat role.");
      },
    });
  };

  return (
    <AdminLayout>
      <Head title="Tambah Role Baru" />
      <Toaster position="top-right" />

      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <PageHeader
          title="Tambah Role Baru"
          description="Buat role baru dan tentukan daftar hak akses (permissions)"
          backAction={
            <Link href={route("admin.roles.index")}>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <ArrowLeftIcon className="w-4 h-4" />
                Kembali
              </Button>
            </Link>
          }
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-surface rounded-2xl border border-surface-border p-6 shadow-xs">
            <Typography type="h6" className="mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
              <ShieldIcon className="w-5 h-5 text-primary" />
              Informasi Role
            </Typography>

            <div className="max-w-md">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nama Role *
              </label>
              <Input
                placeholder="Contoh: Editor Konten, Pengawas Sekolah"
                value={data.name}
                onChange={(e) => setData("name", e.target.value)}
                isError={!!errors.name}
              />
              {errors.name && (
                <Typography type="small" color="error" className="mt-1 block">
                  {errors.name}
                </Typography>
              )}
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-surface-border p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-surface-border">
              <div>
                <Typography type="h6" className="text-slate-800 dark:text-white">
                  Hak Akses (Permissions)
                </Typography>
                <Typography type="small" className="text-slate-500">
                  Pilih kemampuan apa saja yang dimiliki oleh pengguna dengan role ini ({data.permissions.length} dipilih)
                </Typography>
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={toggleSelectAll}
                className="flex items-center gap-2 w-fit"
              >
                {isAllSelected ? (
                  <>
                    <SquareIcon className="w-4 h-4" />
                    Batal Pilih Semua
                  </>
                ) : (
                  <>
                    <CheckSquareIcon className="w-4 h-4" />
                    Pilih Semua Permission
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-6">
              {Object.entries(permissionGroups).map(([moduleKey, permissions]) => {
                const modulePermissions = permissions.map((p) => p.name);
                const isModuleAllSelected = modulePermissions.every((name) =>
                  data.permissions.includes(name)
                );
                const selectedCount = modulePermissions.filter((name) =>
                  data.permissions.includes(name)
                ).length;

                return (
                  <div
                    key={moduleKey}
                    className="p-4 rounded-xl border border-surface-border bg-surface-muted/30"
                  >
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-surface-border">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wide text-xs">
                          {MODULE_LABELS[moduleKey] || moduleKey}
                        </span>
                        <span className="text-xs text-slate-500 font-normal">
                          ({selectedCount}/{permissions.length})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleModulePermissions(moduleKey)}
                        className="text-xs text-primary hover:underline font-medium cursor-pointer"
                      >
                        {isModuleAllSelected ? "Batal Semua" : "Pilih Semua"}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {permissions.map((permission) => {
                        const isChecked = data.permissions.includes(
                          permission.name
                        );
                        return (
                          <label
                            key={permission.id}
                            className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                              isChecked
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-surface-border bg-surface hover:bg-surface-muted text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() =>
                                toggleSinglePermission(permission.name)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                            />
                            <span className="text-xs font-mono break-all select-none">
                              {permission.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Link href={route("admin.roles.index")}>
              <Button variant="ghost">Batal</Button>
            </Link>
            <Button
              type="submit"
              disabled={processing}
            >
              {processing ? "Menyimpan..." : "Simpan Role"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
