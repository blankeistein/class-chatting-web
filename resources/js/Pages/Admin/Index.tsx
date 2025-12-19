import React from "react";
import {
  Card,
  CardBody,
  Typography,
  Chip,
  Progress,
  Avatar,
  IconButton,
  Button
} from "@material-tailwind/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head } from "@inertiajs/react";
import {
  BanknoteIcon,
  UsersIcon,
  BookOpenIcon,
  ActivityIcon,
  LayersIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MoreVerticalIcon,
  ClockIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ArrowRightIcon
} from "lucide-react";

// Dummy Data
const stats = [
  {
    title: "Total Buku",
    value: "1,280",
    change: "+12.5%",
    trend: "up",
    icon: BookOpenIcon,
    color: "bg-blue-500",
  },
  {
    title: "Pengguna Terdaftar",
    value: "3,422",
    change: "+5.2%",
    trend: "up",
    icon: UsersIcon,
    color: "bg-orange-500",
  },
  {
    title: "Total Kategori",
    value: "24",
    change: "+2",
    trend: "up",
    icon: LayersIcon,
    color: "bg-green-500",
  },
  {
    title: "Buku Terbit",
    value: "854",
    change: "+8.1%",
    trend: "up",
    icon: CheckCircle2Icon,
    color: "bg-purple-500",
  },
];

const recentTransactions = [
  {
    id: "#TRX-9821",
    user: "Andi Saputra",
    amount: "Rp 150.000",
    status: "success",
    date: "12 Des 2024",
    img: "https://i.pravatar.cc/150?u=1",
  },
  {
    id: "#TRX-9822",
    user: "Budi Santoso",
    amount: "Rp 75.000",
    status: "pending",
    date: "12 Des 2024",
    img: "https://i.pravatar.cc/150?u=2",
  },
  {
    id: "#TRX-9823",
    user: "Citra Dewi",
    amount: "Rp 320.000",
    status: "failed",
    date: "11 Des 2024",
    img: "https://i.pravatar.cc/150?u=3",
  },
  {
    id: "#TRX-9824",
    user: "Dewi Lestari",
    amount: "Rp 110.000",
    status: "success",
    date: "11 Des 2024",
    img: "https://i.pravatar.cc/150?u=4",
  },
];

const popularBooks = [
  { name: "Panduan Belajar Membaca", sales: 85, color: "blue" },
  { name: "Matematika Dasar", sales: 65, color: "green" },
  { name: "Ilmu Pengetahuan Alam", sales: 45, color: "orange" },
  { name: "Sejarah Indonesia", sales: 30, color: "red" },
];

