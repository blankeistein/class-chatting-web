import React from "react";
import {
  Avatar,
  Button,
  Card,
  CardBody,
  IconButton,
  Typography,
} from "@material-tailwind/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router } from "@inertiajs/react";
import { ArrowLeftIcon, EditIcon, UserCheckIcon, UserXIcon } from "lucide-react";

type User = {
  id: number;
  firebase_uid: string | null;
  name: string;
  email: string;
  username: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
  image: string;
  created_at: string;
};

function InfoItem({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <Typography variant="small" className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
        {label}
      </Typography>
      <Typography className="mt-1 font-medium text-slate-800 dark:text-white">
        {value || "-"}
      </Typography>
    </div>
  );
}

export default function Show({ user }: { user: User }) {
  return (
    <>
      <Head title={`Informasi User - ${user.name}`} />

      <div className="p-4 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <IconButton
              variant="ghost"
              onClick={() => router.get(route("admin.users.index"))}
              className="rounded-full flex-shrink-0"
            >
              <ArrowLeftIcon className="w-5 h-5 dark:text-white" />
            </IconButton>
            <div>
              <Typography variant="h4" className="text-xl font-bold text-slate-800 dark:text-white">
                Informasi User
              </Typography>
              <Typography className="text-sm text-slate-500 dark:text-slate-400">
                Detail profil dan status pengguna.
              </Typography>
            </div>
          </div>
          <Button
            size="sm"
            className="flex items-center gap-2"
            onClick={() => router.get(route("admin.users.edit", user.id))}
          >
            <EditIcon className="h-4 w-4" />
            Edit User
          </Button>
        </div>

        <Card className="mx-auto max-w-4xl overflow-hidden border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardBody className="space-y-6 p-6">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Avatar src={user.image} alt={user.name} size="xxl" />
              <div className="space-y-1">
                <Typography variant="h5" className="font-bold text-slate-800 dark:text-white">
                  {user.name}
                </Typography>
                <Typography className="text-slate-500 dark:text-slate-400">
                  {user.email}
                </Typography>
                <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${user.is_active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"}`}>
                  {user.is_active ? <UserCheckIcon className="h-3.5 w-3.5" /> : <UserXIcon className="h-3.5 w-3.5" />}
                  {user.is_active ? "Aktif" : "Nonaktif"}
                </div>
              </div>
            </div>

            <div>
              <Typography type="h6">
                Detail Akun
              </Typography>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <InfoItem label="UID" value={user.firebase_uid} />
                <InfoItem label="Nama" value={user.name} />
                <InfoItem label="Email" value={user.email} />
                <InfoItem label="Username" value={user.username ? `@${user.username}` : "-"} />
                <InfoItem label="No. Telepon" value={user.phone} />
                <InfoItem label="Role" value={user.role} />
                <InfoItem
                  label="Terdaftar"
                  value={new Date(user.created_at).toLocaleDateString("id-ID", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

Show.layout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>;
};
