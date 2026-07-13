import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  IconButton,
  Input,
  Select,
  Switch,
  Typography,
} from "@material-tailwind/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Autocomplete, { type AutocompleteOption } from "@/Components/Autocomplete";
import { Head, router, useForm } from "@inertiajs/react";
import { ArrowLeftIcon, SaveIcon } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { PageHeader } from "@/Components/PageHeader";
import axios from "axios";

type UserOption = {
  id: number;
  name: string;
  email: string;
  username: string | null;
  role: string;
  is_active: boolean;
  avatar?: string;
};

type SchoolOption = {
  id: number;
  code: string;
  npsn: string | null;
  name: string;
};

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
  user?: UserOption | null;
  school?: SchoolOption | null;
};

const PAGE_SIZE = 25;
const SCHOOL_SEARCH_MIN = 3;

function formatUserLabel(user: Pick<UserOption, "name" | "email">): string {
  return `${user.name} (${user.email})`;
}

function formatSchoolLabel(school: Pick<SchoolOption, "name" | "npsn" | "code">): string {
  const parts = [school.name];
  if (school.npsn) {
    parts.push(school.npsn);
  } else if (school.code) {
    parts.push(school.code);
  }
  return parts.join(" · ");
}

export default function Edit({ student }: { student: { data: Student } }) {
  const studentData = student.data;

  const initialUserLabel = studentData.user
    ? formatUserLabel(studentData.user)
    : studentData.name || "";
  const initialSchoolLabel = studentData.school ? formatSchoolLabel(studentData.school) : "";

  const { data, setData, put, processing, errors, transform } = useForm({
    user_id: String(studentData.user_id),
    school_id: String(studentData.school_id),
    nis: studentData.nis || "",
    nisn: studentData.nisn || "",
    class_name: studentData.class_name || "",
    gender: studentData.gender || "",
    is_active: studentData.is_active,
  });

  const [userOptions, setUserOptions] = useState<AutocompleteOption[]>(() =>
    studentData.user
      ? [{ value: String(studentData.user.id), label: formatUserLabel(studentData.user) }]
      : [],
  );
  const [schoolOptions, setSchoolOptions] = useState<AutocompleteOption[]>(() =>
    studentData.school
      ? [{ value: String(studentData.school.id), label: formatSchoolLabel(studentData.school) }]
      : [],
  );
  const [userLabel, setUserLabel] = useState(initialUserLabel);
  const [schoolLabel, setSchoolLabel] = useState(initialSchoolLabel);
  const [selectedUserName, setSelectedUserName] = useState(studentData.user?.name || studentData.name || "");
  const [isUserLoading, setIsUserLoading] = useState(false);
  const [isSchoolLoading, setIsSchoolLoading] = useState(false);

  const userRequestId = useRef(0);
  const schoolRequestId = useRef(0);
  const userDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const schoolDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (userDebounceRef.current) clearTimeout(userDebounceRef.current);
      if (schoolDebounceRef.current) clearTimeout(schoolDebounceRef.current);
    };
  }, []);

  const fetchUsers = useCallback(
    async (query: string) => {
      const requestId = ++userRequestId.current;
      setIsUserLoading(true);

      try {
        const params: Record<string, string | number> = {
          per_page: PAGE_SIZE,
          include_user_id: studentData.user_id,
        };
        const trimmed = query.trim();
        if (trimmed !== "") {
          params.search = trimmed;
        }

        const response = await axios.get<{ data: UserOption[] }>(
          route("admin.students.available-users"),
          { params },
        );

        if (requestId !== userRequestId.current) {
          return;
        }

        setUserOptions(
          (response.data.data || []).map((user) => ({
            value: String(user.id),
            label: formatUserLabel(user),
          })),
        );
      } catch {
        if (requestId === userRequestId.current) {
          setUserOptions([]);
          toast.error("Gagal memuat daftar user.");
        }
      } finally {
        if (requestId === userRequestId.current) {
          setIsUserLoading(false);
        }
      }
    },
    [studentData.user_id],
  );

  const fetchSchools = useCallback(async (query: string) => {
    const requestId = ++schoolRequestId.current;
    setIsSchoolLoading(true);

    try {
      const params: Record<string, string | number> = { per_page: PAGE_SIZE };
      const trimmed = query.trim();
      if (trimmed.length >= SCHOOL_SEARCH_MIN) {
        params.search = trimmed;
      }

      const response = await axios.get<{ data: SchoolOption[] }>("/api/v1/schools", { params });

      if (requestId !== schoolRequestId.current) {
        return;
      }

      setSchoolOptions(
        (response.data.data || []).map((school) => ({
          value: String(school.id),
          label: formatSchoolLabel(school),
        })),
      );
    } catch {
      if (requestId === schoolRequestId.current) {
        setSchoolOptions([]);
        toast.error("Gagal memuat daftar sekolah.");
      }
    } finally {
      if (requestId === schoolRequestId.current) {
        setIsSchoolLoading(false);
      }
    }
  }, []);

  const handleUserSearchChange = useCallback(
    (query: string) => {
      if (userDebounceRef.current) clearTimeout(userDebounceRef.current);
      if (query.trim() === "") {
        void fetchUsers(query);
        return;
      }
      userDebounceRef.current = setTimeout(() => void fetchUsers(query), 300);
    },
    [fetchUsers],
  );

  const handleSchoolSearchChange = useCallback(
    (query: string) => {
      if (schoolDebounceRef.current) clearTimeout(schoolDebounceRef.current);
      if (query.trim() === "") {
        void fetchSchools(query);
        return;
      }
      schoolDebounceRef.current = setTimeout(() => void fetchSchools(query), 300);
    },
    [fetchSchools],
  );

  const handleUserChange = (value: string) => {
    setData("user_id", value);
    if (!value) {
      setUserLabel("");
      setSelectedUserName("");
      return;
    }

    const selected = userOptions.find((item) => item.value === value);
    if (selected) {
      setUserLabel(selected.label);
      const nameMatch = selected.label.match(/^(.*?)\s*\(/);
      setSelectedUserName(nameMatch?.[1]?.trim() || selected.label);
    }
  };

  const handleSchoolChange = (value: string) => {
    setData("school_id", value);
    if (!value) {
      setSchoolLabel("");
      return;
    }

    const selected = schoolOptions.find((item) => item.value === value);
    if (selected) {
      setSchoolLabel(selected.label);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    transform((payload) => ({
      ...payload,
      user_id: payload.user_id === "" ? null : Number(payload.user_id),
      school_id: payload.school_id === "" ? null : Number(payload.school_id),
      nis: payload.nis.trim() === "" ? null : payload.nis.trim(),
      nisn: payload.nisn.trim() === "" ? null : payload.nisn.trim(),
      class_name: payload.class_name.trim() === "" ? null : payload.class_name.trim(),
      gender: payload.gender === "" ? null : payload.gender,
    }));

    put(route("admin.students.update", studentData.id), {
      onSuccess: () => toast.success("Data murid berhasil diperbarui."),
      onError: () => toast.error("Gagal memperbarui data murid."),
    });
  };

  return (
    <>
      <Head title={`Edit Murid - ${studentData.user?.name || studentData.name || ""}`} />
      <Toaster position="top-center" />

      <div className="space-y-6 p-4">
        <PageHeader
          title="Edit Murid"
          description="Nama diambil dari akun user. Ubah nama lewat menu Pengguna."
          backAction={
            <IconButton variant="ghost" onClick={() => router.get(route("admin.students.index"))}>
              <ArrowLeftIcon className="h-5 w-5 dark:text-white" />
            </IconButton>
          }
        />

        <Card className="mx-auto max-w-2xl overflow-hidden border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardBody className="space-y-5 p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <Typography as="label" type="small" className="font-semibold dark:text-white">
                  Akun User <span className="text-red-500">*</span>
                </Typography>
                <Autocomplete
                  options={userOptions}
                  value={data.user_id}
                  onChange={handleUserChange}
                  onSearchChange={handleUserSearchChange}
                  selectedLabel={userLabel}
                  loading={isUserLoading}
                  placeholder="Cari user (nama / email)..."
                  emptyMessage={
                    isUserLoading
                      ? "Memuat..."
                      : "Tidak ada user tersedia. Buka untuk 25 user pertama atau ketik untuk mencari."
                  }
                />
                {selectedUserName && (
                  <Typography type="small" className="text-slate-500">
                    Nama:{" "}
                    <strong className="text-slate-700 dark:text-slate-200">{selectedUserName}</strong>
                  </Typography>
                )}
                {errors.user_id && (
                  <Typography type="small" color="error">
                    {errors.user_id}
                  </Typography>
                )}
              </div>

              <div className="space-y-1">
                <Typography as="label" type="small" className="font-semibold dark:text-white">
                  Sekolah <span className="text-red-500">*</span>
                </Typography>
                <Autocomplete
                  options={schoolOptions}
                  value={data.school_id}
                  onChange={handleSchoolChange}
                  onSearchChange={handleSchoolSearchChange}
                  selectedLabel={schoolLabel}
                  loading={isSchoolLoading}
                  placeholder="Cari sekolah..."
                  emptyMessage={
                    isSchoolLoading
                      ? "Memuat..."
                      : `Tidak ada sekolah. Ketik minimal ${SCHOOL_SEARCH_MIN} karakter untuk mencari, atau buka untuk ${PAGE_SIZE} sekolah pertama.`
                  }
                />
                {errors.school_id && (
                  <Typography type="small" color="error">
                    {errors.school_id}
                  </Typography>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Typography as="label" type="small" className="font-semibold dark:text-white">
                    NIS
                  </Typography>
                  <Input value={data.nis} onChange={(e) => setData("nis", e.target.value)} />
                  {errors.nis && (
                    <Typography type="small" color="error">
                      {errors.nis}
                    </Typography>
                  )}
                </div>
                <div className="space-y-1">
                  <Typography as="label" type="small" className="font-semibold dark:text-white">
                    NISN
                  </Typography>
                  <Input value={data.nisn} onChange={(e) => setData("nisn", e.target.value)} />
                  {errors.nisn && (
                    <Typography type="small" color="error">
                      {errors.nisn}
                    </Typography>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Typography as="label" type="small" className="font-semibold dark:text-white">
                    Kelas
                  </Typography>
                  <Input
                    value={data.class_name}
                    onChange={(e) => setData("class_name", e.target.value)}
                  />
                  {errors.class_name && (
                    <Typography type="small" color="error">
                      {errors.class_name}
                    </Typography>
                  )}
                </div>
                <div className="space-y-1">
                  <Typography as="label" type="small" className="font-semibold dark:text-white">
                    Jenis Kelamin
                  </Typography>
                  <Select value={data.gender} onValueChange={(val) => setData("gender", val)}>
                    <Select.Trigger placeholder="Pilih">
                      {() =>
                        data.gender === "L"
                          ? "Laki-laki"
                          : data.gender === "P"
                            ? "Perempuan"
                            : "Pilih"
                      }
                    </Select.Trigger>
                    <Select.List>
                      <Select.Option value="">-</Select.Option>
                      <Select.Option value="L">Laki-laki</Select.Option>
                      <Select.Option value="P">Perempuan</Select.Option>
                    </Select.List>
                  </Select>
                  {errors.gender && (
                    <Typography type="small" color="error">
                      {errors.gender}
                    </Typography>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <div>
                  <Typography className="font-semibold dark:text-white">Status aktif</Typography>
                  <Typography type="small" className="text-slate-500">
                    Nonaktifkan jika murid tidak lagi aktif di sekolah.
                  </Typography>
                </div>
                <Switch
                  checked={data.is_active}
                  onChange={(e) => setData("is_active", e.target.checked)}
                // onCheckedChange={(checked) => setData("is_active", Boolean(checked))}
                />
              </div>

              {errors?.authorization && (
                <Typography type="small" color="error">
                  {errors?.authorization}
                </Typography>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.get(route("admin.students.index"))}
                >
                  Batal
                </Button>
                <Button type="submit" className="flex items-center gap-2" disabled={processing}>
                  <SaveIcon className="h-4 w-4" />
                  Simpan Perubahan
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
