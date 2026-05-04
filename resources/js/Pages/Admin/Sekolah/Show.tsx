import React from "react";
import {
  Button,
  Card,
  CardBody,
  IconButton,
  Typography,
} from "@material-tailwind/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router } from "@inertiajs/react";
import { ArrowLeftIcon, EditIcon } from "lucide-react";

type School = {
  id: number;
  code: string;
  old_code?: string | null;
  npsn: string | null;
  name: string;
  bentuk_pendidikan: string;
  status: "SWASTA" | "NEGERI";
  address?: string | null;
  rt?: number | null;
  rw?: number | null;
  latitute?: number | string | null;
  longitude?: number | string | null;
  province?: {
    id: number;
    code: string;
    name: string;
  };
  regency?: {
    id: number;
    code: string;
    name: string;
    type: string | null;
  };
  district?: {
    id: number;
    code: string;
    name: string;
  };
  village?: {
    id: number;
    code: string;
    name: string;
  };
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

export default function Show({ school }: { school: { data: School } }) {
  const schoolData = school.data;

  return (
    <>
      <Head title={`Info Sekolah - ${schoolData.name}`} />

      <div className="p-4 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <IconButton
              variant="ghost"
              onClick={() => router.get(route("admin.schools.index"))}
            >
              <ArrowLeftIcon className="w-5 h-5 dark:text-white" />
            </IconButton>
            <div>
              <Typography variant="h4" className="text-xl font-bold text-slate-800 dark:text-white">
                {schoolData.name}
              </Typography>
              <Typography className="text-sm text-slate-500 dark:text-slate-400">
                Informasi lengkap data sekolah.
              </Typography>
            </div>
          </div>
          <Button
            size="sm"
            className="flex items-center gap-2"
            onClick={() => router.get(route("admin.schools.edit", schoolData.code))}
          >
            <EditIcon className="h-4 w-4" />
            Edit Sekolah
          </Button>
        </div>

        <Card className="mx-auto max-w-5xl overflow-hidden border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardBody className="space-y-6 p-6">
            <div>
              <Typography type="h6">
                Identitas
              </Typography>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <InfoItem label="Kode Sekolah" value={schoolData.code} />
                <InfoItem label="Kode Lama" value={schoolData.old_code} />
                <InfoItem label="NPSN" value={schoolData.npsn} />
                <InfoItem label="Nama Sekolah" value={schoolData.name} />
                <InfoItem label="Bentuk Pendidikan" value={schoolData.bentuk_pendidikan} />
                <InfoItem label="Status" value={schoolData.status} />
              </div>
            </div>

            <div>
              <Typography type="h6">
                Wilayah
              </Typography>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <InfoItem label="Provinsi" value={schoolData.province ? `${schoolData.province.code} - ${schoolData.province.name}` : "-"} />
                <InfoItem label="Kabupaten/Kota" value={schoolData.regency ? `${schoolData.regency.code} - ${schoolData.regency.name}` : "-"} />
                <InfoItem label="Kecamatan" value={schoolData.district ? `${schoolData.district.code} - ${schoolData.district.name}` : "-"} />
              </div>
            </div>

            <div>
              <Typography type="h6">
                Alamat dan Koordinat
              </Typography>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <InfoItem label="Alamat" value={schoolData.address} />
                <InfoItem label="RT/RW" value={schoolData.rt || schoolData.rw ? `${schoolData.rt || "-"} / ${schoolData.rw || "-"}` : "-"} />
                <InfoItem label="Latitude" value={schoolData.latitute} />
                <InfoItem label="Longitude" value={schoolData.longitude} />
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
