import React from "react";
import UserLayout from "@/Layouts/UserLayout";
import { Head } from "@inertiajs/react";
import { Card, Typography } from "@material-tailwind/react";
import { Construction, Hammer, WrenchIcon } from "lucide-react";

export default function Dashboard() {
  return (
    <>
      <Head title="Dashboard" />

      <div className="min-h-[calc(100vh-180px)] flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full border border-slate-200 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <Card.Body className="p-8 md:p-12 text-center space-y-6">
            <div className="flex justify-center gap-4 mb-4">
              <div className="relative">
                <Construction className="h-16 w-16 text-primary animate-bounce" />
                <WrenchIcon className="h-8 w-8 text-warning absolute -right-2 -bottom-2 animate-pulse" />
              </div>
            </div>

            <div className="space-y-3">
              <Typography type="h3" className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
                Halaman Sedang Dalam Pengembangan
              </Typography>

              <Typography className="text-base md:text-lg text-slate-600 dark:text-slate-300">
                Dashboard untuk siswa sedang dalam proses pembuatan
              </Typography>
            </div>

            <div className="pt-4 space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Hammer className="h-4 w-4" />
                <span>Tim kami sedang bekerja keras untuk menyelesaikannya</span>
              </div>

              <Typography className="text-sm text-slate-500 dark:text-slate-400">
                Terima kasih atas kesabaran Anda 🙏
              </Typography>
            </div>

            <div className="pt-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse delay-75"></span>
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse delay-150"></span>
                </div>
                <Typography className="text-sm font-medium">
                  Segera Hadir
                </Typography>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </>
  );
}

Dashboard.layout = (page: React.ReactNode) => {
  return <UserLayout>{page}</UserLayout>;
};
