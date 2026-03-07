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
import { Head, router } from "@inertiajs/react";
import { route } from "ziggy-js";
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
  ArrowRightIcon,
  Video,
  TicketIcon
} from "lucide-react";

const popularBooks = [
  { name: "Panduan Belajar Membaca", sales: 85, color: "blue" },
  { name: "Matematika Dasar", sales: 65, color: "green" },
  { name: "Ilmu Pengetahuan Alam", sales: 45, color: "orange" },
  { name: "Sejarah Indonesia", sales: 30, color: "red" },
];

interface Stats {
  total_books: number;
  total_users: number;
  total_videos: number;
  total_activation_codes: number;
}

export default function Index({ stats }: { stats: Stats }) {
  const statCards = [
    {
      title: "Total Buku",
      value: stats.total_books.toLocaleString(),
      icon: BookOpenIcon,
      color: "bg-blue-500",
      textColor: "text-blue-600",
    },
    {
      title: "Pengguna Terdaftar",
      value: stats.total_users.toLocaleString(),
      icon: UsersIcon,
      color: "bg-orange-500",
      textColor: "text-orange-600",
    },
    {
      title: "Total Video",
      value: stats.total_videos.toLocaleString(),
      icon: Video,
      color: "bg-green-500",
      textColor: "text-green-600",
    },
    {
      title: "Total Aktivasi",
      value: stats.total_activation_codes.toLocaleString(),
      icon: TicketIcon,
      color: "bg-purple-500",
      textColor: "text-purple-600",
    }
  ];

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
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
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
                  <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10 ${stat.textColor}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
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
      </div>
    </>
  );
}

Index.layout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>
}