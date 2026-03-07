import React from "react";
import {
  Card,
  CardBody,
  Typography,
  Button,
  Chip,
  IconButton,
} from "@material-tailwind/react";
import {
  ArrowLeftIcon,
  TicketIcon,
  CopyIcon,
  UserIcon,
  MailIcon,
  BookOpenIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ShieldXIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PlusIcon,
  HashIcon,
  LayersIcon,
  InfinityIcon,
  SmartphoneIcon,
} from "lucide-react";
import { Head, router } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { toast, Toaster } from "react-hot-toast";

interface User {
  name: string;
  email: string;
}

interface BookModel {
  id: number;
  title: string;
}

interface ActivationItem {
  id: number;
  model_id: number;
  model_type: string;
  model?: BookModel;
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
  max_activated: number | null;
  is_active: boolean;
  items?: ActivationItem[];
  created_at: string;
  updated_at: string;
}

export default function Show({ activationCode }: { activationCode: { data: ActivationCode } }) {
  const code = activationCode.data;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code.code);
    toast.success("Kode disalin ke clipboard!");
  };

  const getStatus = () => {
    if (!code.is_active) return "revoked";
    if (code.max_activated && code.times_activated >= code.max_activated) return "used";
    if (code.times_activated > 0) return "active";
    return "available";
  };

  const status = getStatus();

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode; bgClass: string }> = {
    used: {
      label: "Sudah Digunakan",
      color: "success",
      icon: <CheckCircleIcon className="h-5 w-5" />,
      bgClass: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    },
    active: {
      label: "Aktif (Sebagian Terpakai)",
      color: "info",
      icon: <ClockIcon className="h-5 w-5" />,
      bgClass: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    },
    available: {
      label: "Tersedia",
      color: "warning",
      icon: <PlusIcon className="h-5 w-5" />,
      bgClass: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    },
    revoked: {
      label: "Dicabut / Nonaktif",
      color: "error",
      icon: <XCircleIcon className="h-5 w-5" />,
      bgClass: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    },
  };

  const currentStatus = statusConfig[status];

  const handleToggleActive = () => {
    router.patch(route('admin.activation-code.toggle-active', code.id), {}, {
      preserveState: true,
      onSuccess: () => {
        toast.success("Status kode berhasil diubah");
      },
    });
  };

  const handleDelete = () => {
    if (confirm("Apakah Anda yakin ingin menghapus kode aktivasi ini?")) {
      router.delete(route('admin.activation-code.destroy', code.id), {
        onSuccess: () => {
          toast.success("Kode berhasil dihapus");
        },
      });
    }
  };

  return (
    <>
      <Head title={`Detail Kode - ${code.code}`} />
      <Toaster position="top-center" />

      <div className="p-4 space-y-6 mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <IconButton
              variant="ghost"
              color="secondary"
              size="sm"
              onClick={() => router.get(route('admin.activation-code.index'))}
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </IconButton>
            <div>
              <Typography variant="h4" className="font-bold text-slate-800 dark:text-white">
                Detail Kode Aktivasi
              </Typography>
              <Typography variant="small" className="text-slate-500 dark:text-slate-400">
                Informasi lengkap kode aktivasi.
              </Typography>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              color={code.is_active ? "warning" : "success"}
              onClick={handleToggleActive}
            >
              {code.is_active ? <ShieldXIcon className="h-4 w-4 mr-2" /> : <ShieldCheckIcon className="h-4 w-4 mr-2" />}
              {code.is_active ? "Nonaktifkan" : "Aktifkan"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              color="error"
              onClick={handleDelete}
            >
              Hapus
            </Button>
          </div>
        </div>

        {/* Code Hero Card */}
        <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-800 dark:to-slate-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                <TicketIcon className="h-6 w-6 text-white" />
              </div>
              <Typography variant="small" className="text-white/70 font-medium uppercase tracking-widest text-xs">
                Kode Aktivasi
              </Typography>
            </div>
            <div className="flex items-center gap-4">
              <Typography variant="h3" className="font-mono font-bold text-white tracking-[0.2em] select-all">
                {code.code}
              </Typography>
              <IconButton
                variant="ghost"
                size="sm"
                onClick={handleCopyCode}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <CopyIcon className="h-4 w-4" />
              </IconButton>
            </div>
          </div>
        </Card>

        {/* Status & Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status Card */}
          <Card className={`shadow-sm border overflow-hidden ${currentStatus.bgClass}`}>
            <CardBody className="p-5">
              <div className="flex items-center gap-3 mb-3">
                {currentStatus.icon}
                <Typography variant="small" className="font-bold text-sm">
                  Status Kode
                </Typography>
              </div>
              <Chip
                variant="ghost"
                size="sm"
                color={currentStatus.color as any}
                className="w-fit"
              >
                <Chip.Label>{currentStatus.label}</Chip.Label>
              </Chip>
            </CardBody>
          </Card>

          {/* Usage Stats Card */}
          <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <CardBody className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <HashIcon className="h-5 w-5 text-slate-500" />
                <Typography variant="small" className="font-bold text-sm text-slate-700 dark:text-slate-300">
                  Penggunaan
                </Typography>
              </div>
              <div className="flex items-baseline gap-1">
                <Typography variant="h3" className="font-bold text-slate-800 dark:text-white">
                  {code.times_activated}
                </Typography>
                <Typography variant="small" className="text-slate-500 text-lg">
                  /
                </Typography>
                <Typography variant="h4" className="text-slate-500">
                  {code.max_activated ?? "∞"}
                </Typography>
              </div>
              <Typography variant="small" className="text-slate-400 text-xs mt-1">
                kali digunakan
              </Typography>
            </CardBody>
          </Card>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* General Info */}
          <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <CardBody className="p-5 space-y-4">
              <Typography variant="small" className="font-bold text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <LayersIcon className="h-4 w-4" /> Informasi Umum
              </Typography>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <Typography variant="small" className="text-slate-500 font-medium">Tier</Typography>
                  <Chip size="sm" variant="ghost" color={code.tier.value === 2 ? "warning" : "secondary"}>
                    <Chip.Label>{code.tier.label}</Chip.Label>
                  </Chip>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <Typography variant="small" className="text-slate-500 font-medium">Jenis Kode</Typography>
                  <Chip size="sm" variant="ghost" color={code.type === "public" ? "info" : "success"}>
                    <Chip.Label>{code.type === "public" ? "Public" : "Individual"}</Chip.Label>
                  </Chip>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <Typography variant="small" className="text-slate-500 font-medium">Maks. Aktivasi</Typography>
                  <Typography variant="small" className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    {code.max_activated ?? (
                      <span className="flex items-center gap-1">
                        <InfinityIcon className="h-4 w-4" /> Tanpa Batas
                      </span>
                    )}
                  </Typography>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <Typography variant="small" className="text-slate-500 font-medium">Status Aktif</Typography>
                  <Chip size="sm" variant="ghost" color={code.is_active ? "success" : "error"}>
                    <Chip.Label>{code.is_active ? "Aktif" : "Nonaktif"}</Chip.Label>
                  </Chip>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* User & Time Info */}
          <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <CardBody className="p-5 space-y-4">
              <Typography variant="small" className="font-bold text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <UserIcon className="h-4 w-4" /> Pengguna & Waktu
              </Typography>

              <div className="space-y-3">
                {code.user ? (
                  <>
                    <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-full">
                        <UserIcon className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                      </div>
                      <div>
                        <Typography variant="small" className="font-bold text-slate-700 dark:text-slate-300">
                          {code.user.name}
                        </Typography>
                        <Typography variant="small" className="text-slate-400 flex items-center gap-1 text-xs">
                          <MailIcon className="h-3 w-3" />
                          {code.user.email}
                        </Typography>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-full">
                      <UserIcon className="h-4 w-4 text-slate-400" />
                    </div>
                    <Typography variant="small" className="text-slate-400 italic">
                      Belum ada pengguna
                    </Typography>
                  </div>
                )}

                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <Typography variant="small" className="text-slate-500 font-medium flex items-center gap-1">
                    <CalendarIcon className="h-3.5 w-3.5" /> Aktivasi
                  </Typography>
                  <Typography variant="small" className="font-medium text-slate-700 dark:text-slate-300">
                    {code.activated_at
                      ? new Date(code.activated_at).toLocaleDateString("id-ID", {
                        day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                      })
                      : "—"}
                  </Typography>
                </div>

                {code.activated_in && (
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <Typography variant="small" className="text-slate-500 font-medium flex items-center gap-1">
                      <SmartphoneIcon className="h-3.5 w-3.5" /> Diaktivasi di
                    </Typography>
                    <Typography variant="small" className="font-medium text-slate-700 dark:text-slate-300">
                      {code.activated_in}
                    </Typography>
                  </div>
                )}

                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <Typography variant="small" className="text-slate-500 font-medium flex items-center gap-1">
                    <CalendarIcon className="h-3.5 w-3.5" /> Dibuat
                  </Typography>
                  <Typography variant="small" className="font-medium text-slate-700 dark:text-slate-300">
                    {new Date(code.created_at).toLocaleDateString("id-ID", {
                      day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                    })}
                  </Typography>
                </div>

                <div className="flex items-center justify-between py-2">
                  <Typography variant="small" className="text-slate-500 font-medium flex items-center gap-1">
                    <CalendarIcon className="h-3.5 w-3.5" /> Diperbarui
                  </Typography>
                  <Typography variant="small" className="font-medium text-slate-700 dark:text-slate-300">
                    {new Date(code.updated_at).toLocaleDateString("id-ID", {
                      day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                    })}
                  </Typography>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Books List */}
        <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <CardBody className="p-5">
            <Typography variant="small" className="font-bold text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-4">
              <BookOpenIcon className="h-4 w-4" /> Buku Terkait ({code.items?.length ?? 0})
            </Typography>

            {code.items && code.items.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {code.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                  >
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg shrink-0">
                      <BookOpenIcon className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <Typography variant="small" className="font-bold text-slate-700 dark:text-slate-300 truncate">
                        {item.model?.title || "Unknown Book"}
                      </Typography>
                      <Typography variant="small" className="text-[10px] text-slate-400">
                        ID: {item.model_id}
                      </Typography>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpenIcon className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <Typography variant="small" className="text-slate-400 italic">
                  Tidak ada buku terkait.
                </Typography>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}

Show.layout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>;
};
