import axios from "axios";
import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Checkbox,
  Chip,
  Dialog,
  IconButton,
  Input,
  Select,
  Typography,
} from "@material-tailwind/react";
import { DownloadIcon, LoaderCircleIcon, SaveIcon, TagIcon, XIcon } from "lucide-react";
import { toast } from "react-hot-toast";
import { Book } from "@/Pages/Admin/Apps/ClassChatting/Book/Index";

type BookEditDialogProps = {
  open: boolean;
  form: Book | null;
  activeEditKey: string | null;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  onClose: () => void;
  onSave: (book: Book) => void;
};

export default function BookEditDialog({
  open,
  form,
  activeEditKey,
  onOpenChange,
  onClose,
  onSave,
}: BookEditDialogProps) {
  const [editForm, setEditForm] = useState<Book | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentKeyword, setCurrentKeyword] = useState("");
  const keywordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (form) {
      setEditForm({
        ...form,
        keyword: form.keyword
          .map((keyword) => keyword.trim())
          .filter((keyword, index, keywords) => keyword.length > 0 && keywords.indexOf(keyword) === index),
      });
      setCurrentKeyword("");
    }
  }, [form]);

  useEffect(() => {
    if (!open) {
      setEditForm(null);
      setCurrentKeyword("");
    }
  }, [open]);

  const handleEditFormChange = useCallback((field: keyof Book, value: string | number | boolean | string[]) => {
    setEditForm((currentForm) => {
      if (!currentForm) {
        return currentForm;
      }

      return {
        ...currentForm,
        [field]: value,
      };
    });
  }, []);

  const commitKeyword = useCallback((rawKeyword: string) => {
    const normalizedKeyword = rawKeyword.trim();

    if (!normalizedKeyword) {
      return;
    }

    setEditForm((currentForm) => {
      if (!currentForm) {
        return currentForm;
      }

      if (currentForm.keyword.includes(normalizedKeyword)) {
        return currentForm;
      }

      return {
        ...currentForm,
        keyword: [...currentForm.keyword, normalizedKeyword],
      };
    });
    setCurrentKeyword("");
  }, []);

  const handleKeywordKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" && event.key !== ",") {
      return;
    }

    event.preventDefault();
    commitKeyword(currentKeyword);
  }, [commitKeyword, currentKeyword]);

  const handleRemoveKeyword = useCallback((keywordToRemove: string) => {
    setEditForm((currentForm) => {
      if (!currentForm) {
        return currentForm;
      }

      return {
        ...currentForm,
        keyword: currentForm.keyword.filter((keyword) => keyword !== keywordToRemove),
      };
    });
  }, []);

  const handleSyncFromDatabase = useCallback(async () => {
    if (!editForm?.id) {
      toast.error("ID buku tidak tersedia untuk sinkronisasi.");

      return;
    }

    setIsSyncing(true);

    try {
      const response = await axios.get<{
        data: {
          cover: string;
          downloadLink: string;
          version: number;
        };
      }>(route("admin.apps.class-chatting.book.items.sync", { uuid: editForm.id }));

      setEditForm((currentForm) => {
        if (!currentForm) {
          return currentForm;
        }

        return {
          ...currentForm,
          cover: response.data.data.cover,
          downloadLink: response.data.data.downloadLink,
          version: response.data.data.version,
        };
      });

      toast.success("Cover, download link, dan versi berhasil disinkronkan.");
    } catch (error) {
      toast.error("Gagal sinkronisasi data buku dari database.");
    } finally {
      setIsSyncing(false);
    }
  }, [editForm?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} size="lg">
      <Dialog.Overlay>
        <Dialog.Content className="grid max-h-[90vh] grid-rows-[auto_1fr_auto] overflow-hidden p-0 dark:border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div>
              <Typography variant="h5" className="font-bold text-slate-800 dark:text-white">
                Edit data buku
              </Typography>
            </div>
            <IconButton variant="ghost" size="sm" onClick={onClose}>
              <XIcon className="h-4 w-4" />
            </IconButton>
          </div>

          <div className="space-y-4 overflow-y-auto px-5 py-4">
            {editForm && (
              <>
                <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <Typography className="text-xs text-slate-500 dark:text-slate-400">
                    Path Firebase item: <span className="font-mono">{editForm.originalKey}</span>
                  </Typography>
                  <Button variant="outline" color="secondary" className="flex items-center gap-2" onClick={handleSyncFromDatabase} disabled={isSyncing || activeEditKey === editForm.originalKey}>
                    {isSyncing ? <LoaderCircleIcon className="h-4 w-4 animate-spin" /> : <DownloadIcon className="h-4 w-4" />}
                    Sinkronkan dari database
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="w-full">
                    <Typography as="label" htmlFor="judul-buku" type="small" color="default" className="font-semibold">
                      Judul Buku
                    </Typography>
                    <Input id="judul-buku" value={editForm.name} onChange={(event) => handleEditFormChange("name", event.target.value)} />
                  </div>
                  <div className="w-full space-y-1">
                    <Typography as="label" htmlFor="keyword" type="small" color="default" className="font-semibold">
                      Keyword
                    </Typography>
                    <Input
                      id="keyword"
                      ref={keywordInputRef}
                      value={currentKeyword}
                      placeholder="Ketik keyword lalu tekan Enter atau koma"
                      onChange={(event) => setCurrentKeyword(event.target.value)}
                      onKeyDown={handleKeywordKeyDown}
                      onBlur={() => commitKeyword(currentKeyword)}
                    />
                    <Typography className="text-xs text-slate-500 dark:text-slate-400">
                      Keyword unik akan ditambahkan ke daftar. Klik `x` untuk hapus.
                    </Typography>
                    <div className="flex flex-wrap gap-2">
                      {editForm.keyword.length > 0 ? editForm.keyword.map((keyword) => (
                        <Chip key={keyword} variant="ghost" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          <Chip.Icon>
                            <TagIcon className="h-full w-full" />
                          </Chip.Icon>
                          <Chip.Label>{keyword}</Chip.Label>
                          <Chip.DismissTrigger onClick={() => handleRemoveKeyword(keyword)} />
                        </Chip>
                      )) : (
                        <Typography className="text-sm text-slate-500 dark:text-slate-400">
                          Belum ada keyword.
                        </Typography>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="w-full">
                    <Typography as="label" htmlFor="id-playstore" type="small" color="default" className="font-semibold">
                      ID Playstore
                    </Typography>
                    <Input id="id-playstore" value={editForm.playstoreId} onChange={(event) => handleEditFormChange("playstoreId", event.target.value)} />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="w-full">
                    <Typography as="label" htmlFor="cover-url" type="small" color="default" className="font-semibold">
                      Cover URL
                    </Typography>
                    <Input id="cover-url" value={editForm.cover} onChange={(event) => handleEditFormChange("cover", event.target.value)} />
                  </div>
                  <div className="w-full">
                    <Typography as="label" htmlFor="url-book" type="small" color="default" className="font-semibold">
                      Download Link
                    </Typography>
                    <Input id="url-book" value={editForm.downloadLink} onChange={(event) => handleEditFormChange("downloadLink", event.target.value)} />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="w-full">
                    <Typography as="label" htmlFor="harga" type="small" color="default" className="font-semibold">
                      Harga
                    </Typography>
                    <Input id="harga" type="number" value={String(editForm.price)} onChange={(event) => handleEditFormChange("price", Number(event.target.value) || 0)} />
                  </div>
                  <div className="w-full">
                    <Typography as="label" htmlFor="versi" type="small" color="default" className="font-semibold">
                      Versi
                    </Typography>
                    <Input id="versi" type="number" value={String(editForm.version)} onChange={(event) => handleEditFormChange("version", Number(event.target.value) || 1)} />
                  </div>
                  <div className="space-y-2">
                    <div className="w-full">
                      <Typography as="label" htmlFor="status" type="small" color="default" className="font-semibold">
                        Status
                      </Typography>
                      <Select value={editForm.status} onValueChange={(value) => handleEditFormChange("status", value ?? "draft")}>
                        <Select.Trigger id="status" placeholder="Pilih status" />
                        <Select.List>
                          <Select.Option value="publish">publish</Select.Option>
                          <Select.Option value="draft">draft</Select.Option>
                        </Select.List>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="lock" checked={editForm.lock} onChange={(event) => handleEditFormChange("lock", event.target.checked)}>
                    <Checkbox.Indicator />
                  </Checkbox>
                  <Typography as="label" htmlFor="lock" className="cursor-pointer text-foreground">
                    Kunci buku
                  </Typography>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
            <Button variant="ghost" color="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button color="success" className="flex items-center gap-2" onClick={() => editForm && onSave(editForm)} disabled={!editForm || isSyncing || activeEditKey === editForm.originalKey}>
              {editForm && activeEditKey === editForm.originalKey ? <LoaderCircleIcon className="h-4 w-4 animate-spin" /> : <SaveIcon className="h-4 w-4" />}
              Simpan
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Overlay>
    </Dialog>
  );
}
