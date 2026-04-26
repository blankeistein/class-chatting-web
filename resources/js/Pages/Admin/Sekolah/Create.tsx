import React from "react";
import {
  Button,
  Card,
  CardBody,
  IconButton,
  Input,
  Select,
  Textarea,
  Typography,
} from "@material-tailwind/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { ArrowLeftIcon, RefreshCwIcon, SaveIcon } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

type Province = {
  id: number;
  code: string;
  name: string;
};

type Regency = {
  id: number;
  province_id: number;
  code: string;
  name: string;
  type: string | null;
};

type District = {
  id: number;
  regency_id: number;
  code: string;
  name: string;
};

type Village = {
  id: number;
  district_id: number;
  code: string;
  name: string;
};

function generateSchoolCode(length = 6): string {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    // Mengambil karakter acak dari variabel 'characters'
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

export default function Create({ provinces, regencies, districts, villages }: { provinces: Province[]; regencies: Regency[]; districts: District[]; villages: Village[] }) {
  const { data, setData, post, transform, processing, errors } = useForm({
    code: generateSchoolCode(),
    npsn: "",
    name: "",
    bentuk_pendidikan: "",
    status: "",
    province_id: 0,
    regency_id: 0,
    district_id: 0,
    address: "",
    rt: "",
    rw: "",
    latitute: "",
    longitude: "",
  });

  const filteredRegencies = regencies.filter((item) => item.province_id === data.province_id);
  const filteredDistricts = districts.filter((item) => item.regency_id === data.regency_id);
  const filteredVillages = villages.filter((item) => item.district_id === data.district_id);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    transform((payload) => ({
      ...payload,
      code: payload.code.trim(),
      npsn: payload.npsn.trim() === "" ? null : payload.npsn.trim(),
      bentuk_pendidikan: payload.bentuk_pendidikan.trim(),
      status: payload.status,
      address: payload.address.trim() === "" ? null : payload.address.trim(),
      rt: payload.rt === "" ? null : Number(payload.rt),
      rw: payload.rw === "" ? null : Number(payload.rw),
      latitute: payload.latitute === "" ? null : Number(payload.latitute),
      longitude: payload.longitude === "" ? null : Number(payload.longitude),
    }));

    post(route("admin.schools.store"), {
      onSuccess: () => {
        toast.success("Sekolah berhasil ditambahkan.");
      },
      onError: () => {
        toast.error("Gagal menambahkan sekolah. Periksa kembali form.");
      },
    });
  };

  return (
    <>
      <Head title="Tambah Sekolah" />
      <Toaster position="top-center" />

      <div className="p-4 space-y-6">
        <div className="flex items-center gap-4">
          <IconButton
            variant="ghost"
            onClick={() => router.get(route("admin.schools.index"))}
            className="rounded-full flex-shrink-0"
          >
            <ArrowLeftIcon className="w-5 h-5 dark:text-white" />
          </IconButton>
          <Typography variant="h4" className="text-xl font-bold text-slate-800 dark:text-white">
            Tambah Sekolah
          </Typography>
        </div>

        <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900 overflow-hidden max-w-4xl mx-auto">
          <CardBody className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <Typography as="label" htmlFor="code" type="small" className="font-semibold dark:text-white">
                    Kode Sekolah
                  </Typography>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      placeholder="Contoh: SCH-001"
                      value={data.code}
                      onChange={(event) => setData("code", event.target.value)}
                      isError={!!errors.code}
                    />
                    <IconButton type="button" variant="outline" color="secondary" onClick={() => setData("code", generateSchoolCode())}>
                      <RefreshCwIcon className="h-4 w-4" />
                    </IconButton>
                  </div>
                  {errors.code && <Typography type="small" color="error">{errors.code}</Typography>}
                </div>

                <div className="space-y-1">
                  <Typography as="label" htmlFor="npsn" type="small" className="font-semibold dark:text-white">
                    NPSN (Opsional)
                  </Typography>
                  <Input
                    id="npsn"
                    placeholder="Contoh: 20104001"
                    value={data.npsn}
                    onChange={(event) => setData("npsn", event.target.value)}
                    isError={!!errors.npsn}
                  />
                  {errors.npsn && <Typography type="small" color="error">{errors.npsn}</Typography>}
                </div>

                <div className="space-y-1">
                  <Typography as="label" htmlFor="name" type="small" className="font-semibold dark:text-white">
                    Nama Sekolah
                  </Typography>
                  <Input
                    id="name"
                    placeholder="Masukkan nama sekolah"
                    value={data.name}
                    onChange={(event) => setData("name", event.target.value)}
                    isError={!!errors.name}
                  />
                  {errors.name && <Typography type="small" color="error">{errors.name}</Typography>}
                </div>

                <div className="space-y-1">
                  <Typography as="label" htmlFor="bentuk_pendidikan" type="small" className="font-semibold dark:text-white">
                    Bentuk Pendidikan
                  </Typography>
                  <Input
                    id="bentuk_pendidikan"
                    placeholder="Contoh: SD, SMP, SMA"
                    value={data.bentuk_pendidikan}
                    onChange={(event) => setData("bentuk_pendidikan", event.target.value)}
                    isError={!!errors.bentuk_pendidikan}
                  />
                  {errors.bentuk_pendidikan && <Typography type="small" color="error">{errors.bentuk_pendidikan}</Typography>}
                </div>

                <div className="space-y-1">
                  <Typography as="label" type="small" className="font-semibold dark:text-white">
                    Status
                  </Typography>
                  <Select
                    value={data.status}
                    onValueChange={(value) => setData("status", value)}
                  >
                    <Select.Trigger placeholder="Pilih status">
                      {() => data.status || "Pilih status"}
                    </Select.Trigger>
                    <Select.List>
                      <Select.Option value="NEGERI">NEGERI</Select.Option>
                      <Select.Option value="SWASTA">SWASTA</Select.Option>
                    </Select.List>
                  </Select>
                  {errors.status && <Typography type="small" color="error">{errors.status}</Typography>}
                </div>

                <div className="space-y-1">
                  <Typography as="label" type="small" className="font-semibold dark:text-white">
                    Provinsi
                  </Typography>
                  <Select
                    value={data.province_id ? String(data.province_id) : ""}
                    onValueChange={(value) => {
                      setData("province_id", Number(value));
                      setData("regency_id", 0);
                      setData("district_id", 0);
                    }}
                  >
                    <Select.Trigger placeholder="Pilih provinsi">
                      {() => provinces.find((item) => item.id === data.province_id)?.name || "Pilih provinsi"}
                    </Select.Trigger>
                    <Select.List className="overflow-auto">
                      {provinces.map((item) => (
                        <Select.Option key={item.id} value={String(item.id)}>
                          {item.code} - {item.name}
                        </Select.Option>
                      ))}
                    </Select.List>
                  </Select>
                  {errors.province_id && <Typography type="small" color="error">{errors.province_id}</Typography>}
                </div>

                <div className="space-y-1">
                  <Typography as="label" type="small" className="font-semibold dark:text-white">
                    Kabupaten/Kota
                  </Typography>
                  <Select
                    value={data.regency_id ? String(data.regency_id) : ""}
                    onValueChange={(value) => {
                      setData("regency_id", Number(value));
                      setData("district_id", 0);
                    }}
                    disabled={!data.province_id}
                  >
                    <Select.Trigger placeholder="Pilih kabupaten/kota">
                      {() => filteredRegencies.find((item) => item.id === data.regency_id)?.name || "Pilih kabupaten/kota"}
                    </Select.Trigger>
                    <Select.List className="overflow-auto">
                      {filteredRegencies.map((item) => (
                        <Select.Option key={item.id} value={String(item.id)}>
                          {item.code} - {item.name}
                        </Select.Option>
                      ))}
                    </Select.List>
                  </Select>
                  {errors.regency_id && <Typography type="small" color="error">{errors.regency_id}</Typography>}
                </div>

                <div className="space-y-1">
                  <Typography as="label" type="small" className="font-semibold dark:text-white">
                    Kecamatan
                  </Typography>
                  <Select
                    value={data.district_id ? String(data.district_id) : ""}
                    onValueChange={(value) => {
                      setData("district_id", Number(value));
                    }}
                    disabled={!data.regency_id}
                  >
                    <Select.Trigger placeholder="Pilih kecamatan">
                      {() => filteredDistricts.find((item) => item.id === data.district_id)?.name || "Pilih kecamatan"}
                    </Select.Trigger>
                    <Select.List className="overflow-auto">
                      {filteredDistricts.map((item) => (
                        <Select.Option key={item.id} value={String(item.id)}>
                          {item.code} - {item.name}
                        </Select.Option>
                      ))}
                    </Select.List>
                  </Select>
                  {errors.district_id && <Typography type="small" color="error">{errors.district_id}</Typography>}
                </div>

                <div className="space-y-1 md:col-span-2">
                  <Typography as="label" htmlFor="address" type="small" className="font-semibold dark:text-white">
                    Alamat
                  </Typography>
                  <Textarea
                    id="address"
                    placeholder="Masukkan alamat sekolah"
                    value={data.address}
                    onChange={(event) => setData("address", event.target.value)}
                  />
                  {errors.address && <Typography type="small" color="error">{errors.address}</Typography>}
                </div>

                <div className="space-y-1">
                  <Typography as="label" htmlFor="rt" type="small" className="font-semibold dark:text-white">
                    RT
                  </Typography>
                  <Input
                    id="rt"
                    type="number"
                    min={0}
                    value={data.rt}
                    onChange={(event) => setData("rt", event.target.value)}
                    isError={!!errors.rt}
                  />
                  {errors.rt && <Typography type="small" color="error">{errors.rt}</Typography>}
                </div>

                <div className="space-y-1">
                  <Typography as="label" htmlFor="rw" type="small" className="font-semibold dark:text-white">
                    RW
                  </Typography>
                  <Input
                    id="rw"
                    type="number"
                    min={0}
                    value={data.rw}
                    onChange={(event) => setData("rw", event.target.value)}
                    isError={!!errors.rw}
                  />
                  {errors.rw && <Typography type="small" color="error">{errors.rw}</Typography>}
                </div>

                <div className="space-y-1">
                  <Typography as="label" htmlFor="latitute" type="small" className="font-semibold dark:text-white">
                    Latitude
                  </Typography>
                  <Input
                    id="latitute"
                    type="number"
                    step="0.0000001"
                    value={data.latitute}
                    onChange={(event) => setData("latitute", event.target.value)}
                    isError={!!errors.latitute}
                  />
                  {errors.latitute && <Typography type="small" color="error">{errors.latitute}</Typography>}
                </div>

                <div className="space-y-1">
                  <Typography as="label" htmlFor="longitude" type="small" className="font-semibold dark:text-white">
                    Longitude
                  </Typography>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.0000001"
                    value={data.longitude}
                    onChange={(event) => setData("longitude", event.target.value)}
                    isError={!!errors.longitude}
                  />
                  {errors.longitude && <Typography type="small" color="error">{errors.longitude}</Typography>}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800 mt-6 gap-2">
                <Button
                  variant="ghost"
                  color="secondary"
                  type="button"
                  onClick={() => router.get(route("admin.schools.index"))}
                  className="mr-2"
                >
                  Batal
                </Button>
                <Button type="submit" color="primary" disabled={processing} className="flex items-center gap-2">
                  {processing ? "Menyimpan..." : <><SaveIcon className="w-4 h-4" /> Simpan Sekolah</>}
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
