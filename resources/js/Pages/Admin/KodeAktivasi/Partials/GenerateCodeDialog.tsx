import React from "react";
import {
  Typography,
  IconButton,
  Button,
  Input,
  Select,
  Dialog,
  Checkbox,
  Radio,
} from "@material-tailwind/react";
import { XCircleIcon, SearchIcon, Loader2Icon, HashIcon, Edit3Icon } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { router } from "@inertiajs/react";

interface Book {
  id: number;
  title: string;
}

interface GenerateCodeDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function GenerateCodeDialog({ open, setOpen }: GenerateCodeDialogProps) {
  const [books, setBooks] = React.useState<Book[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedBooks, setSelectedBooks] = React.useState<number[]>([]);
  const [bookSearch, setBookSearch] = React.useState("");

  // New States
  const [mode, setMode] = React.useState<"random" | "custom">("random");
  const [codeLength, setCodeLength] = React.useState(10);
  const [customCode, setCustomCode] = React.useState("");
  const [quantity, setQuantity] = React.useState(1);
  const [tier, setTier] = React.useState("1");
  const [codeType, setCodeType] = React.useState<"single" | "public">("single");
  const [maxActivated, setMaxActivated] = React.useState(1);
  const [isUnlimited, setIsUnlimited] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Initial fetch when opened
  React.useEffect(() => {
    if (open) {
      handleSearch("");
      // Reset form when reopened
      setSelectedBooks([]);
      setBookSearch("");
      setCustomCode("");
      setQuantity(1);
      setCodeType("single");
      setMaxActivated(1);
      setIsUnlimited(false);
      setIsSubmitting(false);
    }
  }, [open]);

