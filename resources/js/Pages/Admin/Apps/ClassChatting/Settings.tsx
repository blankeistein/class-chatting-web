import React from "react";
import { Head } from "@inertiajs/react";
import axios from "axios";
import {
  Alert,
  Button,
  Card,
  Input,
  Spinner,
  Tabs,
  Textarea,
  Typography,
} from "@material-tailwind/react";
import { doc, onSnapshot } from "firebase/firestore";
import { CreditCardIcon, LoaderCircleIcon, SaveIcon, Settings2Icon } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { PageHeader } from "@/Components/PageHeader";
import AdminAppLayout from "@/Layouts/AdminAppLayout";
import { getFirebaseFirestore } from "@/lib/firebase";

type GeneralSettingsDocument = {
  announcement?: string;
  noRekening?: string;
  updatedAt?: unknown;
};

const SETTINGS_COLLECTION = "settings";
const GENERAL_DOCUMENT = "general";

export default function Settings() {
  const firestore = React.useMemo(() => getFirebaseFirestore(), []);
  const [activeTab, setActiveTab] = React.useState("general");
  const [announcement, setAnnouncement] = React.useState("");
  const [noRekening, setNoRekening] = React.useState("");
  const [lastSavedAnnouncement, setLastSavedAnnouncement] = React.useState("");
  const [lastSavedNoRekening, setLastSavedNoRekening] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!firestore) {
      setIsLoading(false);
      setLoadError("Firebase Firestore belum terkonfigurasi.");
      toast.error("Firebase Firestore belum terkonfigurasi. Tambahkan VITE_FIREBASE_PROJECT_ID.");

      return;
    }

    const settingsReference = doc(firestore, SETTINGS_COLLECTION, GENERAL_DOCUMENT);
    const unsubscribe = onSnapshot(
      settingsReference,
      (snapshot) => {
        const data = snapshot.data() as GeneralSettingsDocument | undefined;
        const nextAnnouncement = data?.announcement ?? "";
        const nextNoRekening = data?.noRekening ?? "";

        setAnnouncement(nextAnnouncement);
        setNoRekening(nextNoRekening);
        setLastSavedAnnouncement(nextAnnouncement);
        setLastSavedNoRekening(nextNoRekening);
        setLoadError(null);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching class chatting settings:", error);
        setLoadError("Gagal membaca pengaturan dari Firebase Firestore.");
        setIsLoading(false);
        toast.error("Gagal membaca pengaturan dari Firebase Firestore.");
      },
    );

    return () => unsubscribe();
  }, [firestore]);

  const hasChanges = announcement !== lastSavedAnnouncement || noRekening !== lastSavedNoRekening;

  const handleSave = async () => {
    setIsSaving(true);

    try {
      await axios.post(route("admin.apps.class-chatting.settings.store"), {
        announcement,
        noRekening,
      });

      setLastSavedAnnouncement(announcement);
      setLastSavedNoRekening(noRekening);
      toast.success("Pengaturan berhasil disimpan.");
    } catch (error) {
      console.error("Error saving class chatting settings:", error);
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message ?? "Gagal menyimpan pengaturan.");
      } else {
        toast.error("Gagal menyimpan pengaturan.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Head title="Pengaturan Class Chatting" />
      <Toaster position="top-center" />

      <div className="min-h-screen space-y-6 p-4 md:p-6">
        <PageHeader
          title="Pengaturan Class Chatting"
          description="Kelola pengaturan umum aplikasi Class Chatting yang tersimpan di Firebase Firestore."
          actions={(
            <Button
              className="flex items-center gap-2 bg-slate-900 dark:bg-white dark:text-slate-900"
              onClick={handleSave}
              disabled={isLoading || isSaving || !hasChanges}
            >
              {isSaving ? (
                <LoaderCircleIcon className="h-4 w-4 animate-spin" />
              ) : (
                <SaveIcon className="h-4 w-4" />
              )}
              Simpan
            </Button>
          )}
        />

        <Card className="border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-6 p-4 md:p-6">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value ?? "general")}>
              <Tabs.List>
                <Tabs.Trigger value="general" className="flex items-center gap-2 py-2 text-sm font-semibold">
                  <Settings2Icon className="h-4 w-4" />
                  Umum
                </Tabs.Trigger>
                <Tabs.Trigger value="payment" className="flex items-center gap-2 py-2 text-sm font-semibold">
                  <CreditCardIcon className="h-4 w-4" />
                  Pembayaran
                </Tabs.Trigger>
                <Tabs.TriggerIndicator />
              </Tabs.List>
            </Tabs>

            {loadError && (
              <Alert color="error">
                {loadError}
              </Alert>
            )}

            {isLoading ? (
              <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40">
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-300">
                  <Spinner className="h-5 w-5" />
                  <Typography>Memuat pengaturan...</Typography>
                </div>
              </div>
            ) : (
              <Card className="border border-slate-200 shadow-none dark:border-slate-800 dark:bg-slate-950/40">
                <div className="space-y-5 p-4 md:p-6">
                  {activeTab === "general" && (
                    <>
                      <div className="space-y-2">
                        <Typography as="label" htmlFor="announcement" type="small" color="default" className="font-semibold dark:text-white">
                          Pengumuman
                        </Typography>
                        <Textarea
                          id="announcement"
                          placeholder="Tulis pengumuman untuk aplikasi Class Chatting"
                          value={announcement}
                          onChange={(event) => setAnnouncement(event.target.value)}
                          className="min-h-[220px] dark:text-white"
                        />
                        <div className="flex items-center justify-between gap-3">
                          <Typography type="small" className="text-slate-500 dark:text-slate-400">
                            {hasChanges ? "Ada perubahan yang belum disimpan." : "Tidak ada perubahan."}
                          </Typography>
                          <Typography type="small" className="text-slate-500 dark:text-slate-400">
                            {announcement.length} karakter
                          </Typography>
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === "payment" && (
                    <>
                      <div className="space-y-2">
                        <Typography as="label" htmlFor="noRekening" type="small" color="default" className="font-semibold dark:text-white">
                          Nomor Rekening
                        </Typography>
                        <Input
                          id="noRekening"
                          placeholder="Masukkan nomor rekening"
                          value={noRekening}
                          onChange={(event) => setNoRekening(event.target.value)}
                          className="dark:text-white"
                        />
                        <Typography type="small" className="text-slate-500 dark:text-slate-400">
                          {hasChanges ? "Ada perubahan yang belum disimpan." : "Tidak ada perubahan."}
                        </Typography>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}

Settings.layout = (page: React.ReactNode) => {
  return <AdminAppLayout appName="class-chatting">{page}</AdminAppLayout>;
};
