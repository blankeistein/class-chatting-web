import React from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import RegionTablePage from "./RegionTablePage";
import { Typography } from "@material-tailwind/react";

type Village = {
  id: number;
  name: string;
  district?: {
    name: string;
  };
  regency?: {
    name: string;
  };
  province?: {
    name: string;
  };
};

export default function Villages({ villages, filters }: { villages: { data: Village[] }; filters?: any }) {
  return (
    <RegionTablePage
      title="Daftar Desa"
      description="Daftar seluruh desa dan kelurahan."
      paginated={villages}
      items={villages.data ?? []}
      filters={filters}
      headings={["No", "ID", "Nama Daerah", "Kecamatan", "Kabupaten", "Provinsi"]}
      renderCells={(village, index) => (
        <>
          <td className="p-4">
            <Typography variant="small" className="text-slate-700 dark:text-slate-200">
              {index + 1}
            </Typography>
          </td>
          <td className="p-4">
            <Typography variant="small" className="text-slate-700 dark:text-slate-200">
              {village.id}
            </Typography>
          </td>
          <td className="p-4">
            <Typography variant="small" className="font-medium text-slate-800 dark:text-slate-100">
              {village.name}
            </Typography>
          </td>
          <td className="p-4">
            <Typography variant="small" className="text-slate-700 dark:text-slate-200">
              {village.district?.name || "-"}
            </Typography>
          </td>
          <td className="p-4">
            <Typography variant="small" className="text-slate-700 dark:text-slate-200">
              {village.regency?.name || "-"}
            </Typography>
          </td>
          <td className="p-4">
            <Typography variant="small" className="text-slate-700 dark:text-slate-200">
              {village.province?.name || "-"}
            </Typography>
          </td>
        </>
      )}
    />
  );
}

Villages.layout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>;
};
