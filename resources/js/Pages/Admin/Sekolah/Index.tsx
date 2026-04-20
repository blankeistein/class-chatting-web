import React, { useState } from "react";
import {
  Button,
  Card,
  Dialog,
  IconButton,
  Input,
  Menu,
  Typography,
} from "@material-tailwind/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, useForm } from "@inertiajs/react";
import {
  Building2Icon,
  EditIcon,
  MoreVerticalIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

type School = {
  id: number;
  code: string;
  old_code?: string | null;
  npsn: string | null;
  name: string;
  bentuk_pendidikan: string;
  status: "SWASTA" | "NEGERI";
  province?: {
    id: number;
    code: string;
    name: string;
  };
  regency?: {
    id: number;
    code: string;
    name: string;
    type: string | null;
  };
  district?: {
    id: number;
    code: string;
    name: string;
  };
  village?: {
    id: number;
    code: string;
    name: string;
  };
};

type PaginationLink = {
  url: string | null;
  label: string;
  active: boolean;
};

type SchoolsPayload = {
  data: School[];
  meta?: {
    links: PaginationLink[];
  };
  links?: PaginationLink[];
};

export default function Index({ schools: paginatedSchools, filters }: { schools: SchoolsPayload; filters?: { search?: string; per_page?: number } }) {
  const [schools, setSchools] = useState<School[]>(paginatedSchools.data);
  const [search, setSearch] = useState(filters?.search || "");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentSchool, setCurrentSchool] = useState<School | null>(null);
  const [csvFileName, setCsvFileName] = useState<string>("");

  const deleteForm = useForm();
  const importForm = useForm<{ file: File | null }>({
    file: null,
  });

  React.useEffect(() => {
    setSchools(paginatedSchools.data);
  }, [paginatedSchools.data]);

  const handleFilter = () => {
    router.get(route("admin.schools.index"), { search }, {
      preserveState: true,
      replace: true,
      only: ["schools", "filters"],
    });
  };

  const openDelete = (school: School) => {
    setCurrentSchool(school);
    setIsDeleteOpen(true);
  };

  const handleDeleteSubmit = () => {
    if (!currentSchool) {
      return;
    }

    deleteForm.delete(route("admin.schools.destroy", currentSchool.code), {
      onSuccess: () => {
        toast.success("Sekolah berhasil dihapus.");
        setIsDeleteOpen(false);
      },
      onError: () => {
        toast.error("Gagal menghapus sekolah.");
      },
    });
  };

  const handleImportSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    importForm.post(route("admin.schools.import"), {
      forceFormData: true,
      onSuccess: () => {
        toast.success("Import sekolah berhasil diproses.");
        setCsvFileName("");
        importForm.reset();
      },
      onError: () => {
        toast.error("Import sekolah gagal. Periksa file CSV Anda.");
      },
    });
  };

  const paginationLinks = paginatedSchools.meta?.links || paginatedSchools.links || [];

  return (
    <>
      <Head title="Manajemen Sekolah" />
      <Toaster position="top-center" />

      <div className="p-4 space-y-6 min-h-screen">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Typography variant="h4" className="font-bold text-slate-800 dark:text-white">
              Manajemen Sekolah
            </Typography>
            <Typography className="text-slate-500 dark:text-slate-400">
              Kelola data sekolah beserta referensi wilayahnya.
            </Typography>
          </div>
          <div className="w-full md:w-auto flex flex-col md:flex-row items-stretch md:items-center gap-2">
            <form className="flex items-center gap-2" onSubmit={handleImportSubmit}>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  importForm.setData("file", file);
                  setCsvFileName(file?.name ?? "");
                }}
                className="max-w-[220px] text-sm text-slate-600 dark:text-slate-300 file:mr-3 file:px-3 file:py-2 file:rounded-md file:border-0 file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200"
              />
              <Button type="submit" size="sm" variant="outline" disabled={importForm.processing || !importForm.data.file}>
                {importForm.processing ? "Import..." : "Import CSV"}
              </Button>
            </form>
            <Button
              size="sm"
              className="flex items-center gap-2"
              onClick={() => router.get(route("admin.schools.create"))}
            >
              <PlusIcon className="w-4 h-4" />
              Tambah Sekolah
            </Button>
          </div>
        </div>

        {csvFileName ? (
          <Typography className="text-sm text-slate-500 dark:text-slate-400">
            File dipilih: {csvFileName}
          </Typography>
        ) : null}

        <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <Card.Body className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="w-full md:w-80">
              <Input
                placeholder="Cari nama sekolah atau NPSN"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleFilter();
                  }
                }}
                className="dark:text-white"
              >
                <Input.Icon>
                  <SearchIcon className="w-4 h-4 cursor-pointer" onClick={handleFilter} />
                </Input.Icon>
              </Input>
            </div>
          </Card.Body>
        </Card>

        {schools.length > 0 ? (
          <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max table-auto text-left">
                <thead>
                  <tr>
                    {["Sekolah", "Bentuk", "Status", "NPSN", "Wilayah", "Aksi"].map((head) => (
                      <th key={head} className="border-y border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-4">
                        <Typography variant="small" className="font-bold leading-none opacity-70 text-slate-500 dark:text-slate-300">
                          {head}
                        </Typography>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {schools.map((school) => (
                    <tr
                      key={school.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <Building2Icon className="h-4 w-4 text-slate-500" />
                          </div>
                          <Typography variant="small" className="font-bold text-slate-800 dark:text-white">
                            {school.name}
                          </Typography>
                        </div>
                      </td>
                      <td className="p-4">
                        <Typography variant="small" className="font-medium text-slate-700 dark:text-slate-200">
                          {school.bentuk_pendidikan}
                        </Typography>
                      </td>
                      <td className="p-4">
                        <Typography variant="small" className="font-medium text-slate-700 dark:text-slate-200">
                          {school.status}
                        </Typography>
                      </td>
                      <td className="p-4">
                        <Typography variant="small" className="font-medium text-slate-700 dark:text-slate-200">
                          {school.npsn || "-"}
                        </Typography>
                      </td>
                      <td className="p-4">
                        <Typography variant="small" className="text-slate-700 dark:text-slate-200">
                          {school.village?.name || "-"}, {school.district?.name || "-"}
                        </Typography>
                        <Typography variant="small" className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                          {school.regency?.name || "-"}, {school.province?.name || "-"}
                        </Typography>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center">
                          <Menu placement="bottom-end">
                            <Menu.Trigger as={IconButton} variant="ghost" size="sm" color="secondary" className="rounded-full">
                              <MoreVerticalIcon className="w-5 h-5" />
                            </Menu.Trigger>
                            <Menu.Content className="z-20 min-w-[160px] dark:bg-slate-900 border-none shadow-xl">
                              <Menu.Item
                                className="flex items-center gap-2 dark:hover:bg-slate-800"
                                onClick={() => router.get(route("admin.schools.edit", school.code))}
                              >
                                <EditIcon className="w-4 h-4" />
                                Edit Sekolah
                              </Menu.Item>
                              <hr className="!my-1 -mx-1 border-slate-100 dark:border-slate-800" />
                              <Menu.Item
                                className="flex items-center gap-2 text-error dark:text-red-400 dark:hover:bg-slate-800"
                                onClick={() => openDelete(school)}
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
            <Building2Icon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
            <Typography className="text-slate-500 dark:text-slate-400">
              Belum ada data sekolah.
            </Typography>
          </div>
        )}

        <div className="mt-8 flex justify-center gap-2">
          {paginationLinks.map((link, key) => (
            <Button
              key={key}
              variant={link.active ? "solid" : "ghost"}
              size="sm"
              color={link.active ? "primary" : "secondary"}
              className={`flex items-center gap-2 ${!link.url ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
              dangerouslySetInnerHTML={{ __html: link.label }}
              disabled={!link.url}
            />
          ))}
        </div>
      </div>

      <Dialog open={isDeleteOpen} onOpenChange={() => setIsDeleteOpen(false)} size="sm">
        <Dialog.Overlay>
          <Dialog.Content className="dark:border-slate-800">
            <Typography type="h6" className="dark:text-white">Hapus Sekolah</Typography>
            <Typography className="mb-6 mt-2 text-foreground">
              Apakah Anda yakin ingin menghapus sekolah <strong>{currentSchool?.name}</strong>?
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
