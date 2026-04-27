import React, { Dispatch, SetStateAction } from "react";
import axios from "axios";
import {
  Button,
  Card,
  Chip,
  Dialog,
  IconButton,
  Input,
  Typography,
} from "@material-tailwind/react";
import { LoaderCircleIcon, PlusIcon, SearchIcon, XIcon } from "lucide-react";
import { toast } from "react-hot-toast";

export type MysqlBook = {
  id: number;
  uuid: string;
  title: string;
  coverUrl: string;
  tags: string[] | null;
  url: string | null;
  version: number;
};

type AddBookDialogProps = {
  open: boolean;
  existingRealtimeIds: string[];
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  onAddBook: (book: MysqlBook) => Promise<void>;
};

export default function AddBookDialog({
  open,
  existingRealtimeIds,
  onOpenChange,
  onAddBook,
}: AddBookDialogProps) {
  const [mysqlBooks, setMysqlBooks] = React.useState<MysqlBook[]>([]);
  const [mysqlSearch, setMysqlSearch] = React.useState("");
  const deferredMysqlSearch = React.useDeferredValue(mysqlSearch);
  const [isMysqlLoading, setIsMysqlLoading] = React.useState(false);
  const [activeMysqlBookId, setActiveMysqlBookId] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsMysqlLoading(true);

      try {
        const response = await axios.get<MysqlBook[]>(route("admin.books.selection"), {
          params: { search: deferredMysqlSearch },
          signal: controller.signal,
        });

        console.log("Fetched MySQL books:", response.data);

        setMysqlBooks(response.data);
      } catch (error) {
        if (!axios.isCancel(error)) {
          setMysqlBooks([]);
          toast.error("Gagal mengambil daftar buku MySQL.");
        }
      } finally {
        setIsMysqlLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [deferredMysqlSearch, open]);

  const handleAdd = async (book: MysqlBook) => {
    setActiveMysqlBookId(book.id);

    try {
      await onAddBook(book);
    } finally {
      setActiveMysqlBookId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} size="lg">
      <Dialog.Overlay>
        <Dialog.Content className="grid max-h-[90vh] grid-rows-[auto_1fr_auto] overflow-hidden p-0 dark:border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div>
              <Typography variant="h5" className="font-bold text-slate-800 dark:text-white">
                Tambah buku dari database MySQL
              </Typography>
              <Typography className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Pilih buku MySQL untuk dikirim ke path <span className="font-mono">/AllBooks</span>.
              </Typography>
            </div>
            <IconButton variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <XIcon className="h-4 w-4" />
            </IconButton>
          </div>

          <div className="space-y-4 overflow-y-auto px-5 py-4">
            <Input
              value={mysqlSearch}
              onChange={(event) => setMysqlSearch(event.target.value)}
              placeholder="Cari judul buku MySQL..."
            >
              <Input.Icon>
                <SearchIcon className="h-4 w-4" />
              </Input.Icon>
            </Input>

            <div className="space-y-3 pr-1">
              {isMysqlLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
                ))
              ) : mysqlBooks.length > 0 ? (
                mysqlBooks.map((book) => {
                  const realtimeId = book.uuid.replace(/-/g, "").toUpperCase();
                  const existsInRealtime = existingRealtimeIds.includes(realtimeId);
                  const isAdding = activeMysqlBookId === book.id;

                  return (
                    <Card key={book.id} className="border border-slate-200 p-4 shadow-none dark:border-slate-800">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <img
                          src={book.coverUrl}
                          alt={book.title}
                          className="h-24 w-16 rounded-xl border border-slate-200 object-cover dark:border-slate-800"
                        />
                        <div className="min-w-0 flex-1">
                          <Typography className="font-semibold text-slate-800 dark:text-white">
                            {book.title}
                          </Typography>
                          <Typography className="mt-1 break-all font-mono text-xs text-slate-500 dark:text-slate-400">
                            {book.uuid}
                          </Typography>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Chip size="sm" variant="ghost" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              <Chip.Label>v{book.version}</Chip.Label>
                            </Chip>
                            {(book.tags ?? []).slice(0, 3).map((tag) => (
                              <Chip key={tag} size="sm" variant="ghost" className="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                                <Chip.Label>{tag}</Chip.Label>
                              </Chip>
                            ))}
                          </div>
                        </div>
                        <Button
                          color={existsInRealtime ? "secondary" : "success"}
                          disabled={existsInRealtime || isAdding}
                          className="flex items-center justify-center gap-2"
                          onClick={() => handleAdd(book)}
                        >
                          {isAdding ? <LoaderCircleIcon className="h-4 w-4 animate-spin" /> : <PlusIcon className="h-4 w-4" />}
                          {existsInRealtime ? "Sudah ada" : "Tambah"}
                        </Button>
                      </div>
                    </Card>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900">
                  <Typography className="font-medium text-slate-700 dark:text-slate-200">
                    Data buku MySQL tidak ditemukan
                  </Typography>
                  <Typography className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Coba ubah kata kunci pencarian.
                  </Typography>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 px-5 py-4 dark:border-slate-800">
            <Button variant="ghost" color="secondary" onClick={() => onOpenChange(false)}>
              Tutup
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Overlay>
    </Dialog>
  );
}
