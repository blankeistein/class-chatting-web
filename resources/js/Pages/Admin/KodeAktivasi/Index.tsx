import React, { useState } from "react";
import {
  Card,
  CardBody,
  Typography,
  Button,
  IconButton,
  Input,
  Select,
  Chip,
} from "@material-tailwind/react";
import {
  PlusIcon,
  SearchIcon,
  CopyIcon,
  Trash2Icon,
  TicketIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "lucide-react";
import { Head, router } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { toast, Toaster } from "react-hot-toast";
import GenerateCodeDialog from "./Partials/GenerateCodeDialog";

interface User {
  name: string;
  email: string;
}

interface ActivationCode {
  id: number;
  code: string;
  user: User | null;
  activated_at: string | null;
  activated_in: string | null;
  tier: {
    value: number;
    label: string;
  };
  type: string;
  times_activated: number;
  max_activated: number;
  created_at: string;
  updated_at: string;
}

interface Link {
  url: string | null;
  label: string;
  active: boolean;
}

interface Meta {
  current_page: number;
  from: number;
  last_page: number;
  links: Link[];
  path: string;
  per_page: number;
  to: number;
  total: number;
}

interface PaginatedData<T> {
  data: T[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: Meta;
}

export default function Index({ activationCodes, filters }: { activationCodes: PaginatedData<ActivationCode>, filters: any }) {
  const [openGenerateDialog, setOpenGenerateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [perPage, setPerPage] = useState(filters.per_page || "25");
  const [sortBy, setSortBy] = useState(filters.sort_by || "created_at");
  const [sortDirection, setSortDirection] = useState(filters.sort_direction || "desc");

  const handleSearch = () => {
    router.get(route('admin.activation-code.index'), {
      search: searchTerm,
      per_page: perPage,
      sort_by: sortBy,
      sort_direction: sortDirection,
    }, { preserveState: true });
  };

  const handleSortChange = (val: string | undefined) => {
    if (!val) return;
    const [field, direction] = val.split("|");
    setSortBy(field);
    setSortDirection(direction);
    router.get(route('admin.activation-code.index'), {
      search: searchTerm,
      per_page: perPage,
      sort_by: field,
      sort_direction: direction,
    }, { preserveState: true });
  };

  const handleDelete = (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus kode aktivasi ini?")) {
      router.delete(route('admin.activation-code.destroy', id), {
        onSuccess: () => toast.success("Kode berhasil dihapus"),
      });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Kode disalin ke clipboard!");
  };

  const getStatus = (item: ActivationCode) => {
    if (item.max_activated && item.times_activated >= item.max_activated) return "used";
    if (item.times_activated > 0) return "active";
    return "available";
  };

  const statusIcons: Record<string, React.ReactNode> = {
    used: <CheckCircleIcon className="h-3 w-3" />,
    active: <ClockIcon className="h-3 w-3" />,
    available: <PlusIcon className="h-3 w-3" />,
    revoked: <XCircleIcon className="h-3 w-3" />,
  };

  const statusIconsColor: Record<string, string> = {
    used: "success",
    active: "info",
    available: "warning",
    revoked: "error",
  };

  return (
    <>
      <Head title="Manajemen Kode Aktivasi" />
      <Toaster position="bottom-center" />

      <div className="p-4 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Typography variant="h4" className="font-bold text-slate-800 dark:text-white">
              Kode Aktivasi
            </Typography>
            <Typography variant="small" className="text-slate-500 dark:text-slate-400">
              Kelola dan generate kode aktivasi untuk akses aplikasi.
            </Typography>
          </div>
          <Button
            className="flex items-center gap-3 bg-slate-900 dark:bg-white dark:text-slate-900"
            size="sm"
            onClick={() => setOpenGenerateDialog(true)}
          >
            <PlusIcon className="h-4 w-4" /> Generate Kode Baru
          </Button>
        </div>

        {/* Filters and Stats */}
        <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <CardBody className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-full md:w-72 relative">
                <Input
                  placeholder="Cari kode atau user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyUp={(e) => e.key === "Enter" && handleSearch()}
                  className="dark:text-white pl-10"
                />
                <SearchIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <div className="w-full md:w-32">
                <Select
                  value={perPage.toString()}
                  onValueChange={(val) => {
                    setPerPage(val);
                    router.get(route('admin.activation-code.index'), { search: searchTerm, per_page: val, sort_by: sortBy, sort_direction: sortDirection }, { preserveState: true });
                  }}
                >
                  <Select.Trigger className="dark:text-white" placeholder="25" />
                  <Select.List>
                    <Select.Option value="10">10 per Hal</Select.Option>
                    <Select.Option value="25">25 per Hal</Select.Option>
                    <Select.Option value="50">50 per Hal</Select.Option>
                    <Select.Option value="100">100 per Hal</Select.Option>
                  </Select.List>
                </Select>
              </div>
              <div className="w-full md:w-48">
                <Select
                  value={`${sortBy}|${sortDirection}`}
                  onValueChange={handleSortChange}
                >
                  <Select.Trigger className="dark:text-white" placeholder="Urutkan" />
                  <Select.List>
                    <Select.Option value="created_at|desc">Terbaru</Select.Option>
                    <Select.Option value="created_at|asc">Terlama</Select.Option>
                    <Select.Option value="code|asc">Kode (A-Z)</Select.Option>
                    <Select.Option value="code|desc">Kode (Z-A)</Select.Option>
                  </Select.List>
                </Select>
              </div>
              <div className="ml-auto flex gap-2">
                <Button variant="outline" className="flex items-center gap-2 dark:border-slate-600 dark:text-white">
                  Export CSV
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Codes Table */}
        <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max table-auto text-left">
              <thead>
                <tr>
                  {["Kode Aktivasi", "User", "Tier", "Jenis", "Status", "Limit", "Dibuat", "Aksi"].map((head) => (
                    <th key={head} className="border-y border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-4">
                      <Typography variant="small" className="font-bold leading-none opacity-70 text-slate-500 dark:text-slate-300">
                        {head}
                      </Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activationCodes.data.map((item, index) => {
                  const isLast = index === activationCodes.data.length - 1;
                  const classes = isLast ? "p-4" : "p-4 border-b border-slate-100 dark:border-slate-800";
                  const status = getStatus(item);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className={classes}>
                        <div className="flex items-center gap-3">
                          <TicketIcon className="h-4 w-4 text-slate-400" />
                          <div className="flex flex-col">
                            <Typography variant="small" className="font-bold text-slate-800 dark:text-white font-mono tracking-wider">
                              {item.code}
                            </Typography>
                          </div>
                        </div>
                      </td>
                      <td className={classes}>
                        {item.user ? (
                          <div className="flex flex-col">
                            <Typography variant="small" className="font-medium text-slate-700 dark:text-slate-300">
                              {item.user.name}
                            </Typography>
                            <Typography variant="small" className="text-[10px] text-slate-400">
                              {item.user.email}
                            </Typography>
                          </div>
                        ) : (
                          <Typography variant="small" className="text-slate-400 italic">
                            Belum digunakan
                          </Typography>
                        )}
                      </td>
                      <td className={classes}>
                        <Typography variant="small" className="font-medium text-slate-700 dark:text-slate-300">
                          {item.tier.label}
                        </Typography>
                      </td>
                      <td className={classes}>
                        <Chip
                          variant="ghost"
                          size="sm"
                          color={item.type === 'public' ? "info" : "success"}
                          className="capitalize"
                        >
                          <Chip.Label>{item.type === 'public' ? 'Public' : 'Individual'}</Chip.Label>
                        </Chip>
                      </td>
                      <td className={classes}>
                        <Chip
                          variant="ghost"
                          size="sm"
                          color={statusIconsColor[status] as any}
                          className="capitalize"
                        >
                          <Chip.Icon>
                            {statusIcons[status]}
                          </Chip.Icon>
                          <Chip.Label>{status}</Chip.Label>
                        </Chip>
                      </td>
                      <td className={classes}>
                        <Typography variant="small" className="font-normal text-slate-600 dark:text-slate-400">
                          {item.times_activated} / {item.max_activated ?? "∞"}
                        </Typography>
                      </td>
                      <td className={classes}>
                        <Typography variant="small" className="font-normal text-slate-600 dark:text-slate-400">
                          {new Date(item.created_at).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </Typography>
                      </td>
                      <td className={classes}>
                        <div className="flex items-center gap-2">
                          <IconButton variant="ghost" size="sm" onClick={() => handleCopyCode(item.code)} color="secondary">
                            <CopyIcon className="h-4 w-4" />
                          </IconButton>
                          <IconButton variant="ghost" size="sm" color="error" onClick={() => handleDelete(item.id)}>
                            <Trash2Icon className="h-4 w-4" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {activationCodes.data.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      Tidak ada data kode aktivasi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Pagination Controls */}
        <div className="mt-8 flex justify-center gap-2">
          {activationCodes.meta.links.map((link: any, key: number) => (
            <Button
              key={key}
              variant={link.active ? "solid" : "ghost"}
              size="sm"
              color={link.active ? "primary" : "secondary"}
              className={`flex items-center gap-2 ${!link.url ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => link.url && router.get(link.url, { search: searchTerm, per_page: perPage, sort_by: sortBy, sort_direction: sortDirection }, { preserveState: true })}
              dangerouslySetInnerHTML={{ __html: link.label }}
              disabled={!link.url}
            />
          ))}
        </div>
      </div>

      {/* Generate Dialog */}
      <GenerateCodeDialog open={openGenerateDialog} setOpen={setOpenGenerateDialog} />
    </>
  );
}

Index.layout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>;
};
