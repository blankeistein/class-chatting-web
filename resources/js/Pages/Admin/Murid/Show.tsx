import React from "react";
import { Button, Card, CardBody, Chip, IconButton, Typography } from "@material-tailwind/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link, router } from "@inertiajs/react";
import { ArrowLeftIcon, EditIcon, ExternalLinkIcon } from "lucide-react";
import { PageHeader } from "@/Components/PageHeader";

type Student = {
  id: number;
  user_id: number;
  school_id: number;
  name?: string | null;
  nis: string | null;
  nisn: string | null;
  class_name: string | null;
  gender: string | null;
  is_active: boolean;
  created_at?: string | null;
  user?: {
    id: number;
    name: string;
    email: string;
    username: string | null;
    role: string;
    is_active: boolean;
    avatar?: string;
    phone?: string | null;
  } | null;
  school?: {
    id: number;
    code: string;
    npsn: string | null;
    name: string;
    bentuk_pendidikan?: string;
    status?: string;
  } | null;
};

function InfoItem({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <Typography
        variant="small"
        className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400"
      >
        {label}
      </Typography>
      <Typography className="mt-1 font-medium text-slate-800 dark:text-white">
        {value || "-"}
      </Typography>
    </div>
  );
}

export default function Show({ student }: { student: { data: Student } }) {
  const data = student.data;

  return (
    <>
      <Head title={`Detail Murid - ${data.user?.name || data.name || ""}`} />

      <div className="space-y-6 p-4">
        <PageHeader
          title={data.user?.name || data.name || "Detail Murid"}
          description="Nama bersumber dari akun user. Data sekolah dan identitas murid di bawah."
          backAction={
            <IconButton variant="ghost" onClick={() => router.get(route("admin.students.index"))}>
              <ArrowLeftIcon className="h-5 w-5 dark:text-white" />
            </IconButton>
          }
          actions={
            <Button
              size="sm"
              className="flex items-center gap-2"
              onClick={() => router.get(route("admin.students.edit", data.id))}
            >
              <EditIcon className="h-4 w-4" />
              Edit Murid
            </Button>
          }
        />

        <Card className="mx-auto max-w-5xl overflow-hidden border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardBody className="space-y-6 p-6">
            <div>
              <Typography type="h6">Akun User</Typography>
              <Typography type="small" className="mb-4 text-slate-500">
                Nama dan identitas login tidak disimpan di tabel murid.
              </Typography>
              <div className="grid gap-4 md:grid-cols-2">
                <InfoItem label="Nama" value={data.user?.name || data.name} />
                <InfoItem label="Email" value={data.user?.email} />
                <InfoItem label="Username" value={data.user?.username} />
                <InfoItem label="Role" value={data.user?.role} />
                <InfoItem
                  label="Status akun"
                  value={
                    <Chip
                      size="sm"
                      color={data.user?.is_active ? "success" : "secondary"}
                      variant="ghost"
                    >
                      {data.user?.is_active ? "Aktif" : "Nonaktif"}
                    </Chip>
                  }
                />
                <InfoItem
                  label="Kelola user"
                  value={
                    data.user ? (
                      <Link
                        href={route("admin.users.edit", data.user.id)}
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        Edit user <ExternalLinkIcon className="h-3.5 w-3.5" />
                      </Link>
                    ) : (
                      "-"
                    )
                  }
                />
              </div>
            </div>

            <div>
              <Typography type="h6">Data Murid</Typography>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <InfoItem label="NIS" value={data.nis} />
                <InfoItem label="NISN" value={data.nisn} />
                <InfoItem label="Kelas" value={data.class_name} />
                <InfoItem
                  label="Jenis kelamin"
                  value={
                    data.gender === "L" ? "Laki-laki" : data.gender === "P" ? "Perempuan" : "-"
                  }
                />
                <InfoItem
                  label="Status murid"
                  value={
                    <Chip size="sm" color={data.is_active ? "success" : "secondary"} variant="ghost">
                      {data.is_active ? "Aktif" : "Nonaktif"}
                    </Chip>
                  }
                />
              </div>
            </div>

            <div>
              <Typography type="h6">Sekolah</Typography>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <InfoItem label="Nama sekolah" value={data.school?.name} />
                <InfoItem label="Kode" value={data.school?.code} />
                <InfoItem label="NPSN" value={data.school?.npsn} />
                <InfoItem label="Bentuk pendidikan" value={data.school?.bentuk_pendidikan} />
                <InfoItem label="Status sekolah" value={data.school?.status} />
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