export default function Index() {
  return (
    <>
      <Head title="Dashboard" />

      <div className="p-4 space-y-6">

        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <Typography variant="h4" className="text-slate-800 dark:text-white font-bold">
              Dashboard Overview
            </Typography>
            <Typography className="text-slate-500 dark:text-slate-400">
              Ringkasan aktivitas dan performa aplikasi hari ini.
            </Typography>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="dark:text-white dark:border-white">
              Download Report
            </Button>
            <Button size="sm" className="bg-slate-900 dark:bg-white dark:text-slate-900">
              + Add Widget
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
              <CardBody className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <Typography className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" className="font-bold text-slate-800 dark:text-white">
                      {stat.value}
                    </Typography>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10 text-${stat.color.split('-')[1]}-600`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className={`flex items-center text-xs font-medium ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                    {stat.trend === 'up' ? <TrendingUpIcon className="w-3 h-3 mr-1" /> : <TrendingDownIcon className="w-3 h-3 mr-1" />}
                    {stat.change}
                  </span>
                  <span className="text-xs text-slate-400">dari bulan lalu</span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main Chart Section (Simulated) */}
          <Card className="col-span-1 lg:col-span-2 shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <Typography variant="h5" className="font-bold text-slate-800 dark:text-white">
                    Analisis Penjualan
                  </Typography>
                  <Typography className="text-sm text-slate-500 dark:text-slate-400">
                    Performa penjualan dalam 7 hari terakhir
                  </Typography>
                </div>
                <Button size="sm" variant="ghost" className="flex items-center gap-2 dark:text-white">
                  Lihat Detail <ArrowRightIcon className="w-4 h-4" />
                </Button>
              </div>

              {/* CSS Bar Chart Simulation */}
              <div className="h-64 flex items-end justify-between gap-2 mt-8">
                {[45, 78, 55, 90, 65, 88, 40, 60, 95, 75, 50, 70].map((height, i) => (
                  <div key={i} className="w-full flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="relative w-full bg-slate-100 dark:bg-slate-800 rounded-t-sm h-full flex items-end overflow-hidden">
                      <div
                        style={{ height: `${height}%` }}
                        className="w-full bg-blue-500 dark:bg-blue-600 rounded-t-sm transition-all duration-500 hover:bg-blue-600 dark:hover:bg-blue-500"
                      ></div>
                    </div>
                    <span className="text-xs text-slate-400 group-hover:text-blue-500">
                      {i + 1} Des
                    </span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Popular Products / Activity */}
          <Card className="col-span-1 shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <CardBody className="p-6">
              <Typography variant="h5" className="font-bold text-slate-800 dark:text-white mb-6">
                Buku Terpopuler
              </Typography>
              <div className="space-y-6">
                {popularBooks.map((book, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-2">
                      <Typography className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {book.name}
                      </Typography>
                      <Typography className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {book.sales}%
                      </Typography>
                    </div>
                    <Progress value={book.sales} color={book.color as any} size="sm" className="bg-slate-100 dark:bg-slate-800" />
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-4">
                    <Avatar shape="circular" size="sm" alt="user 1" className="border-2 border-white dark:border-slate-900 hover:z-10 focus:z-10" src="https://i.pravatar.cc/150?u=1" />
                    <Avatar shape="circular" size="sm" alt="user 2" className="border-2 border-white dark:border-slate-900 hover:z-10 focus:z-10" src="https://i.pravatar.cc/150?u=2" />
                    <Avatar shape="circular" size="sm" alt="user 3" className="border-2 border-white dark:border-slate-900 hover:z-10 focus:z-10" src="https://i.pravatar.cc/150?u=3" />
                    <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 text-xs font-bold flex items-center justify-center text-slate-600 dark:text-slate-300 relative hover:z-10 focus:z-10">
                      +5
                    </div>
                  </div>
                  <Typography className="text-xs text-slate-500">Pelanggan baru minggu ini</Typography>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Recent Transactions Table */}
        <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <CardBody className="p-0 overflow-x-auto">
            <div className="p-6 flex items-center justify-between">
              <Typography variant="h5" className="font-bold text-slate-800 dark:text-white">
                Transaksi Terakhir
              </Typography>
              <IconButton variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
                <MoreVerticalIcon className="w-5 h-5" />
              </IconButton>
            </div>
            <table className="w-full min-w-max table-auto text-left">
              <thead>
                <tr>
                  {["Transaksi", "User", "Jumlah", "Status", "Tanggal", ""].map((head) => (
                    <th key={head} className="border-y border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-4">
                      <Typography variant="small" className="font-normal leading-none opacity-70 dark:text-slate-300">
                        {head}
                      </Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map(({ id, user, amount, status, date, img }, index) => {
                  const isLast = index === recentTransactions.length - 1;
                  const classes = isLast ? "p-4" : "p-4 border-b border-slate-100 dark:border-slate-800";

                  return (
                    <tr key={id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className={classes}>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-500">
                            <BanknoteIcon className="h-4 w-4" />
                          </div>
                          <Typography variant="small" className="font-bold dark:text-white">
                            {id}
                          </Typography>
                        </div>
                      </td>
                      <td className={classes}>
                        <div className="flex items-center gap-3">
                          <Avatar src={img} alt={user} size="sm" />
                          <Typography variant="small" className="font-normal dark:text-slate-300">
                            {user}
                          </Typography>
                        </div>
                      </td>
                      <td className={classes}>
                        <Typography variant="small" className="font-normal dark:text-slate-300">
                          {amount}
                        </Typography>
                      </td>
                      <td className={classes}>
                        <div className="w-max">
                          <Chip
                            variant="ghost"
                            size="sm"
                            color={status === "success" ? "success" : status === "pending" ? "warning" : "error"}
                          >
                            <Chip.Icon>
                              {
                                status === "success" ? <CheckCircle2Icon className="h-4 w-4" /> :
                                  status === "pending" ? <ClockIcon className="h-4 w-4" /> : <XCircleIcon className="h-4 w-4" />
                              }
                            </Chip.Icon>
                            <Chip.Label>{status}</Chip.Label>
                          </Chip>
                        </div>
                      </td>
                      <td className={classes}>
                        <Typography variant="small" className="font-normal dark:text-slate-300">
                          {date}
                        </Typography>
                      </td>
                      <td className={classes}>
                        <IconButton variant="ghost" size="sm" className="dark:text-white">
                          <MoreVerticalIcon className="h-4 w-4" />
                        </IconButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

Index.layout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>
}