import React, { useState } from "react";
import {
  Card,
  CardBody,
  Typography,
  Button,
  Input,
  IconButton,
  Select,
  Switch,
} from "@material-tailwind/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { ArrowLeftIcon, SaveIcon, UserPlusIcon, LockIcon, MailIcon, UserIcon, PhoneIcon, ImageIcon, XIcon, AtSignIcon } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { PageHeader } from "@/Components/PageHeader";
import { ROLES, ROLE_LABELS } from "@/constants/roles";

export default function Create() {
  const { data, setData, post, processing, errors } = useForm({
    name: "",
    email: "",
    username: "",
    phone: "",
    role: ROLES.USER as string,
    password: "",
    password_confirmation: "",
    is_active: true,
    photo: null as File | null,
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setData("photo", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setData("photo", null);
    setPhotoPreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route("admin.users.store"), {
      onSuccess: () => {
        toast.success("User berhasil ditambahkan.");
      },
      onError: (formErrors) => {
        const message =
          formErrors.authorization ||
          formErrors.role ||
          Object.values(formErrors)[0] ||
          "Gagal menambahkan user. Periksa kembali form Anda.";
        toast.error(String(message));
      },
    });
  };

  return (
    <>
      <Head title="Tambah Pengguna" />
      <Toaster position="top-center" />

      <div className="p-4 space-y-6">
        <PageHeader
          title="Tambah Pengguna"
          backAction={
            <IconButton
              variant="ghost"
              onClick={() => router.get(route("admin.users.index"))}
            >
              <ArrowLeftIcon className="w-5 h-5 dark:text-white" />
            </IconButton>
          }
        />

        <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900 overflow-hidden max-w-2xl mx-auto">
          <CardBody className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Photo Upload Section */}
              <div className="space-y-3">
                <Typography as="label" type="small" color="default" className="font-semibold dark:text-white">
                  Foto Profil
                </Typography>
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-24 h-24 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                      />
                      <IconButton
                        type="button"
                        size="xs"
                        color="error"
                        onClick={removePhoto}
                        className="absolute -top-2 -right-2 p-1 rounded-full"
                      >
                        <XIcon className="w-4 h-4" />
                      </IconButton>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600">
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 flex flex-col items-start">
                    <input
                      type="file"
                      id="photo"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <Button
                      as="label"
                      size="sm"
                      htmlFor="photo"
                      className="cursor-pointer"
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Pilih Foto
                    </Button>
                    <Typography type="small" className="text-xs mt-2 text-slate-500 dark:text-slate-400">
                      Format: JPG, PNG, GIF, WEBP. Maksimal 2MB.
                    </Typography>
                  </div>
                </div>
                {errors.photo && (
                  <Typography type="small" color="error" className="mt-1 block text-xs">
                    {errors.photo}
                  </Typography>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <Typography as="label" htmlFor="name" type="small" color="default" className="font-semibold dark:text-white">
                    Nama Lengkap
                  </Typography>
                  <Input
                    id="name"
                    placeholder="Masukkan nama lengkap"
                    value={data.name}
                    onChange={(e) => setData("name", e.target.value)}
                    isError={!!errors.name}
                  >
                    <Input.Icon><UserIcon className="w-4 h-4" /></Input.Icon>
                  </Input>
                  {errors.name && (
                    <Typography type="small" color="error" className="mt-1 block">
                      {errors.name}
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
                    value={data.username}
                    onChange={(e) => setData("username", e.target.value)}
                    isError={!!errors.username}
                  >
                    <Input.Icon>
                      <AtSignIcon className="w-4 h-4" />
                    </Input.Icon>
                  </Input>
                  {errors.username && (
                    <Typography type="small" color="error" className="mt-1 block">
                      {errors.username}
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
                    value={data.email}
                    onChange={(e) => setData("email", e.target.value)}
                    isError={!!errors.email}
                  >
                    <Input.Icon><MailIcon className="w-4 h-4" /></Input.Icon>
                  </Input>
                  {errors.email && (
                    <Typography type="small" color="error" className="mt-1 block">
                      {errors.email}
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
                    value={data.phone}
                    onChange={(e) => setData("phone", e.target.value)}
                    isError={!!errors.phone}
                  >
                    <Input.Icon><PhoneIcon className="w-4 h-4" /></Input.Icon>
                  </Input>
                  {errors.phone && (
                    <Typography type="small" color="error" className="mt-1 block">
                      {errors.phone}
                    </Typography>
                  )}
                </div>

                <div className="space-y-1">
                  <Typography as="label" htmlFor="role" type="small" color="default" className="font-semibold dark:text-white">
                    Role User
                  </Typography>
                  <Select
                    value={data.role}
                    onValueChange={(val) => setData("role", val)}
                  >
                    <Select.Trigger placeholder="Pilih Role">
                      {() => ROLE_LABELS[data.role as keyof typeof ROLE_LABELS] || "Pilih Role"}
                    </Select.Trigger>
                    <Select.List>
                      <Select.Option value={ROLES.ADMIN}>{ROLE_LABELS[ROLES.ADMIN]}</Select.Option>
                      <Select.Option value={ROLES.STAFF}>{ROLE_LABELS[ROLES.STAFF]}</Select.Option>
                      <Select.Option value={ROLES.TEACHER}>{ROLE_LABELS[ROLES.TEACHER]}</Select.Option>
                      <Select.Option value={ROLES.STUDENT}>{ROLE_LABELS[ROLES.STUDENT]}</Select.Option>
                      <Select.Option value={ROLES.USER}>{ROLE_LABELS[ROLES.USER]}</Select.Option>
                    </Select.List>
                  </Select>
                  {errors.role && (
                    <Typography type="small" color="error" className="mt-1 block">
                      {errors.role}
                    </Typography>
                  )}
                </div>

                <div className="space-y-1 flex flex-col justify-end">
                  <div className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-800 rounded-lg">
                    <Switch
                      id="is_active"
                      checked={data.is_active}
                      onChange={(e) => setData("is_active", e.target.checked)}
                    />
                    <Typography as="label" htmlFor="is_active" type="small" className="font-medium dark:text-white cursor-pointer">
                      Status Akun Aktif
                    </Typography>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <Typography as="label" htmlFor="password" type="small" color="default" className="font-semibold dark:text-white">
                    Password
                  </Typography>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 8 karakter"
                    value={data.password}
                    onChange={(e) => setData("password", e.target.value)}
                    isError={!!errors.password}
                  >
                    <Input.Icon><LockIcon className="w-4 h-4" /></Input.Icon>
                  </Input>
                  {errors.password && (
                    <Typography type="small" color="error" className="mt-1 block">
                      {errors.password}
                    </Typography>
                  )}
                </div>

                <div className="space-y-1">
                  <Typography as="label" htmlFor="password_confirmation" type="small" color="default" className="font-semibold dark:text-white">
                    Konfirmasi Password
                  </Typography>
                  <Input
                    id="password_confirmation"
                    type="password"
                    placeholder="Ulangi password"
                    value={data.password_confirmation}
                    onChange={(e) => setData("password_confirmation", e.target.value)}
                    isError={!!errors.password_confirmation}
                  >
                    <Input.Icon><LockIcon className="w-4 h-4" /></Input.Icon>
                  </Input>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800 mt-6 gap-2">
                <Button
                  variant="ghost"
                  color="secondary"
                  type="button"
                  onClick={() => router.get(route("admin.users.index"))}
                  className="mr-2"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  disabled={processing}
                  className="flex items-center gap-2"
                >
                  {processing ? "Menyimpan..." : (
                    <>
                      <SaveIcon className="w-4 h-4" /> Simpan User
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

Create.layout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>;
};
