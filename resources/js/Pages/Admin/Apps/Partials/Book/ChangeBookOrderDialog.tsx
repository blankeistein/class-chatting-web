import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  Button,
  Dialog,
  IconButton,
  Input,
  Typography,
} from "@material-tailwind/react";
import { ArrowDownUpIcon, BookIcon, XIcon } from "lucide-react";
import { Book } from "@/Pages/Admin/Apps/ClassChatting/Book/Index";

type ChangeBookOrderDialogProps = {
  open: boolean;
  book: Book | null;
  totalBooks: number;
  onOpenChange?: Dispatch<SetStateAction<boolean>>;
  onClose: () => void;
  onSubmit: (book: Book, targetOrder: number) => void;
};

export default function ChangeBookOrderDialog({
  open,
  book,
  totalBooks,
  onOpenChange,
  onClose,
  onSubmit,
}: ChangeBookOrderDialogProps) {
  const [targetOrder, setTargetOrder] = useState<number | string>("");

  useEffect(() => {
    if (book) {
      setTargetOrder(book.order);
    }
  }, [book, open]);

  const numericTarget = Number(targetOrder);
  const isValid =
    !isNaN(numericTarget) &&
    numericTarget >= 1 &&
    numericTarget <= totalBooks &&
    book !== null &&
    numericTarget !== book.order;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!book || !isValid) {
      return;
    }

    onSubmit(book, numericTarget);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange ?? onClose} size="sm">
      <Dialog.Overlay lockScroll={false}>
        <Dialog.Content className="overflow-hidden p-0 dark:border-slate-800">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ArrowDownUpIcon className="h-5 w-5 text-amber-500" />
                <Typography variant="h5" className="font-bold text-slate-800 dark:text-white">
                  Ubah Urutan Buku
                </Typography>
              </div>
              <IconButton variant="ghost" size="sm" onClick={onClose} type="button">
                <XIcon className="h-4 w-4" />
              </IconButton>
            </div>

            <div className="space-y-4 px-5 py-4">
              {book && (
                <>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                    <div className="h-14 w-10 shrink-0 overflow-hidden rounded border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                      {book.cover ? (
                        <img
                          src={book.cover}
                          alt={book.name}
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            (event.target as HTMLImageElement).src = "/assets/images/book-thumbnail.webp";
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                          <BookIcon className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Typography className="truncate text-sm font-semibold text-slate-800 dark:text-white">
                        {book.name}
                      </Typography>
                      <Typography className="text-xs text-slate-500 dark:text-slate-400">
                        Urutan saat ini:{" "}
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          #{book.order}
                        </span>{" "}
                        dari {totalBooks} buku
                      </Typography>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Typography
                      as="label"
                      htmlFor="target-order"
                      type="small"
                      color="default"
                      className="font-semibold dark:text-white"
                    >
                      Pindahkan ke urutan ke:
                    </Typography>
                    <Input
                      id="target-order"
                      type="number"
                      min={1}
                      max={totalBooks}
                      value={String(targetOrder)}
                      onChange={(event) => setTargetOrder(event.target.value)}
                      placeholder={`1 - ${totalBooks}`}
                      autoFocus
                    />
                    <Typography className="text-xs text-slate-500 dark:text-slate-400">
                      Masukkan angka antara 1 sampai {totalBooks}.
                    </Typography>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
              <Button variant="ghost" color="secondary" onClick={onClose} type="button">
                Batal
              </Button>
              <Button
                color="primary"
                type="submit"
                disabled={!isValid}
                className="flex items-center gap-2"
              >
                <ArrowDownUpIcon className="h-4 w-4" />
                Pindahkan
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Overlay>
    </Dialog>
  );
}
