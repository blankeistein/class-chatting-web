import React, { useState } from "react";
import {
  Card,
  CardBody,
  Typography,
  Chip,
  Button,
  IconButton,
  Input,
  Select,
  Dialog,
} from "@material-tailwind/react";
import DashboardLayout from "@/Layouts/AdminDashboard";
import { Head } from "@inertiajs/react";
import {
  SearchIcon,
  PlusIcon,
  FilterIcon,
  CopyIcon,
  Trash2Icon,
  RefreshCwIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  MoreVerticalIcon,
  TicketIcon,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

// Dummy Data for Activation Codes
const dummyCodes = [
  {
    id: 1,
    code: "LST-2024-ABCD-1234",
    type: "Premium Access",
    status: "active",
    generatedBy: "Admin",
    createdAt: "12 Des 2024",
    validUntil: "12 Jan 2025",
  },
  {
    id: 2,
    code: "LST-2024-EFGH-5678",
    type: "Bundle Kemerdekaan",
    status: "used",
    generatedBy: "System",
    createdAt: "10 Des 2024",
    validUntil: "31 Des 2024",
    usedBy: "Budi Santoso",
    usedAt: "11 Des 2024",
  },
  {
    id: 3,
    code: "LST-2024-IJKL-9012",
    type: "Premium Access",
    status: "expired",
    generatedBy: "Admin",
    createdAt: "01 Nov 2024",
    validUntil: "01 Des 2024",
  },
  {
    id: 4,
    code: "LST-2024-MNOP-3456",
    type: "Trial 7 Days",
    status: "active",
    generatedBy: "Marketing",
    createdAt: "14 Des 2024",
    validUntil: "21 Des 2024",
  },
  {
    id: 5,
    code: "LST-2024-QRST-7890",
    type: "Premium Access",
    status: "revoked",
    generatedBy: "Admin",
    createdAt: "05 Des 2024",
    validUntil: "05 Jan 2025",
  },
];

export default function Index() {
  const [openGenerateDialog, setOpenGenerateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Kode ${code} berhasil disalin!`);
  };

  const statusColors: Record<string, "success" | "warning" | "error" | "default" | "secondary" | "info"> = {
    active: "success",
    used: "info",
    expired: "warning",
    revoked: "error",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    active: <CheckCircle2Icon className="h-3.5 w-3.5" />,
    used: <CheckCircle2Icon className="h-3.5 w-3.5" />,
    expired: <ClockIcon className="h-3.5 w-3.5" />,
    revoked: <XCircleIcon className="h-3.5 w-3.5" />,
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
            <Typography className="text-slate-500 dark:text-slate-400">
              Kelola kode aktivasi untuk pengguna.
            </Typography>
          </div>
          <Button
            className="flex items-center gap-2 bg-slate-900 dark:bg-white dark:text-slate-900"
            onClick={() => setOpenGenerateDialog(true)}
          >
            <PlusIcon className="w-4 h-4" />
            Generate Kode Baru
          </Button>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Total Generated", value: "1,240", icon: TicketIcon, color: "bg-blue-500" },
            { label: "Active Codes", value: "850", icon: CheckCircle2Icon, color: "bg-green-500" },
            { label: "Used / Redeemed", value: "340", icon: RefreshCwIcon, color: "bg-purple-500" },
          ].map((stat, idx) => (
            <Card key={idx} className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
              <CardBody className="p-4 flex items-center justify-between">
                <div>
                  <Typography className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    {stat.label}
                  </Typography>
                  <Typography variant="h4" className="font-bold text-slate-800 dark:text-white">
                    {stat.value}
                  </Typography>
                </div>
                <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10 text-${stat.color.split('-')[1]}-600 dark:text-${stat.color.split('-')[1]}-400`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Filter & Search Bar */}
        <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <CardBody className="p-4">
            <div className="flex flex-col items-center md:flex-row gap-4">
              <div className="w-full md:w-72 space-y-1">
                <Typography
                  as="label"
                  htmlFor="cari-kode"
                  type="small"
                  color="default"
                  className="font-semibold"
                >
                  Cari Kode
                </Typography>
                <Input
                  id="cari-kode"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="!border-t-blue-gray-200 focus:!border-t-gray-900 dark:focus:!border-t-white dark:text-white"
                  placeholder="Cari Kode..."
                >
                  <Input.Icon placement="start">
                    <SearchIcon className="h-4 w-4" />
                  </Input.Icon>
                </Input>
              </div>
              <div className="w-full md:w-48 space-y-1">
                <Typography
                  as="label"
                  htmlFor="status"
                  type="small"
                  color="default"
                  className="font-semibold"
                >
                  Status
                </Typography>
                <Select
                  id="status"
                  value={filterStatus}
                  onValueChange={(val) => setFilterStatus(val || 'all')}
                >
                  <Select.Trigger placeholder="Status" />
                  <Select.List>
                    <Select.Option value="all">Semua Status</Select.Option>
                    <Select.Option value="active">Active</Select.Option>
                    <Select.Option value="used">Used</Select.Option>
                  </Select.List>
                </Select>
              </div>
              <div className="ml-auto flex gap-2">
                <Button variant="outline" className="flex items-center gap-2 dark:border-slate-600 dark:text-white">
                  <FilterIcon className="w-4 h-4" /> Filter
                </Button>
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
                  {["Kode Aktivasi", "Tipe", "Status", "Generated By", "Dibuat Tanggal", "Actions"].map((head) => (
                    <th key={head} className="border-y border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-4">
                      <Typography variant="small" className="font-bold leading-none opacity-70 text-slate-500 dark:text-slate-300">
                        {head}
                      </Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dummyCodes.map((item, index) => {
                  const isLast = index === dummyCodes.length - 1;
                  const classes = isLast ? "p-4" : "p-4 border-b border-slate-100 dark:border-slate-800";

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className={classes}>
                        <div className="flex items-center gap-3">
                          <TicketIcon className="h-4 w-4 text-slate-400" />
                          <div className="flex flex-col">
                            <Typography variant="small" className="font-bold text-slate-800 dark:text-white font-mono tracking-wider">
                              {item.code}
                            </Typography>
                            <Typography variant="small" className="text-[10px] text-slate-400">
                              Created: {item.createdAt}
                            </Typography>
                          </div>
                        </div>
                      </td>
                      <td className={classes}>
                        <Typography variant="small" className="font-medium text-slate-700 dark:text-slate-300">
                          {item.type}
                        </Typography>
                      </td>
                      <td className={classes}>
                        <Chip
                          variant="ghost"
                          size="sm"
                          // color={statusColors[item.status] || "primary"}
                          className="capitalize"
                        >
                          <Chip.Icon>
                            {statusIcons[item.status]}
                          </Chip.Icon>
                          <Chip.Label>{item.status}</Chip.Label>
                        </Chip>
                        {item.status === 'used' && (
                          <Typography variant="small" className="mt-1 text-[10px] text-slate-400">
                            by {item.usedBy}
                          </Typography>
                        )}
                      </td>
                      <td className={classes}>
                        <Typography variant="small" className="font-normal text-slate-600 dark:text-slate-400">
                          {item.generatedBy}
                        </Typography>
                      </td>
                      <td className={classes}>
                        <Typography variant="small" className="font-normal text-slate-600 dark:text-slate-400">
                          {item.validUntil}
                        </Typography>
                      </td>
                      <td className={classes}>
                        <div className="flex items-center gap-2">
                          <IconButton variant="ghost" size="sm" onClick={() => handleCopyCode(item.code)} color="info">
                            <CopyIcon className="h-4 w-4" />
                          </IconButton>
                          <IconButton variant="ghost" size="sm" color="error">
                            <Trash2Icon className="h-4 w-4" />
                          </IconButton>
                          <IconButton variant="ghost" size="sm" color="primary">
                            <MoreVerticalIcon className="h-4 w-4" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Generate Dialog Simulation */}
      <Dialog open={openGenerateDialog} onOpenChange={() => setOpenGenerateDialog(!openGenerateDialog)} size="sm">
        <Dialog.Overlay>
          <Dialog.Content>
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-start gap-1 dark:text-white">
                <Typography variant="h5">Generate Kode Baru</Typography>
                <Typography variant="small" className="font-normal text-slate-500">
                  Buat kode aktivasi baru secara massal atau satuan.
                </Typography>
              </div>
              <IconButton
                size="sm"
                variant="ghost"
                className="mr-2 dark:text-white"
                onClick={() => setOpenGenerateDialog(false)}
              >
                <XCircleIcon className="h-5 w-5" />
              </IconButton>
            </div>
            <div className="space-y-4">
              <div>
                <Typography variant="small" className="mb-2 font-bold text-slate-700 dark:text-slate-300">
                  Tipe Paket
                </Typography>
                <Select>
                  <Select.Trigger className="dark:text-white" placeholder="Pilih Paket" />
                  <Select.List>
                    <Select.Option>Premium Access (1 Bulan)</Select.Option>
                    <Select.Option>Premium Access (1 Tahun)</Select.Option>
                    <Select.Option>Bundle Kemerdekaan</Select.Option>
                  </Select.List>
                </Select>
              </div>
              <div>
                <Typography variant="small" className="mb-2 font-bold text-slate-700 dark:text-slate-300">
                  Jumlah Kode
                </Typography>
                <div className="space-y-1">
                  <Typography
                    as="label"
                    htmlFor="jumlah"
                    type="small"
                    color="default"
                    className="font-semibold"
                  >
                    Jumlah
                  </Typography>
                  <Input type="number" defaultValue={1} min={1} max={100} className="dark:text-white" />
                </div>
              </div>
              <div>
                <Typography variant="small" className="mb-2 font-bold text-slate-700 dark:text-slate-300">
                  Masa Berlaku (Expired)
                </Typography>
                <div className="space-y-1">
                  <Typography
                    as="label"
                    htmlFor="expired-date"
                    type="small"
                    color="default"
                    className="font-semibold"
                  >
                    Tanggal Kadaluarsa
                  </Typography>
                  <Input type="date" id="expired-date" className="dark:text-white" />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="ghost" color="primary" onClick={() => setOpenGenerateDialog(false)} className="dark:text-white">
                Batal
              </Button>
              <Button className="bg-slate-900 dark:bg-white dark:text-slate-900" onClick={() => {
                toast.success("Kode berhasil digenerate!");
                setOpenGenerateDialog(false);
              }}>
                Generate Kode
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog >
    </>
  );
}

Index.layout = (page: React.ReactNode) => {
  return <DashboardLayout>{page}</DashboardLayout>
}
