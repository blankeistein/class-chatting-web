import React, { useState } from "react";
import {
  Card,
  CardBody,
  Typography,
  Button,
  IconButton,
  Input,
  Select,
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
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

// --- Types ---
interface Book {
  id: number;
  uuid: string;
  title: string;
  cover_url: string;
  order: number;
  created_at: string;
  updated_at: string;
}

// --- Components ---

const BookRow = ({ book }: { book: Book }) => {
  const classes = "p-4 border-b border-slate-100 dark:border-slate-800";

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <td className={classes}>
        <div className="flex items-center gap-4">
          <img
            src={book.cover_url}
            alt={book.title}
            className="h-16 w-12 rounded object-cover shadow-sm border border-slate-200 dark:border-slate-700"
          />
          <div>
            <Typography variant="small" className="font-bold text-slate-800 dark:text-white line-clamp-1 max-w-[200px]" title={book.title}>
              {book.title}
            </Typography>
            <Typography variant="small" className="text-[10px] text-slate-400">
              ID: {book.uuid}
            </Typography>
          </div>
        </div>
      </td>
      <td className={classes}>
        {new Date(book.created_at).toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </td>
      <td className={classes}>
        {new Date(book.updated_at).toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </td>
      <td className={classes}>
        <div className="flex gap-2">
          <IconButton variant="ghost" size="sm" title="Edit Buku">
            <EditIcon className="w-4 h-4 text-blue-500" />
          </IconButton>
          <IconButton variant="ghost" size="sm" title="Hapus Buku">
            <Trash2Icon className="w-4 h-4 text-red-500" />
          </IconButton>
        </div>
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
            src={book.cover_url}
            alt={book.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
            <div className="flex gap-2 justify-center pb-2">
              <Button size="sm" className="flex items-center gap-2" color="secondary" isFullWidth={true}>
                <EditIcon className="w-3 h-3" /> Edit
              </Button>
            </div>
          </div>
        </div>
        <CardBody className="p-4">
          <Typography variant="h6" className="mb-1 font-bold line-clamp-1 dark:text-white text-blue-gray-900" title={book.title}>
            {book.title}
          </Typography>
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

  React.useEffect(() => {
    setBooks(paginatedBooks.data);
  }, [paginatedBooks.data]);

  // Debounced Search
  React.useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm !== (filters.search || "")) {
        router.get(
          route('admin.books'),
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
      route('admin.books'),
      { search: searchTerm, per_page: val, sort_by: sortBy, sort_direction: sortDirection },
      { preserveState: true, replace: true }
    );
  };

  const handleSortChange = (val: string) => {
    const [field, direction] = val.split("|");
    setSortBy(field);
    setSortDirection(direction);
    router.get(
      route('admin.books'),
      { search: searchTerm, per_page: perPage, sort_by: field, sort_direction: direction },
      { preserveState: true, replace: true }
    );
  };

  return (
    <>
      <Head title="Manajemen Buku" />
      <Toaster position="bottom-center" />

      <div className="p-4 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Typography variant="h4" className="font-bold text-slate-800 dark:text-white">
              Daftar Buku
            </Typography>
            <Typography className="text-slate-500 dark:text-slate-400">
              Kelola koleksi buku dan materi pembelajaran.
            </Typography>
          </div>
          <div className="flex gap-2">
            <Button className="flex items-center gap-2 bg-slate-900 dark:bg-white dark:text-slate-900" size="sm">
              <PlusIcon className="w-4 h-4" />
              Tambah Buku
            </Button>
          </div>
        </div>

        {/* Toolbar & Filter */}
        <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <CardBody className="p-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex gap-4 w-full md:w-auto flex-1">
                <div className="w-full md:w-72">
                  <Input
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
                <div className="w-full md:w-32">
                  <Select
                    value={perPage.toString()}
                    onValueChange={(val) => val && handlePerPageChange(val)}
                  >
                    <Select.Trigger className="dark:text-white" placeholder="Items" />
                    <Select.List>
                      <Select.Option value="25">25 per hal</Select.Option>
                      <Select.Option value="50">50 per hal</Select.Option>
                      <Select.Option value="100">100 per hal</Select.Option>
                    </Select.List>
                  </Select>
                </div>
                <div className="w-full md:w-48">
                  <Select
                    value={`${sortBy}|${sortDirection}`}
                    onValueChange={(val) => val && handleSortChange(val)}
                  >
                    <Select.Trigger className="dark:text-white" placeholder="Urutkan" />
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

              </div>

              <div className="flex items-center gap-1 border-l border-slate-200 pl-4 ml-auto dark:border-slate-700">
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
                      {["Buku", "Terbit", "Update", "Aksi"].map((head) => (
                        <th key={head} className="border-y border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-4">
                          <Typography variant="small" className="font-bold leading-none opacity-70 text-slate-500 dark:text-slate-300">
                            {head}
                          </Typography>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {books.map((book) => (
                      <BookRow key={book.id} book={book} />
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
        <div className="mt-8 flex justify-center gap-2">
          {(paginatedBooks.meta?.links || paginatedBooks.links).map((link: any, key: number) => (
            <Button
              key={key}
              variant={link.active ? "solid" : "ghost"}
              size="sm"
              color={link.active ? "primary" : "secondary"}
              className={`flex items-center gap-2 ${!link.url ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => link.url && router.get(link.url, { search: searchTerm, per_page: perPage, sort_by: sortBy, sort_direction: sortDirection }, { preserveState: true })}
              dangerouslySetInnerHTML={{ __html: link.label }}
              disabled={!link.url}
            >
            </Button>
          ))}
        </div>
      </div>
    </>
  );
}

Index.layout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>;
};
