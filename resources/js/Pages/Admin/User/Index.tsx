import React, { useState } from "react";
import {
  Card,
  Typography,
  Button,
  IconButton,
  Dialog,
  Menu,
  Input,
  Select,
  Chip,
  Avatar,
} from "@material-tailwind/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Checkbox from "@/Components/Checkbox";
import { Head, router, useForm } from "@inertiajs/react";
import {
  PlusIcon,
  UserIcon,
  EditIcon,
  Trash2Icon,
  MoreVerticalIcon,
  SearchIcon,
  UserCheckIcon,
  UserXIcon,
  EyeIcon,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import Pagination from "@/Components/Pagination";

interface User {
  id: number;
  name: string;
  email: string;
  username: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
  image: string;
  created_at: string;
}

const SORT_OPTIONS = [
  { label: "Terbaru", value: "latest" },
  { label: "Terlama", value: "oldest" },
  { label: "Nama (A-Z)", value: "name_asc" },
  { label: "Nama (Z-A)", value: "name_desc" },
];

const ROLE_OPTIONS = [
  { label: "Semua Role", value: "" },
  { label: "Admin", value: "admin" },
  { label: "Guru", value: "teacher" },
  { label: "Murid", value: "student" },
  { label: "User", value: "user" },
];

export default function Index({ users: paginatedUsers, filters }: { users: any, filters?: { search?: string, sort?: string, role?: string } }) {
  const [users, setUsers] = useState<User[]>(paginatedUsers.data);
  const [search, setSearch] = useState(filters?.search || "");
  const [perPage, setPerPage] = useState("25");
  const [sort, setSort] = useState(SORT_OPTIONS.find(o => o.value === (filters?.sort || "latest")) || SORT_OPTIONS[0]);
  const [role, setRole] = useState(ROLE_OPTIONS.find(o => o.value === (filters?.role || "")) || ROLE_OPTIONS[0]);

  // Modals state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  React.useEffect(() => {
    setUsers(paginatedUsers.data);
    setSelectedIds((currentIds) => currentIds.filter((id) => paginatedUsers.data.some((user: User) => user.id === id)));
  }, [paginatedUsers.data]);

  const handleFilter = () => {
    router.get(route('admin.users.index'), { search, sort: sort.value, role: role.value, perPage }, {
      preserveState: true,
      replace: true,
      only: ['users', 'filters']
    });
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFilter();
    }
  };

  // Delete Form
  const deleteForm = useForm();

  const openDelete = (user: User) => {
    setCurrentUser(user);
    setIsDeleteOpen(true);
  };

  const handleDeleteSubmit = () => {
    if (!currentUser) return;
    deleteForm.delete(route("admin.users.destroy", currentUser.id), {
      onSuccess: () => {
        toast.success("User berhasil dihapus.");
        setIsDeleteOpen(false);
      },
      onError: (errors: any) => {
        if (errors.error) {
          toast.error(errors.error);
        } else {
          toast.error("Gagal menghapus user.");
        }
      }
    });
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((currentIds) => (currentIds.includes(id) ? currentIds.filter((item) => item !== id) : [...currentIds, id]));
  };

  const toggleSelectAll = () => {
    if (users.length > 0 && selectedIds.length === users.length) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(users.map((user) => user.id));
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} user terpilih?`)) {
      return;
    }

    router.delete(route("admin.users.bulk-delete"), {
      data: { ids: selectedIds },
      preserveScroll: true,
      onSuccess: () => {
        setSelectedIds([]);
        toast.success("User terpilih berhasil dihapus.");
      },
      onError: (errors: any) => {
        console.error(errors)
        if (typeof errors === "object") {
          const errorMessages = Object.values(errors) as string[];
          errorMessages.forEach((msg: string) => toast.error(msg));
          return;
        } else {
          toast.error(errors || "Gagal menghapus user terpilih.");
        }
      },
    });
  };

  return (
    <>
      <Head title="Manajemen User" />
      <Toaster position="top-center" />

      <div className="p-4 space-y-6 min-h-screen">
        {selectedIds.length > 0 && (
          <Card color="secondary" className="fixed bottom-8 left-1/2 z-30 flex w-[90%] -translate-x-1/2 flex-row items-center justify-between gap-3 p-3 text-white shadow-xl lg:w-[560px]">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={users.length > 0 && selectedIds.length === users.length}
                onChange={toggleSelectAll}
                color="primary"
              />
              <Typography variant="small" className="font-bold text-white">
                {selectedIds.length} User Terpilih
              </Typography>
            </div>
            <Button
              size="sm"
              variant="ghost"
              color="error"
              className="flex items-center gap-2"
              onClick={handleBulkDelete}
            >
              <Trash2Icon className="h-4 w-4" />
              Hapus Terpilih
            </Button>
          </Card>
        )}

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Typography variant="h4" className="font-bold text-slate-800 dark:text-white">
              Daftar User
            </Typography>
            <Typography className="text-slate-500 dark:text-slate-400">
              Kelola pengguna aplikasi.
            </Typography>
          </div>
          <div className="flex gap-2">
            <Button
              className="flex items-center gap-2 bg-slate-900 dark:bg-white dark:text-slate-900 shadow-none border border-surface dark:border-none"
              size="sm"
              onClick={() => router.get(route("admin.users.create"))}
            >
              <PlusIcon className="w-4 h-4" />
              Tambah User
            </Button>
          </div>
        </div>

        {/* Toolbar Section */}
        <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <Card.Body className="flex flex-col gap-2 p-4">
            <div className="flex flex-col lg:flex-row items-stretch gap-3 w-full md:w-auto flex-1">
              <div className="w-full md:w-56">
                <Typography as="label" htmlFor="role" type="small" color="default" className="font-semibold">
                  Role
                </Typography>
                <Select
                  value={role.value}
                  onValueChange={(val) => {
                    const option = ROLE_OPTIONS.find(o => o.value === val);
                    if (option) {
                      setRole(option);
                      router.get(route('admin.users.index'), { search, sort: sort.value, role: val, perPage }, { preserveState: true, replace: true });
                    }
                  }}
                >
                  <Select.Trigger id="role" placeholder="Filter Role" >
                    {() => role.label || "Filter Role"}
                  </Select.Trigger>
                  <Select.List>
                    {ROLE_OPTIONS.map((opt) => (
                      <Select.Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Select.Option>
                    ))}
                  </Select.List>
                </Select>
              </div>
              <div className="w-full md:w-48">
                <Typography as="label" htmlFor="urutkan-berdasarkan" type="small" color="default" className="font-semibold">
                  Urutkan Berdasarkan
                </Typography>
                <Select
                  value={sort.value}
                  onValueChange={(val) => {
                    const option = SORT_OPTIONS.find(o => o.value === val);
                    if (option) {
                      setSort(option);
                      router.get(route('admin.users.index'), { search, sort: val, role: role.value, perPage }, { preserveState: true, replace: true });
                    }
                  }}
                >
                  <Select.Trigger id="urutkan-berdasarkan" placeholder="Urutkan" >
                    {() => sort.label || "Urutkan"}
                  </Select.Trigger>
                  <Select.List>
                    {SORT_OPTIONS.map((opt) => (
                      <Select.Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Select.Option>
                    ))}
                  </Select.List>
                </Select>
              </div>
              <div className="w-full md:w-48">
                <Typography as="label" htmlFor="jumlah-item" type="small" color="default" className="font-semibold">
                  Jumlah Item
                </Typography>
                <Select
                  value={perPage}
                  onValueChange={(val) => {
                    setPerPage(val);
                    router.get(route('admin.users.index'), { search, sort: sort.value, role: role.value, perPage: val }, { preserveState: true, replace: true });
                  }}
                >
                  <Select.Trigger id="jumlah-item" placeholder="per Hal" >
                    {() => perPage + " per Hal" || "per Hal"}
                  </Select.Trigger>
                  <Select.List>
                    {["25", "50", "100"].map((opt) => (
                      <Select.Option key={opt} value={opt}>
                        {opt} Item
                      </Select.Option>
                    ))}
                  </Select.List>
                </Select>
              </div>
            </div>
            <div className="flex flex-col lg:flex-row items-stretch gap-3 w-full md:w-auto flex-1">
              <div className="w-full">
                <Typography as="label" htmlFor="cari" type="small" color="default" className="font-semibold">
                  Cari
                </Typography>
                <Input
                  id="cari"
                  placeholder="Cari nama, email, atau username..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleSearchKeyPress}
                  className="pr-10 dark:text-white"
                >
                  <Input.Icon>
                    <SearchIcon className="w-4 h-4 cursor-pointer" onClick={handleFilter} />
                  </Input.Icon>
                </Input>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Pagination paginated={paginatedUsers} />

        {/* Content Area */}
        {users.length > 0 ? (
          <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max table-auto text-left">
                <thead>
                  <tr>
                    <th className="w-10 border-y border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-4">
                      <Checkbox
                        checked={users.length > 0 && selectedIds.length === users.length}
                        onChange={toggleSelectAll}
                        color="primary"
                      />
                    </th>
                    {["User", "Username / Phone", "Role", "Status", "Terdaftar", "Aksi"].map((head) => (
                      <th
                        key={head}
                        className="border-y border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-4"
                      >
                        <Typography
                          variant="small"
                          className="font-bold leading-none opacity-70 text-slate-500 dark:text-slate-300"
                        >
                          {head}
                        </Typography>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 ${selectedIds.includes(user.id) ? "bg-blue-50/30 dark:bg-blue-900/10" : ""}`}
                    >
                      <td className="p-4">
                        <Checkbox
                          checked={selectedIds.includes(user.id)}
                          onChange={() => toggleSelect(user.id)}
                          color="primary"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={user.image}
                            alt={user.name}
                            size="sm"
                          />
                          <div className="flex flex-col">
                            <Typography
                              variant="small"
                              className="font-bold text-slate-800 dark:text-white"
                            >
                              {user.name}
                            </Typography>
                            <Typography
                              variant="small"
                              className="text-slate-500 dark:text-slate-400 text-xs"
                            >
                              {user.email}
                            </Typography>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Typography variant="small" className="text-slate-700 dark:text-slate-300 font-medium">
                          @{user.username || '-'}
                        </Typography>
                        <Typography variant="small" className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                          {user.phone || '-'}
                        </Typography>
                      </td>
                      <td className="p-4 text-center">
                        <Chip
                          size="sm"
                          variant="ghost"
                          className={`capitalize w-max ${user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                        >
                          <Chip.Label>{user.role}</Chip.Label>
                        </Chip>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {user.is_active ? (
                            <div className="flex items-center gap-1.5 text-success dark:text-green-400">
                              <UserCheckIcon className="w-3.5 h-3.5" />
                              <Typography className="text-xs font-medium">Aktif</Typography>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-error dark:text-red-400">
                              <UserXIcon className="w-3.5 h-3.5" />
                              <Typography className="text-xs font-medium">Nonaktif</Typography>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Typography variant="small" className="text-slate-600 dark:text-slate-300">
                          {new Date(user.created_at).toLocaleDateString("id-ID", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </Typography>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center">
                          <Menu placement="bottom-end">
                            <Menu.Trigger
                              as={IconButton}
                              variant="ghost"
                              size="sm"
                              color="secondary"
                              className="rounded-full"
                            >
                              <MoreVerticalIcon className="w-5 h-5" />
                            </Menu.Trigger>
                            <Menu.Content className="z-20 min-w-[160px] dark:bg-slate-900 border-none shadow-xl">
                              <Menu.Item
                                className="flex items-center gap-2 dark:hover:bg-slate-800"
                                onClick={() => router.get(route("admin.users.show", user.id))}
                              >
                                <EyeIcon className="w-4 h-4" />
                                Lihat Info
                              </Menu.Item>
                              <Menu.Item
                                className="flex items-center gap-2 dark:hover:bg-slate-800"
                                onClick={() => router.get(route("admin.users.edit", user.id))}
                              >
                                <EditIcon className="w-4 h-4 " />
                                Edit User
                              </Menu.Item>
                              <hr className="!my-1 -mx-1 border-slate-100 dark:border-slate-800" />
                              <Menu.Item
                                className="flex items-center gap-2 text-error dark:text-red-400 dark:hover:bg-slate-800"
                                onClick={() => openDelete(user)}
                              >
                                <Trash2Icon className="w-4 h-4" />
                                Hapus
                              </Menu.Item>
                            </Menu.Content>
                          </Menu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-slate-50 border border-dashed border-slate-300 rounded-lg dark:bg-slate-900 dark:border-slate-700">
            <UserIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
            <Typography className="text-slate-500 dark:text-slate-400">
              Tidak ada user ditemukan.
            </Typography>
          </div>
        )}

        {/* Pagination */}
        <Pagination paginated={paginatedUsers} />
      </div>

      {/* --- Delete Modal --- */}
      <Dialog open={isDeleteOpen} onOpenChange={() => setIsDeleteOpen(false)} size="sm" >
        <Dialog.Overlay>
          <Dialog.Content className="dark:border-slate-800">
            <Typography type="h6">Hapus User</Typography>
            <Typography className="mb-6 mt-2 text-foreground">
              Apakah Anda yakin ingin menghapus user <strong>{currentUser?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </Typography>
            <div className="mb-1 flex items-center justify-end gap-2">
              <Button variant="ghost" color="secondary" onClick={() => setIsDeleteOpen(false)} className="mr-2">
                Batal
              </Button>
              <Button color="error" onClick={handleDeleteSubmit} disabled={deleteForm.processing}>
                {deleteForm.processing ? "Menghapus..." : "Ya, Hapus"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog>
    </>
  );
}

Index.layout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>;
};
