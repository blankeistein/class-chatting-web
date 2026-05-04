import React from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import RegionTablePage from "./RegionTablePage";
import { Typography } from "@material-tailwind/react";

type District = {
  id: number;
  name: string;
  regency?: {
    name: string;
  };
  province?: {
    name: string;
  };
};

export default function Districts({ districts, filters }: { districts: { data: District[] }; filters?: any }) {
  return (
    <RegionTablePage
      title="Daftar Kecamatan"
      description="Daftar seluruh kecamatan."
      paginated={districts}
      items={districts.data ?? []}
      filters={filters}
      headings={["No", "ID", "Nama Daerah", "Kabupaten", "Provinsi"]}
      renderCells={(district, index) => (
        <>
          <td className="p-4">
            <Typography variant="small" className="text-slate-700 dark:text-slate-200">
              {index + 1}
            </Typography>
          </td>
          <td className="p-4">
            <Typography variant="small" className="text-slate-700 dark:text-slate-200">
              {district.id}
            </Typography>
          </td>
          <td className="p-4">
            <Typography variant="small" className="font-medium text-slate-800 dark:text-slate-100">
              {district.name}
            </Typography>
          </td>
          <td className="p-4">
            <Typography variant="small" className="text-slate-700 dark:text-slate-200">
              {district.regency?.name || "-"}
            </Typography>
          </td>
          <td className="p-4">
            <Typography variant="small" className="text-slate-700 dark:text-slate-200">
              {district.province?.name || "-"}
            </Typography>
          </td>
        </>
      )}
    />
  );
}

Districts.layout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>;
};
