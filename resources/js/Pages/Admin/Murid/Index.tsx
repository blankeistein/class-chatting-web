import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Card,
  Chip,
  Dialog,
  IconButton,
  Input,
  Menu,
  Select,
  Typography,
} from "@material-tailwind/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Autocomplete, { type AutocompleteOption } from "@/Components/Autocomplete";
import { Head, router, useForm } from "@inertiajs/react";
import {
  EditIcon,
  EyeIcon,
  GraduationCapIcon,
  MoreVerticalIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import Pagination from "@/Components/Pagination";
import { PageHeader } from "@/Components/PageHeader";
import axios from "axios";

type Student = {
  id: number;
  user_id: number;
  school_id: number;
  name?: string | null;
  nis: string | null;
  nisn: string | null;
  class_name: string | null;
  gender: string | null;
  is_active: boolean;
  user?: {
    id: number;
    name: string;
    email: string;
  } | null;
  school?: {
    id: number;
    code: string;
    name: string;
  } | null;
};

type SchoolOption = {
  id: number;
  code: string;
  name: string;
  npsn: string | null;
};

type Filters = {
  search?: string;
  school_id?: string | number;
  class_name?: string;
  is_active?: string | boolean | null;
  sort_by?: string;
  sort_direction?: string;
  per_page?: number;
};

type StudentsPayload = {
  data: Student[];
  meta?: {
    links: Array<{ url: string | null; label: string; active: boolean }>;
  };
  links?: Array<{ url: string | null; label: string; active: boolean }>;
};

const SCHOOL_PAGE_SIZE = 25;
const SCHOOL_SEARCH_MIN = 3;

function formatSchoolLabel(school: Pick<SchoolOption, "name" | "npsn" | "code">): string {
  const parts = [school.name];
  if (school.npsn) {
    parts.push(school.npsn);
  } else if (school.code) {
    parts.push(school.code);
  }
  return parts.join(" · ");
}

export default function Index({
  students: paginatedStudents,
  filters,
  filterOptions,
  selectedSchool,
}: {
  students: StudentsPayload;
  filters?: Filters;
  filterOptions: {
    classNames: string[];
  };
  selectedSchool?: SchoolOption | null;
}) {
  const [students, setStudents] = useState<Student[]>(paginatedStudents.data);
  const [search, setSearch] = useState(filters?.search || "");
  const [schoolId, setSchoolId] = useState(filters?.school_id ? String(filters.school_id) : "");
  const [schoolLabel, setSchoolLabel] = useState(
    selectedSchool ? formatSchoolLabel(selectedSchool) : "",
  );
  const [className, setClassName] = useState(filters?.class_name || "");
  const [isActive, setIsActive] = useState(
    filters?.is_active === null || filters?.is_active === undefined || filters?.is_active === ""
      ? ""
      : String(filters.is_active),
  );
  const [perPage, setPerPage] = useState(filters?.per_page ? String(filters.per_page) : "25");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const deleteForm = useForm();

  const [schoolOptions, setSchoolOptions] = useState<AutocompleteOption[]>(() =>
    selectedSchool
      ? [{ value: String(selectedSchool.id), label: formatSchoolLabel(selectedSchool) }]
      : [],
  );
  const [isSchoolLoading, setIsSchoolLoading] = useState(false);
  const schoolSearchRequestId = useRef(0);
  const schoolSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setStudents(paginatedStudents.data);
  }, [paginatedStudents.data]);

  useEffect(() => {
    if (selectedSchool) {
      setSchoolId(String(selectedSchool.id));
      setSchoolLabel(formatSchoolLabel(selectedSchool));
      setSchoolOptions((current) => {
        const exists = current.some((item) => item.value === String(selectedSchool.id));
        if (exists) {
          return current;
        }

        return [
          { value: String(selectedSchool.id), label: formatSchoolLabel(selectedSchool) },
          ...current,
        ];
      });
    }
  }, [selectedSchool]);

  useEffect(() => {
    return () => {
      if (schoolSearchDebounceRef.current) {
        clearTimeout(schoolSearchDebounceRef.current);
      }
    };
  }, []);

  const fetchSchools = useCallback(async (query: string) => {
    const requestId = ++schoolSearchRequestId.current;
    setIsSchoolLoading(true);

    try {
      const params: Record<string, string | number> = {
        per_page: SCHOOL_PAGE_SIZE,
      };

      const trimmed = query.trim();
      if (trimmed.length >= SCHOOL_SEARCH_MIN) {
        params.search = trimmed;
      }

      const response = await axios.get<{ data: SchoolOption[] }>("/api/v1/schools", { params });

      if (requestId !== schoolSearchRequestId.current) {
        return;
      }

      const nextOptions = (response.data.data || []).map((school) => ({
        value: String(school.id),
        label: formatSchoolLabel(school),
      }));

      setSchoolOptions(nextOptions);
    } catch {
      if (requestId === schoolSearchRequestId.current) {
        setSchoolOptions([]);
        toast.error("Gagal memuat daftar sekolah.");
      }
    } finally {
      if (requestId === schoolSearchRequestId.current) {
        setIsSchoolLoading(false);
      }
    }
  }, []);

  const schoolSearchHint = useMemo(() => {
    return `Ketik minimal ${SCHOOL_SEARCH_MIN} karakter untuk mencari, atau buka untuk melihat ${SCHOOL_PAGE_SIZE} sekolah pertama.`;
  }, []);

  const handleSchoolSearchChange = useCallback(
    (query: string) => {
      if (schoolSearchDebounceRef.current) {
        clearTimeout(schoolSearchDebounceRef.current);
      }

      // Immediate load when opening (empty query); debounce typing.
      if (query.trim() === "") {
        void fetchSchools(query);
        return;
      }

      schoolSearchDebounceRef.current = setTimeout(() => {
        void fetchSchools(query);
      }, 300);
    },
    [fetchSchools],
  );

  const handleSchoolChange = (value: string) => {
    setSchoolId(value);

    if (!value) {
      setSchoolLabel("");
      return;
    }

    const selected = schoolOptions.find((item) => item.value === value);
    if (selected) {
      setSchoolLabel(selected.label);
    }
  };

  const handleFilter = () => {
    router.get(
      route("admin.students.index"),
      {
        search,
        school_id: schoolId || undefined,
        class_name: className || undefined,
        is_active: isActive === "" ? undefined : isActive,
        per_page: perPage,
        sort_by: filters?.sort_by || "created_at",
        sort_direction: filters?.sort_direction || "desc",
      },
      {
        preserveState: true,
        replace: true,
        only: ["students", "filters", "selectedSchool"],
      },
    );
  };

  const openDelete = (student: Student) => {
    setCurrentStudent(student);
    setIsDeleteOpen(true);
  };

  const handleDeleteSubmit = () => {
    if (!currentStudent) {
      return;
    }

    deleteForm.delete(route("admin.students.destroy", currentStudent.id), {
      onSuccess: () => {
        toast.success("Murid berhasil dihapus.");
        setIsDeleteOpen(false);
      },
      onError: () => toast.error("Gagal menghapus murid."),
    });
  };

  return (
    <>
      <Head title="Manajemen Murid" />
      <Toaster position="top-center" />

      <div className="min-h-screen space-y-6 p-4">
        <PageHeader
          title="Manajemen Murid"
          description="Kelola data murid per sekolah. Nama diambil dari akun user."
          actions={
            <Button
              className="flex items-center gap-2 border border-surface bg-slate-900 shadow-none dark:border-none dark:bg-white dark:text-slate-900"
              size="sm"
              onClick={() => router.get(route("admin.students.create"))}
            >
              <PlusIcon className="h-4 w-4" />
              Tambah Murid
            </Button>
          }
        />

        <Card className="border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-visible">
          <Card.Body className="flex flex-col gap-3 p-4 lg:flex-row lg:items-end">
            <div className="w-full space-y-1 lg:flex-1">
              <Typography as="label" type="small" className="font-semibold">
                Cari
              </Typography>
              <Input
                placeholder="Cari nama user, email, NIS, atau NISN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFilter()}
              >
                <Input.Icon>
                  <SearchIcon className="h-4 w-4 cursor-pointer" onClick={handleFilter} />
                </Input.Icon>
              </Input>
            </div>

            <div className="w-full space-y-1 lg:w-72">
              <Typography as="label" type="small" className="font-semibold">
                Sekolah
              </Typography>
              <Autocomplete
                options={schoolOptions}
                value={schoolId}
                onChange={handleSchoolChange}
                onSearchChange={handleSchoolSearchChange}
                selectedLabel={schoolLabel}
                loading={isSchoolLoading}
                placeholder="Cari sekolah..."
                emptyMessage={
                  isSchoolLoading
                    ? "Memuat..."
                    : `Tidak ada sekolah. ${schoolSearchHint}`
                }
              />
            </div>

            <div className="w-full space-y-1 lg:w-40">
              <Typography as="label" type="small" className="font-semibold">
                Kelas
              </Typography>
              <Select value={className} onValueChange={(val) => setClassName(val)}>
                <Select.Trigger placeholder="Semua kelas">
                  {() => className || "Semua kelas"}
                </Select.Trigger>
                <Select.List className="max-h-64 overflow-auto">
                  <Select.Option value="">Semua kelas</Select.Option>
                  {filterOptions.classNames.map((item) => (
                    <Select.Option key={item} value={item}>
                      {item}
                    </Select.Option>
                  ))}
                </Select.List>
              </Select>
            </div>

            <div className="w-full space-y-1 lg:w-36">
              <Typography as="label" type="small" className="font-semibold">
                Status
              </Typography>
              <Select value={isActive} onValueChange={(val) => setIsActive(val)}>
                <Select.Trigger placeholder="Semua">
                  {() => (isActive === "true" ? "Aktif" : isActive === "false" ? "Nonaktif" : "Semua")}
                </Select.Trigger>
                <Select.List>
                  <Select.Option value="">Semua</Select.Option>
                  <Select.Option value="true">Aktif</Select.Option>
                  <Select.Option value="false">Nonaktif</Select.Option>
                </Select.List>
              </Select>
            </div>

            <div className="w-full space-y-1 lg:w-32">
              <Typography as="label" type="small" className="font-semibold">
                Per halaman
              </Typography>
              <Select value={perPage} onValueChange={(val) => setPerPage(val)}>
                <Select.Trigger>{() => `${perPage} item`}</Select.Trigger>
                <Select.List>
                  {["25", "50", "100"].map((opt) => (
                    <Select.Option key={opt} value={opt}>
                      {opt} item
                    </Select.Option>
                  ))}
                </Select.List>
              </Select>
            </div>

            <Button size="sm" onClick={handleFilter}>
              Terapkan
            </Button>
          </Card.Body>
        </Card>

        <Pagination paginated={paginatedStudents} />

        {students.length > 0 ? (
          <Card className="overflow-hidden border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max table-auto text-left">
                <thead>
                  <tr>
                    {["Murid", "Sekolah", "NIS / NISN", "Kelas", "Gender", "Status", "Aksi"].map((head) => (
                      <th
                        key={head}
                        className="border-y border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/50"
                      >
                        <Typography
                          variant="small"
                          className="font-bold leading-none text-slate-500 opacity-70 dark:text-slate-300"
                        >
                          {head}
                        </Typography>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr
                      key={student.id}
                      className="border-b border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                            <GraduationCapIcon className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                          </div>
                          <div>
                            <Typography className="font-semibold text-slate-800 dark:text-white">
                              {student.user?.name || student.name || "-"}
                            </Typography>
                            <Typography type="small" className="text-slate-500">
                              {student.user?.email || "-"}
                            </Typography>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Typography className="font-medium dark:text-white">
                          {student.school?.name || "-"}
                        </Typography>
                        <Typography type="small" className="text-slate-500">
                          {student.school?.code || ""}
                        </Typography>
                      </td>
                      <td className="p-4">
                        <Typography className="dark:text-white">{student.nis || "-"}</Typography>
                        <Typography type="small" className="text-slate-500">
                          {student.nisn || "-"}
                        </Typography>
                      </td>
                      <td className="p-4">
                        <Typography className="dark:text-white">{student.class_name || "-"}</Typography>
                      </td>
                      <td className="p-4">
                        <Typography className="dark:text-white">
                          {student.gender === "L" ? "Laki-laki" : student.gender === "P" ? "Perempuan" : "-"}
                        </Typography>
                      </td>
                      <td className="p-4">
                        <Chip size="sm" color={student.is_active ? "success" : "secondary"} variant="ghost">
                          {student.is_active ? "Aktif" : "Nonaktif"}
                        </Chip>
                      </td>
                      <td className="p-4">
                        <Menu>
                          <Menu.Trigger
                            as={IconButton}
                            size="sm"
                            variant="ghost"
                            className="dark:text-white"
                          >
                            <MoreVerticalIcon className="h-4 w-4" />
                          </Menu.Trigger>
                          <Menu.Content>
                            <Menu.Item
                              onClick={() => router.get(route("admin.students.show", student.id))}
                              className="flex items-center gap-2"
                            >
                              <EyeIcon className="h-4 w-4" /> Detail
                            </Menu.Item>
                            <Menu.Item
                              onClick={() => router.get(route("admin.students.edit", student.id))}
                              className="flex items-center gap-2"
                            >
                              <EditIcon className="h-4 w-4" /> Edit
                            </Menu.Item>
                            <Menu.Item
                              onClick={() => openDelete(student)}
                              className="flex items-center gap-2 text-red-500"
                            >
                              <Trash2Icon className="h-4 w-4" /> Hapus
                            </Menu.Item>
                          </Menu.Content>
                        </Menu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card className="border border-dashed border-slate-300 p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <GraduationCapIcon className="mx-auto mb-3 h-10 w-10 text-slate-400" />
            <Typography className="font-semibold dark:text-white">Belum ada data murid</Typography>
            <Typography type="small" className="mt-1 text-slate-500">
              Tambah murid dengan mengaitkan akun user ke sekolah.
            </Typography>
          </Card>
        )}
      </div>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <Dialog.Overlay>
          <Dialog.Content>
            <div className="flex items-center justify-between gap-4">
              <Typography type="h6">Hapus Murid</Typography>
            </div>
            <Typography className="mb-6 mt-2 text-foreground">
              Hapus data murid{" "}
              <strong>{currentStudent?.user?.name || currentStudent?.name}</strong>? Akun user tidak
              dihapus.
            </Typography>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>
                Batal
              </Button>
              <Button color="error" onClick={handleDeleteSubmit} disabled={deleteForm.processing}>
                Hapus
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
