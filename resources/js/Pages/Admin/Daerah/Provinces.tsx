import React from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import RegionTablePage from "./RegionTablePage";
import { Typography } from "@material-tailwind/react";

type Province = {
  id: number;
  name: string;
};

export default function Provinces({ provinces, filters }: { provinces: { data: Province[] }; filters?: any }) {
  return (
    <RegionTablePage
      title="Daftar Provinsi"
      description="Daftar seluruh provinsi."
      paginated={provinces}
      items={provinces.data ?? []}
      filters={filters}
      routeName="admin.regions.provinces.index"
      headings={["No", "ID", "Nama Daerah"]}
      renderCells={(province, index) => (
        <>
          <td className="p-4">
            <Typography variant="small" className="text-slate-700 dark:text-slate-200">
              {index + 1}
            </Typography>
          </td>
          <td className="p-4">
            <Typography variant="small" className="text-slate-700 dark:text-slate-200">
              {province.id}
            </Typography>
          </td>
          <td className="p-4">
            <Typography variant="small" className="font-medium text-slate-800 dark:text-slate-100">
              {province.name}
            </Typography>
          </td>
        </>
      )}
    />
  );
}

Provinces.layout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>;
};
