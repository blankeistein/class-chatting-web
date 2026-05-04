import React, { useEffect } from "react";
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
  province_id?: number;
  regency_id?: number;
  district_id?: number;
};

type ProvinceOption = {
  id: number;
  name: string;
};

type RegencyOption = {
  id: number;
  name: string;
  province_id: number;
};

type DistrictOption = {
  id: number;
  name: string;
  regency_id: number;
};

type FilterOptions = {
  provinces?: ProvinceOption[];
  regencies?: RegencyOption[];
  districts?: DistrictOption[];
};

export default function RegionTablePage({
  title,
  description,
  routeName,
  paginated,
  items,
  filters,
  filterOptions,
  headings,
  renderCells,
  actions,
}: {
  title: string;
  routeName: string;
  description: string;
  paginated: any;
  items: any[];
  filters?: Filters;
  filterOptions?: FilterOptions;
  headings: string[];
  renderCells: (item: any, index: number) => React.ReactNode;
  actions?: React.ReactNode;
}) {
  const [search, setSearch] = React.useState(filters?.search || "");
  const [sort, setSort] = React.useState(`${filters?.sort_by || "name"}|${filters?.sort_direction || "asc"}`);
  const [perPage, setPerPage] = React.useState(String(filters?.per_page || 25));
  const [provinceId, setProvinceId] = React.useState(filters?.province_id ? String(filters.province_id) : "");
  const [regencyId, setRegencyId] = React.useState(filters?.regency_id ? String(filters.regency_id) : "");
  const [districtId, setDistrictId] = React.useState(filters?.district_id ? String(filters.district_id) : "");

  const filteredRegencies = (filterOptions?.regencies || []).filter((regency) => !provinceId || regency.province_id === Number(provinceId));
  const filteredDistricts = (filterOptions?.districts || []).filter((district) => !regencyId || district.regency_id === Number(regencyId));

  const applyFilters = () => {
    const [sortBy, sortDirection] = sort.split("|");

    router.get(route(routeName), {
      search,
      sort_by: sortBy,
      sort_direction: sortDirection,
      per_page: perPage,
      province_id: provinceId,
      regency_id: regencyId,
      district_id: districtId,
    }, {
      preserveState: true,
      replace: true,
      only: ["filters", "provinces", "regencies", "districts", "villages"],
    });
  };

  useEffect(() => {
    applyFilters();
  }, [sort, perPage, provinceId, regencyId, districtId]);

  return (
    <>
      <Head title={title} />

      <div className="space-y-6 p-4">
        <PageHeader title={title} description={description} actions={actions} />

        <Card className="border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Card.Body className="space-y-4 p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="w-full md:flex-1 space-y-1">
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

              <div className="w-full md:w-56 space-y-1">
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

              <div className="w-full md:w-40 space-y-1">
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
            </div>

            {(filterOptions?.provinces || filterOptions?.regencies || filterOptions?.districts) && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {filterOptions?.provinces && (
                  <div className="space-y-1">
                    <Typography as="label" htmlFor="province-filter" type="small" color="default" className="font-semibold">
                      Filter Provinsi
                    </Typography>
                    <Select
                      value={provinceId}
                      onValueChange={(value) => {
                        setProvinceId(value || "");
                        setRegencyId("");
                        setDistrictId("");
                      }}
                    >
                      <Select.Trigger id="province-filter" placeholder="Semua provinsi" />
                      <Select.List>
                        <Select.Option value="">Semua provinsi</Select.Option>
                        {filterOptions.provinces.map((province) => (
                          <Select.Option key={province.id} value={String(province.id)}>
                            {province.name}
                          </Select.Option>
                        ))}
                      </Select.List>
                    </Select>
                  </div>
                )}

                {filterOptions?.regencies && (
                  <div className="space-y-1">
                    <Typography as="label" htmlFor="regency-filter" type="small" color="default" className="font-semibold">
                      Filter Kabupaten
                    </Typography>
                    <Select
                      value={regencyId}
                      onValueChange={(value) => {
                        setRegencyId(value || "");
                        setDistrictId("");
                      }}
                      disabled={!!filterOptions.provinces && !provinceId}
                    >
                      <Select.Trigger id="regency-filter" placeholder="Semua kabupaten" />
                      <Select.List>
                        <Select.Option value="">Semua kabupaten</Select.Option>
                        {filteredRegencies.map((regency) => (
                          <Select.Option key={regency.id} value={String(regency.id)}>
                            {regency.name}
                          </Select.Option>
                        ))}
                      </Select.List>
                    </Select>
                  </div>
                )}

                {filterOptions?.districts && (
                  <div className="space-y-1">
                    <Typography as="label" htmlFor="district-filter" type="small" color="default" className="font-semibold">
                      Filter Kecamatan
                    </Typography>
                    <Select
                      value={districtId}
                      onValueChange={(value) => setDistrictId(value || "")}
                      disabled={!regencyId}
                    >
                      <Select.Trigger id="district-filter" placeholder="Semua kecamatan" />
                      <Select.List>
                        <Select.Option value="">Semua kecamatan</Select.Option>
                        {filteredDistricts.map((district) => (
                          <Select.Option key={district.id} value={String(district.id)}>
                            {district.name}
                          </Select.Option>
                        ))}
                      </Select.List>
                    </Select>
                  </div>
                )}
              </div>
            )}
            <Button className="md:self-end" onClick={applyFilters}>
              Terapkan
            </Button>
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
