import React, { useRef, useState } from "react";
import {
  Avatar,
  Card,
  CardBody,
  Typography,
  Button,
  Input,
  IconButton,
} from "@material-tailwind/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, useForm, usePage } from "@inertiajs/react";
import {
  AtSign,
  CameraIcon,
  LockIcon,
  MailIcon,
  PhoneIcon,
  SaveIcon,
  UserIcon,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { PageHeader } from "@/Components/PageHeader";
import { route } from "ziggy-js";

interface User {
  id: number;
  name: string;
  email: string;
  username: string | null;
  phone: string | null;
  avatar: string | null;
  image: string;
  role: string;
}

export default function Edit({ user }: { user: User }) {
  const { flash } = usePage<{ flash: { status?: string } }>().props;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const profileForm = useForm({
    name: user.name,
    email: user.email,
    username: user.username || "",
    phone: user.phone || "",
    avatar: null as File | null,
    _method: "post",
  });

  const passwordForm = useForm({
    current_password: "",
    password: "",
    password_confirmation: "",
    _method: "put",
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    profileForm.post(route("admin.profile.update"), {
      forceFormData: true,
      onSuccess: () => {
        toast.success("Profil berhasil diperbarui.");
        setAvatarPreview(null);
      },
      onError: () => toast.error("Gagal memperbarui profil."),
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    passwordForm.post(route("admin.profile.password"), {
      onSuccess: () => {
        toast.success("Password berhasil diperbarui.");
        passwordForm.reset();
      },
      onError: () => toast.error("Gagal memperbarui password."),
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      profileForm.setData("avatar", file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAvatarPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <Head title="Profil Saya" />
      <Toaster position="top-center" />

      <div className="p-4 space-y-6">
        <PageHeader
          title="Profil Saya"
          description="Kelola informasi profil dan keamanan akun Anda"
        />

        {/* Profile Information */}
        <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900 overflow-hidden max-w-2xl">
          <CardBody className="p-6">
            <Typography variant="h6" className="text-slate-800 dark:text-white mb-6">
              Informasi Profil
            </Typography>

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar
                    src={avatarPreview || user.image}
                    alt={user.name}
                    className="w-20 h-20 border-2 border-slate-200 dark:border-slate-700"
                  />
                  <IconButton
                    size="sm"
                    className="!absolute -bottom-1 -right-1 rounded-full"
                    color="primary"
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    <CameraIcon className="w-3.5 h-3.5" />
                  </IconButton>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpg,image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <div>
                  <Typography className="font-semibold text-slate-800 dark:text-white">
                    Foto Profil
                  </Typography>
                  <Typography type="small" className="text-slate-500 dark:text-slate-400">
                    JPG, PNG atau WebP. Maks 2MB.
                  </Typography>
                </div>
              </div>
              {profileForm.errors.avatar && (
                <Typography type="small" color="error" className="block">
                  {profileForm.errors.avatar}
                </Typography>
              )}

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <Typography as="label" htmlFor="name" type="small" color="default" className="font-semibold dark:text-white">
                    Nama Lengkap
                  </Typography>
                  <Input
                    id="name"
                    placeholder="Masukkan nama lengkap"
                    value={profileForm.data.name}
                    onChange={(e) => profileForm.setData("name", e.target.value)}
                    isError={!!profileForm.errors.name}
                  >
                    <Input.Icon><UserIcon className="w-4 h-4" /></Input.Icon>
                  </Input>
                  {profileForm.errors.name && (
                    <Typography type="small" color="error" className="mt-1 block">
                      {profileForm.errors.name}
                    </Typography>
                  )}
                </div>

                <div className="space-y-1">
                  <Typography as="label" htmlFor="username" type="small" color="default" className="font-semibold dark:text-white">
                    Username
                  </Typography>
                  <Input
                    id="username"
                    placeholder="Masukkan username"
                    value={profileForm.data.username}
                    onChange={(e) => profileForm.setData("username", e.target.value)}
                    isError={!!profileForm.errors.username}
                  >
                    <Input.Icon>
                      <AtSign className="w-4 h-4" />
                    </Input.Icon>
                  </Input>
                  {profileForm.errors.username && (
                    <Typography type="small" color="error" className="mt-1 block">
                      {profileForm.errors.username}
                    </Typography>
                  )}
                </div>

                <div className="space-y-1">
                  <Typography as="label" htmlFor="email" type="small" color="default" className="font-semibold dark:text-white">
                    Email
                  </Typography>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@email.com"
                    value={profileForm.data.email}
                    onChange={(e) => profileForm.setData("email", e.target.value)}
                    isError={!!profileForm.errors.email}
                  >
                    <Input.Icon><MailIcon className="w-4 h-4" /></Input.Icon>
                  </Input>
                  {profileForm.errors.email && (
                    <Typography type="small" color="error" className="mt-1 block">
                      {profileForm.errors.email}
                    </Typography>
                  )}
                </div>

                <div className="space-y-1">
                  <Typography as="label" htmlFor="phone" type="small" color="default" className="font-semibold dark:text-white">
                    Nomor Telepon
                  </Typography>
                  <Input
                    id="phone"
                    placeholder="08123456789"
                    value={profileForm.data.phone}
                    onChange={(e) => profileForm.setData("phone", e.target.value)}
                    isError={!!profileForm.errors.phone}
                  >
                    <Input.Icon><PhoneIcon className="w-4 h-4" /></Input.Icon>
                  </Input>
                  {profileForm.errors.phone && (
                    <Typography type="small" color="error" className="mt-1 block">
                      {profileForm.errors.phone}
                    </Typography>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="submit"
                  color="primary"
                  disabled={profileForm.processing}
                  className="flex items-center gap-2"
                >
                  {profileForm.processing ? "Menyimpan..." : (
                    <>
                      <SaveIcon className="w-4 h-4" /> Simpan Profil
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Change Password */}
        <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900 overflow-hidden max-w-2xl">
          <CardBody className="p-6">
            <Typography variant="h6" className="text-slate-800 dark:text-white mb-2">
              Ubah Password
            </Typography>
            <Typography type="small" className="text-slate-500 dark:text-slate-400 mb-6">
              Pastikan akun Anda menggunakan password yang kuat dan unik.
            </Typography>

            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="space-y-1">
                <Typography as="label" htmlFor="current_password" type="small" color="default" className="font-semibold dark:text-white">
                  Password Saat Ini
                </Typography>
                <Input
                  id="current_password"
                  type="password"
                  placeholder="Masukkan password saat ini"
                  value={passwordForm.data.current_password}
                  onChange={(e) => passwordForm.setData("current_password", e.target.value)}
                  isError={!!passwordForm.errors.current_password}
                >
                  <Input.Icon><LockIcon className="w-4 h-4" /></Input.Icon>
                </Input>
                {passwordForm.errors.current_password && (
                  <Typography type="small" color="error" className="mt-1 block">
                    {passwordForm.errors.current_password}
                  </Typography>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <Typography as="label" htmlFor="password" type="small" color="default" className="font-semibold dark:text-white">
                    Password Baru
                  </Typography>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 8 karakter"
                    value={passwordForm.data.password}
                    onChange={(e) => passwordForm.setData("password", e.target.value)}
                    isError={!!passwordForm.errors.password}
                  >
                    <Input.Icon><LockIcon className="w-4 h-4" /></Input.Icon>
                  </Input>
                  {passwordForm.errors.password && (
                    <Typography type="small" color="error" className="mt-1 block">
                      {passwordForm.errors.password}
                    </Typography>
                  )}
                </div>

                <div className="space-y-1">
                  <Typography as="label" htmlFor="password_confirmation" type="small" color="default" className="font-semibold dark:text-white">
                    Konfirmasi Password Baru
                  </Typography>
                  <Input
                    id="password_confirmation"
                    type="password"
                    placeholder="Ulangi password baru"
                    value={passwordForm.data.password_confirmation}
                    onChange={(e) => passwordForm.setData("password_confirmation", e.target.value)}
                    isError={!!passwordForm.errors.password_confirmation}
                  >
                    <Input.Icon><LockIcon className="w-4 h-4" /></Input.Icon>
                  </Input>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="submit"
                  color="primary"
                  disabled={passwordForm.processing}
                  className="flex items-center gap-2"
                >
                  {passwordForm.processing ? "Menyimpan..." : (
                    <>
                      <LockIcon className="w-4 h-4" /> Ubah Password
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

Edit.layout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>;
};
