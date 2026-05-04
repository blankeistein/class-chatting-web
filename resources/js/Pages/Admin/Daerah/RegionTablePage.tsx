import React from "react";
import { Button, Card, IconButton, Input, Select, Typography } from "@material-tailwind/react";
import { Head, router } from "@inertiajs/react";
import { PageHeader } from "@/Components/PageHeader";
import Pagination from "@/Components/Pagination";
import { SearchIcon } from "lucide-react";

type Filters = {
  search?: string;
  per_page?: number;
  sort_by?: string;
  sort_direction?: string;
};

export default function RegionTablePage({
  title,
  description,
  paginated,
  items,
  filters,
  headings,
  renderCells,
}: {
  title: string;
  description: string;
  paginated: any;
  items: unknown[];
  filters?: Filters;
  headings: string[];
  renderCells: (item: any, index: number) => React.ReactNode;
}) {
  const [search, setSearch] = React.useState(filters?.search || "");
  const [sort, setSort] = React.useState(`${filters?.sort_by || "name"}|${filters?.sort_direction || "asc"}`);
  const [perPage, setPerPage] = React.useState(String(filters?.per_page || 25));

  const applyFilters = () => {
    const [sortBy, sortDirection] = sort.split("|");

    router.get(route().current() as string, {
      search,
      sort_by: sortBy,
      sort_direction: sortDirection,
      per_page: perPage,
    }, {
      preserveState: true,
      replace: true,
      only: ["filters", "provinces", "regencies", "districts", "villages"],
    });
  };

  return (
    <>
      <Head title={title} />

      <div className="space-y-6 p-4">
        <PageHeader title={title} description={description} />

        <Card className="border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Card.Body className="space-y-4 p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="w-full md:flex-1">
                <Typography as="label" htmlFor="search-region" type="small" color="default" className="font-semibold">
                  Cari Nama
                </Typography>
                <div className="flex items-center gap-2">
                  <Input
                    id="search-region"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        applyFilters();
                      }
                    }}
                    placeholder="Cari nama daerah..."
                  />
                  <IconButton variant="outline" color="secondary" onClick={applyFilters} className="shrink-0">
                    <SearchIcon className="h-4 w-4" />
                  </IconButton>
                </div>
              </div>

              <div className="w-full md:w-56">
                <Typography as="label" htmlFor="sort-region" type="small" color="default" className="font-semibold">
                  Urutkan
                </Typography>
                <Select value={sort} onValueChange={(value) => setSort(value || "name|asc")}>
                  <Select.Trigger id="sort-region" placeholder="Pilih urutan" />
                  <Select.List>
                    <Select.Option value="name|asc">Nama (A-Z)</Select.Option>
                    <Select.Option value="name|desc">Nama (Z-A)</Select.Option>
                  </Select.List>
                </Select>
              </div>

              <div className="w-full md:w-40">
                <Typography as="label" htmlFor="per-page-region" type="small" color="default" className="font-semibold">
                  Jumlah Item
                </Typography>
                <Select value={perPage} onValueChange={(value) => setPerPage(value || "25")}>
                  <Select.Trigger id="per-page-region" placeholder="25 data" />
                  <Select.List>
                    <Select.Option value="25">25 data</Select.Option>
                    <Select.Option value="50">50 data</Select.Option>
                    <Select.Option value="100">100 data</Select.Option>
                  </Select.List>
                </Select>
              </div>

              <Button className="md:self-end" onClick={applyFilters}>
                Terapkan
              </Button>
            </div>
          </Card.Body>
        </Card>

        <Pagination paginated={paginated} />

        <Card className="overflow-hidden border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-full table-auto text-left">
              <thead>
                <tr>
                  {headings.map((heading) => (
                    <th key={heading} className="border-b border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                      <Typography variant="small" className="font-bold text-slate-600 dark:text-slate-300">
                        {heading}
                      </Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.length > 0 ? items.map((item, index) => (
                  <tr key={item.id} className="border-b border-slate-100 last:border-b-0 dark:border-slate-800">
                    {renderCells(item, index)}
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={headings.length} className="p-8 text-center">
                      <Typography className="text-sm text-slate-500 dark:text-slate-400">
                        Belum ada data daerah.
                      </Typography>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Pagination paginated={paginated} />
      </div>
    </>
  );
}
