import React, { useState } from "react";
import {
  Card,
  CardBody,
  Typography,
  Button,
  IconButton,
  Input,
  Select,
  Chip,
  Menu,
  Dialog,
} from "@material-tailwind/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router } from "@inertiajs/react";
import {
  SearchIcon,
  PlusIcon,
  LayoutGridIcon,
  ListIcon,
  EditIcon,
  Trash2Icon,
  BookIcon,
  EyeIcon,
  MoreVerticalIcon,
  XIcon,
  DownloadCloudIcon,
  UploadCloudIcon,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { PageHeader } from "@/Components/PageHeader";
import Pagination from "@/Components/Pagination";

// --- Types ---
interface Book {
  id: number;
  uuid: string;
  title: string;
  type: string;
  coverUrl: string;
  tags: string[] | null;
  url: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

const formatBookDate = (date: string) => {
  return new Date(date).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const BookRow = ({ book, onDelete }: { book: Book; onDelete: (book: Book) => void }) => {
  const classes = "p-4 border-b border-slate-100 dark:border-slate-800";

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <td className={classes}>
        <div className="flex items-center gap-4">
          <img
            src={book.coverUrl}
            alt={book.title}
            className="h-16 w-12 rounded object-cover shadow-sm border border-slate-200 dark:border-slate-700"
          />
          <div>
            <Typography variant="small" className="font-bold text-slate-800 dark:text-white line-clamp-1 max-w-[200px]" title={book.title}>
              {book.title}
            </Typography>
            <div className="flex flex-wrap items-center gap-2">
              <Typography variant="small" className="text-[10px] text-slate-400">
                ID: {book.uuid}
              </Typography>
              <Chip size="sm" variant="ghost" className="h-auto bg-blue-50 py-0.5 text-[9px] capitalize text-blue-600 dark:bg-blue-900/20 dark:text-blue-300">
                <Chip.Label>{book.type === "penilaian" ? "Penilaian" : "Materi"}</Chip.Label>
              </Chip>
            </div>
          </div>
        </div>
      </td>
      <td className={classes}>
        <div className="flex flex-col gap-1">
          {book.tags && book.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {book.tags.map((tag, i) => (
                <Chip key={i} size="sm" variant="ghost" className="text-[9px] py-0.5 h-auto bg-slate-100 dark:bg-slate-800 dark:text-slate-400">
                  <Chip.Label>{tag}</Chip.Label>
                </Chip>
              ))}
            </div>
          ) : (
            <Typography variant="small" className="text-xs text-slate-400">
              Belum ada tag
            </Typography>
          )}
        </div>
      </td>
      <td className={classes}>
        <Typography variant="small" className="font-bold text-slate-700 dark:text-slate-300">
          v{book.version}
        </Typography>
      </td>
      <td className={classes}>
        <Menu placement="bottom-end">
          <Menu.Trigger>
            <MoreVerticalIcon className="w-4 h-4" />
          </Menu.Trigger>
          <Menu.Content>
            <Menu.Item onClick={() => router.get(route("admin.books.show", book.id))}>
              <EyeIcon className="w-4 h-4 mr-2" /> Lihat
            </Menu.Item>
            <Menu.Item onClick={() => router.get(book.url || "")} disabled={!book.url}>
              <DownloadCloudIcon className="w-4 h-4 mr-2" /> Download
            </Menu.Item>
            <Menu.Item onClick={() => router.get(route("admin.books.edit", book.id))}>
              <EditIcon className="w-4 h-4 mr-2" /> Edit
            </Menu.Item>
            <Menu.Item onClick={() => router.get(route("admin.books.upload", book.id))}>
              <UploadCloudIcon className="w-4 h-4 mr-2" /> Upload
            </Menu.Item>
            <Menu.Item onClick={() => onDelete(book)} className="text-red-500">
              <Trash2Icon className="w-4 h-4 mr-2" /> Hapus
            </Menu.Item>
          </Menu.Content>
        </Menu>
      </td>
    </tr>
  );
};

const BookCard = ({ book }: { book: Book }) => {
  return (
    <div>
      <Card className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all duration-300 group h-full">
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-xl bg-slate-100 dark:bg-slate-800">
          <img
            src={book.coverUrl}
            alt={book.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
            <div className="flex gap-2 justify-center pb-2 px-4">
              <Button
                size="sm"
                variant="ghost"
                className="flex items-center gap-2 bg-white/90 text-slate-900"
                isFullWidth={true}
                onClick={() => router.get(route("admin.books.show", book.id))}
              >
                <EyeIcon className="w-3 h-3" /> Info
              </Button>
              <Button
                size="sm"
                className="flex items-center gap-2"
                color="secondary"
                isFullWidth={true}
                onClick={() => router.get(route("admin.books.edit", book.id))}
              >
                <EditIcon className="w-3 h-3" /> Edit
              </Button>
            </div>
          </div>
        </div>
        <CardBody className="p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Typography variant="h6" className="mb-1 font-bold line-clamp-2 dark:text-white text-blue-gray-900" title={book.title}>
                {book.title}
              </Typography>
              <Typography variant="small" className="text-[10px] text-slate-400 line-clamp-1">
                ID: {book.uuid}
              </Typography>
              <Chip size="sm" variant="ghost" className="mt-2 h-auto w-max bg-blue-50 py-0.5 text-[9px] capitalize text-blue-600 dark:bg-blue-900/20 dark:text-blue-300">
                <Chip.Label>{book.type === "penilaian" ? "Penilaian" : "Materi"}</Chip.Label>
              </Chip>
            </div>
            <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              v{book.version}
            </div>
          </div>

          {book.tags && book.tags.length > 0 ? (
            <div className="mb-3 flex flex-wrap gap-1">
              {book.tags.slice(0, 3).map((tag, index) => (
                <Chip
                  key={`${book.id}-${tag}-${index}`}
                  size="sm"
                  variant="ghost"
                  className="text-[9px] py-0.5 h-auto bg-slate-100 dark:bg-slate-800 dark:text-slate-400 capitalize"
                >
                  <Chip.Label>{tag}</Chip.Label>
                </Chip>
              ))}
              {book.tags.length > 3 && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  +{book.tags.length - 3} tag
                </span>
              )}
            </div>
          ) : (
            <Typography variant="small" className="mb-3 text-xs text-slate-400">
              Belum ada tag
            </Typography>
          )}

          <div className="space-y-1 border-t border-slate-100 pt-3 dark:border-slate-800">
            <Typography variant="small" className="text-xs text-slate-500 dark:text-slate-400">
              Dibuat: {formatBookDate(book.createdAt)}
            </Typography>
            <Typography variant="small" className="text-xs text-slate-500 dark:text-slate-400">
              Diupdate: {formatBookDate(book.updatedAt)}
            </Typography>
            {book.url && (
              <a
                href={book.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 pt-1 text-xs font-medium text-primary hover:underline"
              >
                <BookIcon className="h-3.5 w-3.5" />
                Buka tautan buku
              </a>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};


// --- Main Page Component ---

export default function Index({ books: paginatedBooks, filters }: { books: any, filters: any }) {
  const [books, setBooks] = useState<Book[]>(paginatedBooks.data);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [perPage, setPerPage] = useState(filters.per_page || "25");
  const [sortBy, setSortBy] = useState(filters.sort_by || "created_at");
  const [sortDirection, setSortDirection] = useState(filters.sort_direction || "desc");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  React.useEffect(() => {
    setBooks(paginatedBooks.data);
  }, [paginatedBooks.data]);

  // Debounced Search
  React.useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm !== (filters.search || "")) {
        router.get(
          route('admin.books.index'),
          { search: searchTerm, per_page: perPage, sort_by: sortBy, sort_direction: sortDirection },
          { preserveState: true, replace: true }
        );
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handlePerPageChange = (val: string) => {
    setPerPage(val);
    router.get(
      route('admin.books.index'),
      { search: searchTerm, per_page: val, sort_by: sortBy, sort_direction: sortDirection },
      { preserveState: true, replace: true }
    );
  };

  const handleSortChange = (val: string) => {
    const [field, direction] = val.split("|");
    setSortBy(field);
    setSortDirection(direction);
    router.get(
      route('admin.books.index'),
      { search: searchTerm, per_page: perPage, sort_by: field, sort_direction: direction },
      { preserveState: true, replace: true }
    );
  };

  const openDeleteDialog = (book: Book) => {
    setCurrentBook(book);
    setIsDeleteOpen(true);
  };

  const handleDeleteBook = () => {
    if (!currentBook) {
      return;
    }

    setIsDeleting(true);

    router.delete(route("admin.books.destroy", currentBook.id), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Buku berhasil dihapus.");
        setIsDeleteOpen(false);
        setCurrentBook(null);
      },
      onError: () => {
        toast.error("Gagal menghapus buku.");
      },
      onFinish: () => {
        setIsDeleting(false);
      },
    });
  };

  return (
    <>
      <Head title="Manajemen Buku" />
      <Toaster position="top-center" />

      <div className="p-4 space-y-6">
        {/* Header Section */}
        <PageHeader
          title="Manajemen Buku"
          description="Kelola buku digital yang tersedia di aplikasi."
          actions={
            <Button
              className="flex items-center gap-2 bg-slate-900 dark:bg-white dark:text-slate-900"
              size="sm"
              onClick={() => router.get(route("admin.books.create"))}
            >
              <PlusIcon className="w-4 h-4" />
              Tambah Buku
            </Button>
          }
        />

        {/* Toolbar & Filter */}
        <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <CardBody className="p-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="order-2 md:order-1 flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1">
                <div className="w-full md:w-72">
                  <Typography as="label" htmlFor="cari" type="small" color="default" className="font-semibold">
                    Cari
                  </Typography>
                  <Input
                    id="cari"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="!border-t-blue-gray-200 focus:!border-t-gray-900 dark:focus:!border-t-white dark:text-white"
                    placeholder="Cari Judul Buku..."
                  >
                    <Input.Icon>
                      <SearchIcon className="h-4 w-4" />
                    </Input.Icon>
                  </Input>
                </div>
                <div className="w-full md:w-48">
                  <Typography as="label" htmlFor="urutkan-berdasarkan" type="small" color="default" className="font-semibold">
                    Urutkan Berdasarkan
                  </Typography>
                  <Select
                    value={`${sortBy}|${sortDirection}`}
                    onValueChange={(val) => val && handleSortChange(val)}
                  >
                    <Select.Trigger id="urutkan-berdasarkan" placeholder="Urutkan" />
                    <Select.List>
                      <Select.Option value="title|asc">Judul (A-Z)</Select.Option>
                      <Select.Option value="title|desc">Judul (Z-A)</Select.Option>
                      <Select.Option value="created_at|desc">Terbaru</Select.Option>
                      <Select.Option value="created_at|asc">Terlama</Select.Option>
                      <Select.Option value="updated_at|desc">Baru Diupdate</Select.Option>
                      <Select.Option value="updated_at|asc">Lama Diupdate</Select.Option>
                    </Select.List>
                  </Select>
                </div>
                <div className="w-full md:w-32">
                  <Typography as="label" htmlFor="jumlah-item" type="small" color="default" className="font-semibold">
                    Jumlah Item
                  </Typography>
                  <Select
                    value={perPage.toString()}
                    onValueChange={(val) => val && handlePerPageChange(val)}
                  >
                    <Select.Trigger id="jumlah-item" placeholder="Items" />
                    <Select.List>
                      <Select.Option value="25">25 per hal</Select.Option>
                      <Select.Option value="50">50 per hal</Select.Option>
                      <Select.Option value="100">100 per hal</Select.Option>
                    </Select.List>
                  </Select>
                </div>
              </div>

              <div className="order-1 md:order-2 flex items-center gap-1 md:border-l md:border-slate-200 pl-4 ml-auto dark:border-slate-700">
                <IconButton
                  variant={viewMode === "list" ? "solid" : "ghost"}
                  color="secondary"
                  size="sm"
                  onClick={() => setViewMode("list")}
                  title="Tampilan List"
                >
                  <ListIcon className="h-4 w-4" />
                </IconButton>
                <IconButton
                  variant={viewMode === "grid" ? "solid" : "ghost"}
                  color="secondary"
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  title="Tampilan Grid"
                >
                  <LayoutGridIcon className="h-4 w-4" />
                </IconButton>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Content Area */}
        {books.length > 0 ? (
          viewMode === "list" ? (
            <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-max table-auto text-left">
                  <thead>
                    <tr>
                      {["Buku", "Tags", "Versi", "Aksi"].map((head) => (
                        <th key={head} className="border-y border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-4">
                          <Typography variant="small" className="font-bold leading-none opacity-70 text-slate-500 dark:text-slate-300 text-center first:text-left">
                            {head}
                          </Typography>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {books.map((book) => (
                      <BookRow key={book.id} book={book} onDelete={openDeleteDialog} />
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-slate-50 border border-dashed border-slate-300 rounded-lg dark:bg-slate-900 dark:border-slate-700">
            <BookIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
            <Typography className="text-slate-500 dark:text-slate-400">
              Tidak ada buku ditemukan.
            </Typography>
          </div>
        )}

        {/* Pagination Controls */}
        <Pagination paginated={paginatedBooks} />
      </div>

      <Dialog open={isDeleteOpen} onOpenChange={() => setIsDeleteOpen(false)} size="sm">
        <Dialog.Overlay>
          <Dialog.Content className="dark:border-slate-800">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Typography type="h6">Hapus Buku</Typography>
                <Typography className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Apakah Anda yakin ingin menghapus buku <strong>{currentBook?.title}</strong>?
                </Typography>
              </div>
              <IconButton variant="ghost" color="secondary" onClick={() => setIsDeleteOpen(false)}>
                <XIcon className="h-4 w-4" />
              </IconButton>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button variant="ghost" color="secondary" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>
                Batal
              </Button>
              <Button color="error" onClick={handleDeleteBook} disabled={isDeleting}>
                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
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
