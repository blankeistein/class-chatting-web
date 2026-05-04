import React from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import RegionTablePage from "./RegionTablePage";
import { Typography } from "@material-tailwind/react";

type Regency = {
  id: number;
  name: string;
  province?: {
    name: string;
  };
};

export default function Regencies({ regencies, filters, filterOptions }: { regencies: { data: Regency[] }; filters?: any; filterOptions?: any }) {
  return (
    <RegionTablePage
      title="Daftar Kabupaten"
      description="Daftar seluruh kabupaten dan kota."
      paginated={regencies}
      items={regencies.data ?? []}
      filters={filters}
      routeName="admin.regions.regencies.index"
      filterOptions={filterOptions}
      headings={["No", "ID", "Nama Daerah", "Provinsi"]}
      renderCells={(regency, index) => (
        <>
          <td className="p-4">
            <Typography variant="small" className="text-slate-700 dark:text-slate-200">
              {index + 1}
            </Typography>
          </td>
          <td className="p-4">
            <Typography variant="small" className="text-slate-700 dark:text-slate-200">
              {regency.id}
            </Typography>
          </td>
          <td className="p-4">
            <Typography variant="small" className="font-medium text-slate-800 dark:text-slate-100">
              {regency.name}
            </Typography>
          </td>
          <td className="p-4">
            <Typography variant="small" className="text-slate-700 dark:text-slate-200">
              {regency.province?.name || "-"}
            </Typography>
          </td>
        </>
      )}
    />
  );
}

Regencies.layout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>;
};