  // Debounced search fetch
  React.useEffect(() => {
    if (!open) return;

    const timeoutId = setTimeout(() => {
      handleSearch(bookSearch);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [bookSearch]);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    try {
      const response = await axios.get(route('admin.books.selection'), {
        params: { search: query }
      });
      setBooks(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data buku");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBook = (id: number) => {
    setSelectedBooks((prev) =>
      prev.includes(id) ? prev.filter((bid) => bid !== id) : [...prev, id]
    );
  };

  const handleGenerate = () => {
    if (selectedBooks.length === 0) {
      toast.error("Pilih minimal satu buku!");
      return;
    }

    if (mode === "custom" && !customCode) {
      toast.error("Kode custom tidak boleh kosong!");
      return;
    }

    setIsSubmitting(true);

    router.post(route('admin.activation-code.store'), {
      tier,
      quantity,
      mode,
      type: codeType,
      max_activated: isUnlimited ? null : maxActivated,
      code_length: codeLength,
      custom_code: customCode,
      book_ids: selectedBooks,
    }, {
      onSuccess: () => {
        toast.success("Kode berhasil digenerate!");
        setOpen(false);
      },
      onError: (errors) => {
        const firstError = Object.values(errors)[0] as string;
        toast.error(firstError || "Terjadi kesalahan saat generate kode");
      },
      onFinish: () => setIsSubmitting(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={() => setOpen(!open)} size="md">
      <Dialog.Overlay>
        <Dialog.Content className="grid grid-rows-[auto_1fr_auto] max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col items-start gap-1">
              <Typography variant="h5" className="font-bold">Generate Kode Baru</Typography>
              <Typography variant="small" className="font-normal text-slate-500">
                Buat kode aktivasi baru.
              </Typography>
            </div>
            <IconButton
              size="sm"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              <XCircleIcon className="h-5 w-5" />
            </IconButton>
          </div>

          {/* Body */}
          <div className="space-y-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Typography variant="small" className="mb-2 font-bold text-slate-700 dark:text-slate-300">
                  Tipe Paket
                </Typography>
                <Select value={tier} onValueChange={setTier}>
                  <Select.Trigger placeholder="Pilih Paket" />
                  <Select.List>
                    <Select.Option value="1">Reguler</Select.Option>
                    <Select.Option value="2">Premium</Select.Option>
                  </Select.List>
                </Select>
              </div>
              <div>
                <Typography variant="small" className="mb-2 font-bold text-slate-700 dark:text-slate-300">
                  Jenis Kode
                </Typography>
                <Select value={codeType} onValueChange={(val) => {
                  setCodeType(val as any);
                  if (val === "single" && maxActivated > 1) setMaxActivated(1);
                  else if (val === "public" && maxActivated === 1) setMaxActivated(100);
                }}>
                  <Select.Trigger placeholder="Pilih Jenis" />
                  <Select.List>
                    <Select.Option value="single">Individual (Sekali Pakai)</Select.Option>
                    <Select.Option value="public">Public (Berulang Kali)</Select.Option>
                  </Select.List>
                </Select>
              </div>
              <div>
                <Typography variant="small" className="mb-2 font-bold text-slate-700 dark:text-slate-300">
                  Jumlah Kode di-Generate
                </Typography>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  min={1}
                  max={mode === "custom" ? 1 : 1000}
                  disabled={mode === "custom"}
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Typography variant="small" className="font-bold text-slate-700 dark:text-slate-300">
                    Maksimal Pemakaian
                  </Typography>
                  <Typography as="label" className="text-[10px] font-medium text-slate-500 flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={isUnlimited}
                      onChange={() => setIsUnlimited(!isUnlimited)}
                    >
                      <Checkbox.Indicator />
                    </Checkbox>
                    Tanpa Batas
                  </Typography>
                </div>
                <Input
                  type="number"
                  value={isUnlimited ? "" : maxActivated.toString()}
                  onChange={(e) => setMaxActivated(parseInt(e.target.value) || 1)}
                  min={1}
                  disabled={isUnlimited}
                  placeholder={isUnlimited ? "∞ Unlimited" : "Contoh: 100"}
                />
              </div>
            </div>

            <div>
              <Typography variant="small" className="mb-2 font-bold text-slate-700 dark:text-slate-300">
                Metode Kode
              </Typography>
              <Radio value={mode} onValueChange={(val) => setMode(val as any)}>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => setMode("random")}>
                    <Radio.Item value="random" className="p-0">
                      <Radio.Indicator />
                    </Radio.Item>
                    <Typography variant="small" className="font-medium text-slate-600 dark:text-slate-400">
                      Random Generate
                    </Typography>
                  </div>
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
                    setMode("custom");
                    setQuantity(1);
                  }}>
                    <Radio.Item value="custom" className="p-0">
                      <Radio.Indicator />
                    </Radio.Item>
                    <Typography variant="small" className="font-medium text-slate-600 dark:text-slate-400">
                      Custom Kode
                    </Typography>
                  </div>
                </div>
              </Radio>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
              {mode === "random" ? (
                <div>
                  <Typography variant="small" className="mb-2 font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <HashIcon className="w-4 h-4" /> Panjang Kode
                  </Typography>
                  <Input
                    type="number"
                    value={codeLength}
                    onChange={(e) => setCodeLength(parseInt(e.target.value) || 10)}
                    min={4}
                    max={64}
                    placeholder="Contoh: 10"
                  />
                  <Typography variant="small" className="mt-2 text-[10px] text-slate-500 italic">
                    * Kode akan digenerate otomatis dengan panjang {codeLength} karakter.
                  </Typography>
                </div>
              ) : (
                <div>
                  <Typography variant="small" className="mb-2 font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Edit3Icon className="w-4 h-4" /> Masukkan Kode Custom
                  </Typography>
                  <Input
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    placeholder="CONTOH: KODEPESERTA2024"
                  />
                  <Typography variant="small" className="mt-2 text-[10px] text-slate-500 italic">
                    * Pastikan kode unik dan belum pernah digunakan.
                  </Typography>
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-col gap-2 mb-2">
                <div className="flex items-center justify-between">
                  <Typography variant="small" className="font-bold text-slate-700 dark:text-slate-300">
                    Pilih Buku ({selectedBooks.length} dipilih)
                  </Typography>
                </div>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Cari buku..."
                    value={bookSearch}
                    onChange={(e) => setBookSearch(e.target.value)}
                    className="!border-t-blue-gray-200 focus:!border-t-gray-900 dark:focus:!border-t-white p-2 pl-9 h-9 text-xs"
                  />
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-slate-50/50 dark:bg-slate-900/50 relative min-h-[100px]">
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 z-10 backdrop-blur-[1px]">
                    <Loader2Icon className="h-6 w-6 animate-spin text-slate-500" />
                  </div>
                ) : null}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                  {books.map((book) => (
                    <Typography
                      key={book.id}
                      as="label"
                      className={`flex items-center gap-2 truncate text-xs font-medium  p-2 rounded-md transition-colors cursor-pointer ${selectedBooks.includes(book.id)
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                      <Checkbox
                        id={`book-${book.id}`}
                        checked={selectedBooks.includes(book.id)}
                        className="p-0"
                        onChange={() => toggleBook(book.id)} // handled by div click
                      >
                        <Checkbox.Indicator />
                      </Checkbox>
                      {book.title}
                    </Typography>
                  ))}
                  {!isLoading && books.length === 0 && (
                    <div className="p-4 text-center col-span-2">
                      <Typography variant="small" className="text-slate-500 italic">
                        {bookSearch ? "Buku tidak ditemukan." : "Tidak ada buku yang tersedia."}
                      </Typography>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-2 mt-8">
            <Button variant="ghost" color="secondary" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              className="bg-slate-900 dark:bg-white dark:text-slate-900 flex items-center gap-2"
              onClick={handleGenerate}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2Icon className="w-4 h-4 animate-spin" />}
              Generate Kode
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Overlay>
    </Dialog>
  );
}
