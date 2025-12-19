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
  Popover,
  List,
  ListItem,
  Checkbox as MaterialCheckbox,
} from "@material-tailwind/react";
import Checkbox from "@/Components/Checkbox";
import {
  PlusIcon,
  SearchIcon,
  CopyIcon,
  Trash2Icon,
  TicketIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChevronDownIcon,
  Loader2Icon,
} from "lucide-react";
import { Head, router } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { toast, Toaster } from "react-hot-toast";
import GenerateCodeDialog from "./Partials/GenerateCodeDialog";
import axios from "axios";

interface User {
  name: string;
  email: string;
}

interface BookItem {
  id: number;
  title: string;
}

interface ActivationCode {
  id: number;
  code: string;
  user: User | null;
  activated_at: string | null;
  activated_in: string | null;
  tier: {
    value: number;
    label: string;
  };
  type: string;
  times_activated: number;
  max_activated: number;
  created_at: string;
  updated_at: string;
  items?: {
    id: number;
    model_id: number;
    model_type: string;
    model?: {
      id: number;
      title: string;
    }
  }[];
}

interface Link {
  url: string | null;
  label: string;
  active: boolean;
}

interface Meta {
  current_page: number;
  from: number;
  last_page: number;
  links: Link[];
  path: string;
  per_page: number;
  to: number;
  total: number;
}

