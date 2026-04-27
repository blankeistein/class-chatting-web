import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  Dialog,
  IconButton,
  Input,
  Select,
  Typography,
} from "@material-tailwind/react";
import { LoaderCircleIcon, SaveIcon, XIcon } from "lucide-react";

export type FirebaseBookForm = {
  originalKey: string;
  coverBook: string;
  idBook: string;
  idBookPath: string;
  idPlaystore: string;
  keyword: string;
  lock: boolean;
  nameBook: string;
  orderBook: number;
  price: number;
  status: string;
  urlBook: string;
  version: number;
};

type BookEditDialogProps = {
  open: boolean;
  form: FirebaseBookForm | null;
  activeEditKey: string | null;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  onClose: () => void;
  onSave: (book: FirebaseBookForm) => void;
};

export default function BookEditDialog({
  open,
  form,
  activeEditKey,
  onOpenChange,
  onClose,
  onSave,
}: BookEditDialogProps) {
  const [editForm, setEditForm] = useState<FirebaseBookForm | null>(null);

  useEffect(() => {
    if (form) {
      setEditForm(form);
    }
  }, [form]);

  useEffect(() => {
    if (!open) {
      setEditForm(null);
    }
  }, [open]);

  const handleEditFormChange = useCallback((field: keyof FirebaseBookForm, value: string | number | boolean) => {
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
                <Typography className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Path Firebase item: <span className="font-mono">{editForm.originalKey}</span>
                </Typography>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="w-full">
                    <Typography as="label" htmlFor="judul-buku" type="small" color="default" className="font-semibold">
                      Judul Buku
                    </Typography>
                    <Input id="judul-buku" value={editForm.nameBook} onChange={(event) => handleEditFormChange("nameBook", event.target.value)} />
                  </div>
                  <div className="w-full">
                    <Typography as="label" htmlFor="keyword" type="small" color="default" className="font-semibold">
                      Keyword
                    </Typography>
                    <Input id="keyword" value={editForm.keyword} onChange={(event) => handleEditFormChange("keyword", event.target.value)} />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="w-full">
                    <Typography as="label" htmlFor="id-playstore" type="small" color="default" className="font-semibold">
                      ID Playstore
                    </Typography>
                    <Input id="id-playstore" value={editForm.idPlaystore} onChange={(event) => handleEditFormChange("idPlaystore", event.target.value)} />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="w-full">
                    <Typography as="label" htmlFor="cover-url" type="small" color="default" className="font-semibold">
                      Cover URL
                    </Typography>
                    <Input id="cover-url" value={editForm.coverBook} onChange={(event) => handleEditFormChange("coverBook", event.target.value)} />
                  </div>
                  <div className="w-full">
                    <Typography as="label" htmlFor="url-book" type="small" color="default" className="font-semibold">
                      URL Buku
                    </Typography>
                    <Input id="url-book" value={editForm.urlBook} onChange={(event) => handleEditFormChange("urlBook", event.target.value)} />
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
            <Button color="success" className="flex items-center gap-2" onClick={() => editForm && onSave(editForm)} disabled={!editForm || activeEditKey === editForm.originalKey}>
              {editForm && activeEditKey === editForm.originalKey ? <LoaderCircleIcon className="h-4 w-4 animate-spin" /> : <SaveIcon className="h-4 w-4" />}
              Simpan
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Overlay>
    </Dialog>
  );
}
