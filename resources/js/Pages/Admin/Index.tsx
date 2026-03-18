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

      <div className="p-4 space-y-6 min-h-[calc(100vh-8rem)]">

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

      </div>
    </>
  );
}

Index.layout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>
}