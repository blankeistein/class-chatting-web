import { Dispatch, SetStateAction, useMemo } from "react";
import { Button, Chip, Dialog, IconButton, Typography } from "@material-tailwind/react";
import {
  BookIcon,
  CopyIcon,
  ExternalLinkIcon,
  LockIcon,
  ShieldCheckIcon,
  XIcon,
} from "lucide-react";
import { FirebaseBookForm } from "./EditBookDialog";

type FirebaseBook = FirebaseBookForm;

type BookDetailDialogProps = {
  open: boolean;
  book: FirebaseBook | null;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  onClose: () => void;
  onCopyLink: (url: string) => void;
};

const detailItems = (book: FirebaseBook) => [
  { label: "Firebase Key", value: book.originalKey },
  { label: "ID Buku", value: book.idBook },
  { label: "ID Path", value: book.idBookPath },
  { label: "ID Playstore", value: book.idPlaystore },
  { label: "Versi", value: `v${book.version}` },
  { label: "Harga", value: String(book.price) },
];

export default function BookDetailDialog({
  open,
  book,
  onOpenChange,
  onClose,
  onCopyLink,
}: BookDetailDialogProps) {
  const keywords = useMemo(() => {
    return (book?.keyword ?? "")
      .split(",")
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword);
  }, [book?.keyword]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} size="lg">
      <Dialog.Overlay>
        <Dialog.Content className="grid max-h-[90vh] grid-rows-[auto_1fr_auto] overflow-hidden p-0 dark:border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div>
              <Typography variant="h5" className="font-bold text-slate-800 dark:text-white">
                Detail buku
              </Typography>
            </div>
            <IconButton variant="ghost" size="sm" onClick={onClose}>
              <XIcon className="h-4 w-4" />
            </IconButton>
          </div>

          <div className="overflow-y-auto px-5 py-4">
            {book && (
              <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950">
                    {book.coverBook ? (
                      <img
                        src={book.coverBook}
                        alt={book.nameBook}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          (event.target as HTMLImageElement).src = "/assets/images/book-thumbnail.webp";
                        }}
                      />
                    ) : (
                      <div className="flex h-[320px] items-center justify-center text-slate-400">
                        <BookIcon className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Chip size="sm" variant="ghost" color={book.status === "publish" ? "success" : "warning"}>
                      <Chip.Label>{book.status.toUpperCase()}</Chip.Label>
                    </Chip>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <Typography variant="h4" className="font-bold text-slate-800 dark:text-white">
                      {book.nameBook}
                    </Typography>
                    <Typography className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      URL cover dan metadata diambil dari Firebase Realtime Database.
                    </Typography>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {detailItems(book).map((item) => (
                      <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                        <Typography className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {item.label}
                        </Typography>
                        <Typography className="mt-2 break-all font-mono text-sm text-slate-800 dark:text-slate-100">
                          {item.value || "-"}
                        </Typography>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                    <Typography className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Keyword
                    </Typography>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {keywords.length > 0 ? keywords.map((keyword) => (
                        <Chip key={keyword} size="sm" variant="outline">
                          <Chip.Label>{keyword}</Chip.Label>
                        </Chip>
                      )) : (
                        <Typography className="text-sm text-slate-500 dark:text-slate-400">Belum ada keyword.</Typography>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                      <Typography className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        URL Buku
                      </Typography>
                      <Typography className="mt-2 break-all text-sm text-slate-700 dark:text-slate-200">
                        {book.urlBook || "-"}
                      </Typography>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                      <Typography className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Akses
                      </Typography>
                      <div className="mt-2 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                        {book.lock ? <LockIcon className="h-4 w-4" /> : <ShieldCheckIcon className="h-4 w-4" />}
                        <span>{book.lock ? "Buku dengan password" : "Buku dapat diakses publik"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
            <Button variant="ghost" color="secondary" onClick={onClose}>
              Tutup
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => book?.urlBook && onCopyLink(book.urlBook)}
              disabled={!book?.urlBook}
            >
              <CopyIcon className="h-4 w-4" />
              Salin Link
            </Button>
            <Button
              color="primary"
              className="flex items-center gap-2"
              onClick={() => {
                if (book?.urlBook) {
                  window.open(book.urlBook, "_blank", "noopener,noreferrer");
                }
              }}
              disabled={!book?.urlBook}
            >
              <ExternalLinkIcon className="h-4 w-4" />
              Buka Link
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Overlay>
    </Dialog>
  );
}
