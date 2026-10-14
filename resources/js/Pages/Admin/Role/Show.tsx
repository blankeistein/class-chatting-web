import React from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link } from "@inertiajs/react";
import { Button, Typography } from "@material-tailwind/react";
import {
  ArrowLeftIcon,
  ShieldIcon,
  PencilIcon,
  UsersIcon,
  UserCheckIcon,
  UserXIcon,
} from "lucide-react";
import { PageHeader } from "@/Components/PageHeader";
import Pagination from "@/Components/Pagination";

interface RoleDetails {
  id: number;
  name: string;
  permissions: string[];
  created_at: string;
}

interface UserItem {
  id: number;
  name: string;
  email: string;
  avatar: string;
  role: string;
  is_active: boolean;
}

interface ShowProps {
  role: RoleDetails;
  users: {
    data: UserItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: any[];
  };
}

export default function Show({ role, users }: ShowProps) {
  const groupedPermissions = role.permissions.reduce((acc, perm) => {
    const group = perm.split(".")[0] || "general";
    if (!acc[group]) acc[group] = [];
    acc[group].push(perm);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <AdminLayout>
      <Head title={`Detail Role: ${role.name}`} />

      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <PageHeader
          title={`Detail Role: ${role.name}`}
          description="Lihat rincian hak akses dan daftar pengguna dengan role ini"
          actions={
            <div className="flex items-center gap-2">
              <Link href={route("admin.roles.edit", role.id)}>
                <Button size="sm" className="flex items-center gap-2">
                  <PencilIcon className="w-4 h-4" />
                  Edit Role
                </Button>
              </Link>
              <Link href={route("admin.roles.index")}>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <ArrowLeftIcon className="w-4 h-4" />
                  Kembali
                </Button>
              </Link>
            </div>
          }
        />

        {/* Permissions Overview */}
        <div className="bg-surface rounded-2xl border border-surface-border p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-surface-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ShieldIcon className="w-6 h-6" />
              </div>
              <div>
                <Typography type="h6" className="text-slate-800 dark:text-white">
                  {role.name}
                </Typography>
                <Typography type="small" className="text-slate-500">
                  Total {role.permissions.length} permission diberikan
                </Typography>
              </div>
            </div>

            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              {role.permissions.length} Hak Akses
            </span>
          </div>

          <div className="space-y-4">
            {Object.keys(groupedPermissions).length === 0 ? (
              <Typography type="small" className="text-slate-500 italic">
                Role ini belum memiliki permission yang ditetapkan.
              </Typography>
            ) : (
              Object.entries(groupedPermissions).map(([group, perms]) => (
                <div
                  key={group}
                  className="p-3.5 rounded-xl border border-surface-border bg-surface-muted/30"
                >
                  <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs block mb-2">
                    {group}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {perms.map((perm) => (
                      <span
                        key={perm}
                        className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono bg-surface border border-surface-border text-slate-800 dark:text-slate-200"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Users with this Role */}
        <div className="bg-surface rounded-2xl border border-surface-border p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-surface-border">
            <UsersIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <Typography type="h6" className="text-slate-800 dark:text-white">
              Pengguna dengan Role Ini ({users.total})
            </Typography>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-max table-auto text-left">
              <thead>
                <tr className="border-b border-surface-border bg-surface-muted/50">
                  <th className="p-3 text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                    Nama & Email
                  </th>
                  <th className="p-3 text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                    Status
                  </th>
                  <th className="p-3 text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {users.data.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-slate-500">
                      Belum ada pengguna yang memiliki role ini.
                    </td>
                  </tr>
                ) : (
                  users.data.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-surface-muted/30"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar || "/assets/images/avatar-placeholder.webp"}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white text-sm block">
                              {user.name}
                            </span>
                            <span className="text-slate-500 text-xs block">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        {user.is_active ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                            <UserCheckIcon className="w-3.5 h-3.5" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-red-500">
                            <UserXIcon className="w-3.5 h-3.5" />
                            Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <Link href={route("admin.users.show", user.id)}>
                          <Button variant="ghost" size="sm">
                            Lihat Profil
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination paginated={users} />
        </div>
      </div>
    </AdminLayout>
  );
}