interface PaginatedData<T> {
  data: T[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: Meta;
}

export default function Index({ activationCodes, filters, books, selectedBookData }: {
  activationCodes: PaginatedData<ActivationCode>,
  filters: any,
  books: BookItem[],
  selectedBookData?: BookItem | null
}) {
  const [openGenerateDialog, setOpenGenerateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [perPage, setPerPage] = useState(filters.per_page || "25");
  const [sortBy, setSortBy] = useState(filters.sort_by || "created_at");
  const [sortDirection, setSortDirection] = useState(filters.sort_direction || "desc");
  const [selectedBook, setSelectedBook] = useState<BookItem | "all">(selectedBookData || "all");

  // Searchable Book Filter State
  const [bookList, setBookList] = useState<BookItem[]>(books);
  const [bookSearch, setBookSearch] = useState("");
  const [isSearchingBooks, setIsSearchingBooks] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const handleBookSearch = async (query: string) => {
    setBookSearch(query);
    setIsSearchingBooks(true);
    try {
      const resp = await axios.get(route('admin.books.selection'), { params: { search: query } });
      setBookList(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingBooks(false);
    }
  };

  const selectBook = (book: BookItem | "all") => {
    setSelectedBook(book);
    setIsPopoverOpen(false);
    const bookId = book === "all" ? undefined : book.id;
    router.get(route('admin.activation-code.index'), {
      search: searchTerm,
      per_page: perPage,
      sort_by: sortBy,
      sort_direction: sortDirection,
      book_id: bookId,
    }, { preserveState: true });
  };

  const handleSearch = () => {
    router.get(route('admin.activation-code.index'), {
      search: searchTerm,
      per_page: perPage,
      sort_by: sortBy,
      sort_direction: sortDirection,
      book_id: selectedBook === "all" ? undefined : (selectedBook as BookItem).id,
    }, { preserveState: true });
  };

  const handleSortChange = (val: string | undefined) => {
    if (!val) return;
    const [field, direction] = val.split("|");
    setSortBy(field);
    setSortDirection(direction);
    router.get(route('admin.activation-code.index'), {
      search: searchTerm,
      per_page: perPage,
      sort_by: field,
      sort_direction: direction,
      book_id: selectedBook === "all" ? undefined : (selectedBook as BookItem).id,
    }, { preserveState: true });
  };

  const handleDelete = (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus kode aktivasi ini?")) {
      let toastId = toast.loading('Menghapus kode aktivasi...')
      router.delete(route('admin.activation-code.destroy', id), {
        onSuccess: () => {
          toast.dismiss(toastId)
          toast.success("Kode berhasil dihapus")
        },
      });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Kode disalin ke clipboard!");
  };

  const getStatus = (item: ActivationCode) => {
    if (item.max_activated && item.times_activated >= item.max_activated) return "used";
    if (item.times_activated > 0) return "active";
    return "available";
  };

  const statusIcons: Record<string, React.ReactNode> = {
    used: <CheckCircleIcon className="h-3 w-3" />,
    active: <ClockIcon className="h-3 w-3" />,
    available: <PlusIcon className="h-3 w-3" />,
    revoked: <XCircleIcon className="h-3 w-3" />,
  };

  const statusIconsColor: Record<string, string> = {
    used: "success",
    active: "info",
    available: "warning",
    revoked: "error",
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === activationCodes.data.length && activationCodes.data.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(activationCodes.data.map(item => item.id));
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} kode aktivasi ini?`)) {
      router.delete(route('admin.activation-code.bulk-delete'), {
        data: { ids: selectedIds },
        onSuccess: () => {
          setSelectedIds([]);
          toast.success("Kode berhasil dihapus");
        },
      });
    }
  };

  const handleBulkExport = () => {
    const ids = selectedIds.join(',');
    window.location.href = route('admin.activation-code.bulk-export', { ids });
  };


  return (
    <>
      <Head title="Manajemen Kode Aktivasi" />
      <Toaster position="top-center" />

      <div className="p-4 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Typography variant="h4" className="font-bold text-slate-800 dark:text-white">
              Kode Aktivasi
            </Typography>
            <Typography variant="small" className="text-slate-500 dark:text-slate-400">
              Kelola dan generate kode aktivasi untuk akses aplikasi.
            </Typography>
          </div>
          <Button
            className="flex items-center gap-3 bg-slate-900 dark:bg-white dark:text-slate-900"
            size="sm"
            onClick={() => setOpenGenerateDialog(true)}
          >
            <PlusIcon className="h-4 w-4" /> Generate Kode Baru
          </Button>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <Card className="w-[90%] lg:w-3/4 bg-slate-900 text-white p-3 flex flex-row items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300 fixed bottom-8 z-30 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedIds.length === activationCodes.data.length}
                onChange={toggleSelectAll}
                color="primary"
              />
              <Typography variant="small" className="font-bold text-white">
                {selectedIds.length} Item Terpilih
              </Typography>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                color="secondary"
                className="flex items-center gap-2 text-white"
                onClick={handleBulkExport}
              >
                <CopyIcon className="h-4 w-4" /> Export CSV
              </Button>
              <Button
                size="sm"
                variant="ghost"
                color="error"
                className="flex items-center gap-2"
                onClick={handleBulkDelete}
              >
                <Trash2Icon className="h-4 w-4" /> Hapus Terpilih
              </Button>
            </div>
          </Card>
        )}

        {/* Filters and Stats */}
        <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <CardBody className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-full md:w-72 relative">
                <Input
                  placeholder="Cari kode atau user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyUp={(e) => e.key === "Enter" && handleSearch()}
                  className="dark:text-white pl-10"
                />
                <SearchIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              <div className="w-full md:w-64">
                <Popover placement="bottom-start" open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <Popover.Trigger>
                    <Button
                      variant="outline"
                      className="w-full flex justify-between items-center text-left font-normal capitalize"
                      color="secondary"
                      onClick={() => setIsPopoverOpen(!isPopoverOpen)}
                    >
                      <span className="truncate">
                        {selectedBook === "all" ? "Semua Buku" : selectedBook.title}
                      </span>
                      <ChevronDownIcon className="h-4 w-4 ml-2 opacity-50" />
                    </Button>
                  </Popover.Trigger>
                  <Popover.Content className="p-0 border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-xl z-[999] w-72">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800 relative">
                      <Input
                        placeholder="Cari buku..."
                        value={bookSearch}
                        onChange={(e) => handleBookSearch(e.target.value)}
                        className="dark:text-white pl-10"
                      />
                      <SearchIcon className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      {isSearchingBooks && (
                        <Loader2Icon className="h-4 w-4 absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-primary" />
                      )}
                    </div>
                    <List className="max-h-60 overflow-y-auto p-1">
                      <ListItem
                        className="text-sm py-2"
                        onClick={() => selectBook("all")}
                      >
                        Semua Buku
                      </ListItem>
                      {bookList.map((book) => (
                        <ListItem
                          key={book.id}
                          className="text-sm py-2"
                          onClick={() => selectBook(book)}
                        >
                          <span className="truncate">{book.title}</span>
                        </ListItem>
                      ))}
                      {!isSearchingBooks && bookList.length === 0 && (
                        <div className="p-4 text-center text-xs text-slate-500">
                          Buku tidak ditemukan
                        </div>
                      )}
                    </List>
                  </Popover.Content>
                </Popover>
              </div>

              <div className="w-full md:w-32">
                <Select
                  value={perPage.toString()}
                  onValueChange={(val) => {
                    setPerPage(val);
                    router.get(route('admin.activation-code.index'), {
                      search: searchTerm,
                      per_page: val,
                      sort_by: sortBy,
                      sort_direction: sortDirection,
                      book_id: selectedBook === "all" ? undefined : selectedBook.id
                    }, { preserveState: true });
                  }}
                >
                  <Select.Trigger className="dark:text-white" placeholder="25" />
                  <Select.List>
                    <Select.Option value="10">10 per Hal</Select.Option>
                    <Select.Option value="25">25 per Hal</Select.Option>
                    <Select.Option value="50">50 per Hal</Select.Option>
                    <Select.Option value="100">100 per Hal</Select.Option>
                  </Select.List>
                </Select>
              </div>

              <div className="w-full md:w-48">
                <Select
                  value={`${sortBy}|${sortDirection}`}
                  onValueChange={handleSortChange}
                >
                  <Select.Trigger className="dark:text-white" placeholder="Urutkan" />
                  <Select.List>
                    <Select.Option value="created_at|desc">Terbaru</Select.Option>
                    <Select.Option value="created_at|asc">Terlama</Select.Option>
                    <Select.Option value="code|asc">Kode (A-Z)</Select.Option>
                    <Select.Option value="code|desc">Kode (Z-A)</Select.Option>
                  </Select.List>
                </Select>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Codes Table */}
        <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max table-auto text-left">
              <thead>
                <tr>
                  <th className="border-y border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-4 w-10">
                    <Checkbox
                      checked={selectedIds.length === activationCodes.data.length && activationCodes.data.length > 0}
                      onChange={toggleSelectAll}
                      color="primary"
                    />
                  </th>
                  {["Kode Aktivasi", "User", "Tier", "Jenis", "Status", "Limit", "Dibuat", "Aksi"].map((head) => (
                    <th key={head} className="border-y border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-4">
                      <Typography variant="small" className="font-bold leading-none opacity-70 text-slate-500 dark:text-slate-300">
                        {head}
                      </Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activationCodes.data.map((item, index) => {
                  const isLast = index === activationCodes.data.length - 1;
                  const classes = isLast ? "p-4" : "p-4 border-b border-slate-100 dark:border-slate-800";
                  const status = getStatus(item);

                  return (
                    <tr key={item.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedIds.includes(item.id) ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                      <td className={classes}>
                        <Checkbox
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          color="primary"
                        />
                      </td>
                      <td className={classes}>
                        <div className="flex items-center gap-3">
                          <TicketIcon className="h-4 w-4 text-slate-400" />
                          <div className="flex flex-col">
                            <Typography variant="small" className="font-bold text-slate-800 dark:text-white font-mono tracking-wider">
                              {item.code}
                            </Typography>
                            {item.items && item.items.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.items.slice(0, 2).map((it) => (
                                  <span key={it.id} className="text-[9px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500 max-w-[150px] truncate">
                                    {it.model?.title || 'Unknown Book'}
                                  </span>
                                ))}
                                {
                                  item.items.length > 2 &&
                                  <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500 max-w-[150px] truncate">
                                    ...
                                  </span>
                                }
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className={classes}>
                        {item.user ? (
                          <div className="flex flex-col">
                            <Typography variant="small" className="font-medium text-slate-700 dark:text-slate-300">
                              {item.user.name}
                            </Typography>
                            <Typography variant="small" className="text-[10px] text-slate-400">
                              {item.user.email}
                            </Typography>
                          </div>
                        ) : (
                          <Typography variant="small" className="text-slate-400 italic">
                            Belum digunakan
                          </Typography>
                        )}
                      </td>
                      <td className={classes}>
                        <Typography variant="small" className="font-medium text-slate-700 dark:text-slate-300">
                          {item.tier.label}
                        </Typography>
                      </td>
                      <td className={classes}>
                        <Chip
                          variant="ghost"
                          size="sm"
                          color={item.type === 'public' ? "info" : "success"}
                          className="capitalize"
                        >
                          <Chip.Label>{item.type === 'public' ? 'Public' : 'Individual'}</Chip.Label>
                        </Chip>
                      </td>
                      <td className={classes}>
                        <Chip
                          variant="ghost"
                          size="sm"
                          color={statusIconsColor[status] as any}
                          className="capitalize"
                        >
                          <Chip.Icon>
                            {statusIcons[status]}
                          </Chip.Icon>
                          <Chip.Label>{status}</Chip.Label>
                        </Chip>
                      </td>
                      <td className={classes}>
                        <Typography variant="small" className="font-normal text-slate-600 dark:text-slate-400">
                          {item.times_activated} / {item.max_activated ?? "∞"}
                        </Typography>
                      </td>
                      <td className={classes}>
                        <Typography variant="small" className="font-normal text-slate-600 dark:text-slate-400">
                          {new Date(item.created_at).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </Typography>
                      </td>
                      <td className={classes}>
                        <div className="flex items-center gap-2">
                          <IconButton variant="ghost" size="sm" onClick={() => handleCopyCode(item.code)} color="secondary">
                            <CopyIcon className="h-4 w-4" />
                          </IconButton>
                          <IconButton variant="ghost" size="sm" color="error" onClick={() => handleDelete(item.id)}>
                            <Trash2Icon className="h-4 w-4" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {activationCodes.data.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      Tidak ada data kode aktivasi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Pagination Controls */}
        <div className="mt-8 flex justify-center gap-2">
          {activationCodes.meta.links.map((link: any, key: number) => (
            <Button
              key={key}
              variant={link.active ? "solid" : "ghost"}
              size="sm"
              color={link.active ? "primary" : "secondary"}
              className={`flex items-center gap-2 ${!link.url ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => link.url && router.get(link.url, {
                search: searchTerm,
                per_page: perPage,
                sort_by: sortBy,
                sort_direction: sortDirection,
                book_id: selectedBook === "all" ? undefined : selectedBook.id
              }, { preserveState: true })}
              dangerouslySetInnerHTML={{ __html: link.label }}
              disabled={!link.url}
            />
          ))}
        </div>
      </div>

      {/* Generate Dialog */}
      <GenerateCodeDialog open={openGenerateDialog} setOpen={setOpenGenerateDialog} />
    </>
  );
}

Index.layout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>;
};
