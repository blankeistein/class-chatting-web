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
  Menu,
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
  MoreVerticalIcon,
  EyeIcon,
  RotateCcwIcon,
} from "lucide-react";
import { Head, router } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { toast, Toaster } from "react-hot-toast";
import GenerateCodeDialog from "./Partials/GenerateCodeDialog";
import axios from "axios";
import Pagination from "@/Components/Pagination";
import { PageHeader } from "@/Components/PageHeader";

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
  activatedAt: string | null;
  activatedIn: string | null;
  tier: {
    value: number;
    label: string;
  };
  type: string;
  timesActivated: number;
  maxActivated: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  items?: {
    id: number;
    modelId: number;
    modelType: string;
    model?: {
      id: number;
      title: string;
    };
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

export default function Index({
  activationCodes,
  filters,
  books,
  selectedBookData,
  tierOptions,
}: {
  activationCodes: PaginatedData<ActivationCode>;
  filters: Record<string, string | number | undefined>;
  books: BookItem[];
  selectedBookData?: BookItem | null;
  tierOptions: Record<string, string>;
}) {
  const [openGenerateDialog, setOpenGenerateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState((filters.search || "").toString());
  const [perPage, setPerPage] = useState((filters.per_page || "25").toString());
  const [sortBy, setSortBy] = useState((filters.sort_by || "created_at").toString());
  const [sortDirection, setSortDirection] = useState((filters.sort_direction || "desc").toString());
  const [selectedBook, setSelectedBook] = useState<BookItem | "all">(selectedBookData || "all");
  const [selectedTier, setSelectedTier] = useState((filters.tier || "").toString());
  const [selectedStatus, setSelectedStatus] = useState((filters.status || "").toString());
  const [selectedType, setSelectedType] = useState((filters.type || "").toString());
  const [selectedActivationState, setSelectedActivationState] = useState((filters.activation_state || "").toString());

  const [bookList, setBookList] = useState<BookItem[]>(books);
  const [bookSearch, setBookSearch] = useState("");
  const [isSearchingBooks, setIsSearchingBooks] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const hasActiveFilters = Boolean(
    searchTerm ||
    selectedTier ||
    selectedStatus ||
    selectedType ||
    selectedActivationState ||
    selectedBook !== "all",
  );

  const buildQueryParams = (overrides: Record<string, string | number | undefined> = {}) => ({
    search: searchTerm || undefined,
    per_page: perPage,
    sort_by: sortBy,
    sort_direction: sortDirection,
    book_id: selectedBook === "all" ? undefined : selectedBook.id,
    tier: selectedTier || undefined,
    status: selectedStatus || undefined,
    type: selectedType || undefined,
    activation_state: selectedActivationState || undefined,
    ...overrides,
  });

  const visitIndex = (overrides: Record<string, string | number | undefined> = {}) => {
    router.get(route("admin.activation-code.index"), buildQueryParams(overrides), {
      preserveState: true,
      replace: true,
    });
  };

  const handleBookSearch = async (query: string) => {
    setBookSearch(query);
    setIsSearchingBooks(true);

    try {
      const resp = await axios.get(route("admin.books.selection"), { params: { search: query } });
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
    visitIndex({ book_id: book === "all" ? undefined : book.id });
  };

  const handleSearch = () => {
    visitIndex();
  };

  const handleSortChange = (val: string | undefined) => {
    if (!val) {
      return;
    }

    const [field, direction] = val.split("|");
    setSortBy(field);
    setSortDirection(direction);
    visitIndex({ sort_by: field, sort_direction: direction });
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedBook("all");
    setSelectedTier("");
    setSelectedStatus("");
    setSelectedType("");
    setSelectedActivationState("");
    setBookSearch("");
    setBookList(books);
    visitIndex({
      search: undefined,
      book_id: undefined,
      tier: undefined,
      status: undefined,
      type: undefined,
      activation_state: undefined,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus kode aktivasi ini?")) {
      const toastId = toast.loading("Menghapus kode aktivasi...");

      router.delete(route("admin.activation-code.destroy", id), {
        onSuccess: () => {
          toast.dismiss(toastId);
          toast.success("Kode berhasil dihapus");
        },
      });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Kode disalin ke clipboard!");
  };

  const handleToggleActive = (id: number) => {
    router.patch(route("admin.activation-code.toggle-active", id), {}, {
      preserveState: true,
      onSuccess: () => {
        toast.success("Status kode berhasil diubah");
      },
    });
  };

  const getStatus = (item: ActivationCode) => {
    if (!item.isActive) {
      return "revoked";
    }

    if (item.maxActivated && item.timesActivated >= item.maxActivated) {
      return "used";
    }

    if (item.timesActivated > 0) {
      return "active";
    }

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
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === activationCodes.data.length && activationCodes.data.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(activationCodes.data.map((item) => item.id));
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} kode aktivasi ini?`)) {
      router.delete(route("admin.activation-code.bulk-delete"), {
        data: { ids: selectedIds },
        onSuccess: () => {
          setSelectedIds([]);
          toast.success("Kode berhasil dihapus");
        },
      });
    }
  };

  const handleBulkExport = () => {
    const ids = selectedIds.join(",");
    window.location.href = route("admin.activation-code.bulk-export", { ids });
  };

  return (
    <>
      <Head title="Manajemen Kode Aktivasi" />
      <Toaster position="top-center" />

      <div className="space-y-6 p-4">
        <PageHeader
          title="Manajemen Kode Aktivasi"
          description="Kelola dan generate kode aktivasi untuk akses aplikasi."
          actions={
            <Button
              className="flex items-center gap-2 bg-slate-900 dark:bg-white dark:text-slate-900"
              size="sm"
              onClick={() => setOpenGenerateDialog(true)}
            >
              <PlusIcon className="h-4 w-4" /> Generate Kode Baru
            </Button>
          }
        />

        {selectedIds.length > 0 && (
          <Card color="secondary" className="fixed bottom-8 left-1/2 z-30 flex w-[90%] -translate-x-1/2 animate-in flex-row items-center justify-between gap-3 p-3 text-white duration-300 fade-in slide-in-from-top-4 lg:w-[600px]">
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

        <Card className="border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardBody className="space-y-4 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative w-full md:w-72 space-y-1">
                <Typography as="label" htmlFor="cari-nama" type="small" color="default" className="font-semibold">
                  Cari
                </Typography>
                <Input
                  id="cari-nama"
                  placeholder="Cari kode atau user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyUp={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 dark:text-white"
                >
                  <Input.Icon>
                    <SearchIcon className="h-4 w-4 text-slate-400" />
                  </Input.Icon>
                </Input>
              </div>

              <div className="w-full md:w-64 space-y-1">
                <Typography as="label" htmlFor="filter-buku" type="small" color="default" className="font-semibold" onClick={() => setIsPopoverOpen(!isPopoverOpen)}>
                  Filter Buku
                </Typography>
                <Popover placement="bottom-start" open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <Popover.Trigger
                    as={Button}
                    variant="outline"
                    className="flex w-full items-center justify-between text-left font-normal capitalize"
                    color="secondary"
                    onClick={() => setIsPopoverOpen(!isPopoverOpen)}
                  >
                    <span className="truncate">
                      {selectedBook === "all" ? "Semua Buku" : selectedBook.title}
                    </span>
                    <ChevronDownIcon className="ml-2 h-4 w-4 opacity-50" />
                  </Popover.Trigger>
                  <Popover.Content className="z-[999] w-[80%] md:w-72 border-slate-200 p-0 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                    <div className="relative border-b border-slate-100 p-2 dark:border-slate-800">
                      <Input
                        placeholder="Cari buku..."
                        value={bookSearch}
                        onChange={(e) => handleBookSearch(e.target.value)}
                        className="pl-10 dark:text-white"
                      />
                      <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      {isSearchingBooks && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <Loader2Icon className="h-4 w-4 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                    <List className="max-h-60 overflow-y-auto p-1">
                      <ListItem className="py-2 text-sm" onClick={() => selectBook("all")}>
                        Semua Buku
                      </ListItem>
                      {bookList.map((book) => (
                        <ListItem key={book.id} className="py-2 text-sm" onClick={() => selectBook(book)}>
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

              <div className="w-full md:w-32 space-y-1">
                <Typography as="label" htmlFor="jumlah-item" type="small" color="default" className="font-semibold">
                  Jumlah item
                </Typography>
                <Select
                  value={perPage}
                  onValueChange={(val) => {
                    setPerPage(val);
                    visitIndex({ per_page: val });
                  }}
                >
                  <Select.Trigger id="jumlah-item" placeholder="25" />
                  <Select.List>
                    <Select.Option value="25">25 per Hal</Select.Option>
                    <Select.Option value="50">50 per Hal</Select.Option>
                    <Select.Option value="100">100 per Hal</Select.Option>
                    <Select.Option value="500">500 per Hal</Select.Option>
                    <Select.Option value="1000">1000 per Hal</Select.Option>
                  </Select.List>
                </Select>
              </div>

              <div className="w-full md:w-48 space-y-1">
                <Typography as="label" htmlFor="urutkan-berdasarkan" type="small" color="default" className="font-semibold">
                  Urutkan Berdasarkan
                </Typography>
                <Select value={`${sortBy}|${sortDirection}`} onValueChange={handleSortChange}>
                  <Select.Trigger id="urutkan-berdasarkan" placeholder="Urutkan" />
                  <Select.List>
                    <Select.Option value="updated_at|desc">Diperbarui</Select.Option>
                    <Select.Option value="created_at|desc">Terbaru</Select.Option>
                    <Select.Option value="created_at|asc">Terlama</Select.Option>
                    <Select.Option value="code|asc">Kode (A-Z)</Select.Option>
                    <Select.Option value="code|desc">Kode (Z-A)</Select.Option>
                  </Select.List>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-1">
                <Typography as="label" htmlFor="tier" type="small" color="default" className="font-semibold">
                  Tier
                </Typography>
                <Select
                  value={selectedTier || undefined}
                  onValueChange={(value) => {
                    const nextValue = value || "";
                    setSelectedTier(nextValue);
                    visitIndex({ tier: nextValue || undefined });
                  }}
                >
                  <Select.Trigger id="tier" placeholder="Semua Tier" />
                  <Select.List>
                    <Select.Option value="">Semua Tier</Select.Option>
                    {Object.entries(tierOptions).map(([value, label]) => (
                      <Select.Option key={value} value={value}>
                        {label}
                      </Select.Option>
                    ))}
                  </Select.List>
                </Select>
              </div>

              <div className="space-y-1">
                <Typography as="label" htmlFor="status-kode" type="small" color="default" className="font-semibold">
                  Status Kode
                </Typography>
                <Select
                  value={selectedStatus || undefined}
                  onValueChange={(value) => {
                    const nextValue = value || "";
                    setSelectedStatus(nextValue);
                    visitIndex({ status: nextValue || undefined });
                  }}
                >
                  <Select.Trigger id="status-kode" placeholder="Semua Status" />
                  <Select.List>
                    <Select.Option value="">Semua Status</Select.Option>
                    <Select.Option value="available">Available</Select.Option>
                    <Select.Option value="active">Active</Select.Option>
                    <Select.Option value="used">Used</Select.Option>
                    <Select.Option value="revoked">Revoked</Select.Option>
                  </Select.List>
                </Select>
              </div>

              <div className="space-y-1">
                <Typography as="label" htmlFor="jenis-kode" type="small" color="default" className="font-semibold">
                  Jenis Kode
                </Typography>
                <Select
                  value={selectedType || undefined}
                  onValueChange={(value) => {
                    const nextValue = value || "";
                    setSelectedType(nextValue);
                    visitIndex({ type: nextValue || undefined });
                  }}
                >
                  <Select.Trigger id="jenis-code" placeholder="Semua Jenis" />
                  <Select.List>
                    <Select.Option value="">Semua Jenis</Select.Option>
                    <Select.Option value="public">Public</Select.Option>
                    <Select.Option value="single">Single</Select.Option>
                  </Select.List>
                </Select>
              </div>

              <div className="space-y-1">
                <Typography as="label" htmlFor="sudah-aktif" type="small" color="default" className="font-semibold">
                  Sudah Aktif
                </Typography>
                <Select
                  value={selectedActivationState || undefined}
                  onValueChange={(value) => {
                    const nextValue = value || "";
                    setSelectedActivationState(nextValue);
                    visitIndex({ activation_state: nextValue || undefined });
                  }}
                >
                  <Select.Trigger id="sudah-aktif" placeholder="Semua Kondisi" />
                  <Select.List>
                    <Select.Option value="">Semua Kondisi</Select.Option>
                    <Select.Option value="activated">Sudah Aktif</Select.Option>
                    <Select.Option value="not_activated">Belum Aktif</Select.Option>
                  </Select.List>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button color="primary" className="flex items-center gap-2" onClick={handleSearch}>
                <SearchIcon className="h-4 w-4" /> Terapkan
              </Button>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  color="secondary"
                  className="flex items-center gap-2"
                  onClick={handleResetFilters}
                >
                  <RotateCcwIcon className="h-4 w-4" /> Reset
                </Button>
              )}
            </div>
          </CardBody>
        </Card>

        <Pagination paginated={activationCodes} />

        <Card className="border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max table-auto text-left">
              <thead>
                <tr>
                  <th className="w-10 border-y border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                    <Checkbox
                      checked={selectedIds.length === activationCodes.data.length && activationCodes.data.length > 0}
                      onChange={toggleSelectAll}
                      color="primary"
                    />
                  </th>
                  {["Kode Aktivasi", "User", "Tier", "Jenis", "Status", "Limit", "Dibuat", "Aksi"].map((head) => (
                    <th key={head} className="border-y border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
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
                  const classes = isLast ? "p-4" : "border-b border-slate-100 p-4 dark:border-slate-800";
                  const status = getStatus(item);

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${selectedIds.includes(item.id) ? "bg-blue-50/30 dark:bg-blue-900/10" : ""}`}
                    >
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
                            <Typography
                              variant="small"
                              className="group inline-flex cursor-pointer items-center gap-1.5 font-bold tracking-wider text-slate-800 transition-colors hover:text-primary dark:text-white"
                              onClick={() => handleCopyCode(item.code)}
                              title="Klik untuk menyalin kode"
                            >
                              {item.code}
                              <CopyIcon className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
                            </Typography>
                            {item.items && item.items.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {item.items.slice(0, 2).map((it) => (
                                  <span
                                    key={it.id}
                                    className="max-w-[150px] truncate rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500 dark:bg-slate-800"
                                  >
                                    {it.model?.title || "Unknown Book"}
                                  </span>
                                ))}
                                {item.items.length > 2 && (
                                  <span className="max-w-[150px] truncate rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500 dark:bg-slate-800">
                                    ...
                                  </span>
                                )}
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
                          <Typography variant="small" className="italic text-slate-400">
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
                          color={item.type === "public" ? "info" : "success"}
                          className="capitalize"
                        >
                          <Chip.Label>{item.type === "public" ? "Public" : "Single"}</Chip.Label>
                        </Chip>
                      </td>
                      <td className={classes}>
                        <div className="space-y-2">
                          <Chip
                            variant="ghost"
                            size="sm"
                            color={statusIconsColor[status] as never}
                            className="capitalize"
                          >
                            <Chip.Icon>{statusIcons[status]}</Chip.Icon>
                            <Chip.Label>{status}</Chip.Label>
                          </Chip>
                          <Typography variant="small" className="text-xs text-slate-500 dark:text-slate-400">
                            {item.timesActivated > 0 ? "Sudah aktif" : "Belum aktif"}
                          </Typography>
                        </div>
                      </td>
                      <td className={classes}>
                        <Typography variant="small" className="font-normal text-slate-600 dark:text-slate-400">
                          {item.timesActivated} / {item.maxActivated ?? "Tanpa batas"}
                        </Typography>
                      </td>
                      <td className={classes}>
                        <Typography variant="small" className="font-normal text-slate-600 dark:text-slate-400">
                          {new Date(item.createdAt).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </Typography>
                      </td>
                      <td className={classes}>
                        <div className="flex items-center gap-2">
                          <Menu placement="bottom-end">
                            <Menu.Trigger as={IconButton} variant="ghost" size="sm">
                              <MoreVerticalIcon className="w-4 h-4" />
                            </Menu.Trigger>
                            <Menu.Content>
                              <Menu.Item onClick={() => router.get(route("admin.activation-code.show", item.id))}>
                                <EyeIcon className="mr-2 h-4 w-4" />
                                Lihat Detail
                              </Menu.Item>
                              <Menu.Item
                                onClick={() => handleToggleActive(item.id)}
                                className={item.isActive ? "text-warning" : "text-success"}
                              >
                                {item.isActive ? <XCircleIcon className="mr-2 h-4 w-4" /> : <CheckCircleIcon className="mr-2 h-4 w-4" />}
                                {item.isActive ? "Nonaktifkan" : "Aktifkan"}
                              </Menu.Item>
                              <Menu.Item onClick={() => handleDelete(item.id)} className="text-error">
                                <Trash2Icon className="mr-2 h-4 w-4" />
                                Hapus
                              </Menu.Item>
                            </Menu.Content>
                          </Menu>
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

        <Pagination paginated={activationCodes} />
      </div>

      <GenerateCodeDialog open={openGenerateDialog} setOpen={setOpenGenerateDialog} />
    </>
  );
}

Index.layout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>;
};

