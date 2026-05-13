import React, { useState } from "react";
import {
  Card,
  Typography,
  IconButton,
  Input,
  Avatar,
  Chip,
} from "@material-tailwind/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router } from "@inertiajs/react";
import {
  ArrowLeftIcon,
  SearchIcon,
  BookOpenIcon,
} from "lucide-react";
import Pagination from "@/Components/Pagination";
import { PageHeader } from "@/Components/PageHeader";

interface ActivationCode {
  id: number;
  code: string;
  tier: string | null;
  is_active: boolean;
}

interface Book {
  id: number;
  title: string;
  type: string;
  cover_url: string | null;
  thumbnail: string;
  tags: string[] | null;
}

interface UserBook {
  id: number;
  book: Book;
  activation_code: ActivationCode | null;
  created_at: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  image: string;
}

export default function Books({
  user,
  userBooks: paginatedUserBooks,
  filters,
}: {
  user: User;
  userBooks: any;
  filters?: { search?: string };
}) {
  const [search, setSearch] = useState(filters?.search || "");
  const userBooks: UserBook[] = paginatedUserBooks.data;

  const handleFilter = () => {
    router.get(route("admin.users.books", user.id), { search }, {
      preserveState: true,
      replace: true,
      only: ["userBooks", "filters"],
    });
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleFilter();
    }
  };

  return (
    <>
      <Head title={`Daftar Buku - ${user.name}`} />

      <div className="p-4 space-y-6 min-h-screen">
        {/* Header Section */}
        <PageHeader
          title={`Daftar Buku Milik ${user.name}`}
          description={`Buku yang dimiliki oleh ${user.email}`}
          backAction={
            <IconButton
              variant="ghost"
              onClick={() => router.get(route('admin.activation-code.index'))}
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </IconButton>
          }
        />

        {/* Search */}
        <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <Card.Body className="p-4">
            <div className="w-full space-y-1">
              <Typography as="label" htmlFor="cari-buku" type="small" color="default" className="font-semibold">
                Cari Buku
              </Typography>
              <Input
                id="cari-buku"
                placeholder="Cari judul buku..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyPress}
                className="pr-10 dark:text-white"
              >
                <Input.Icon>
                  <SearchIcon className="w-4 h-4 cursor-pointer" onClick={handleFilter} />
                </Input.Icon>
              </Input>
            </div>
          </Card.Body>
        </Card>

        <Pagination paginated={paginatedUserBooks} />

        {/* Content Area */}
        {userBooks.length > 0 ? (
          <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max table-auto text-left">
                <thead>
                  <tr>
                    {["Cover", "Judul", "Kode Aktivasi", "Tanggal Aktivasi"].map((head) => (
                      <th
                        key={head}
                        className="border-y border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-4"
                      >
                        <Typography
                          variant="small"
                          className="font-bold leading-none opacity-70 text-slate-500 dark:text-slate-300"
                        >
                          {head}
                        </Typography>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {userBooks.map((userBook) => (
                    <tr
                      key={userBook.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800"
                    >
                      <td className="p-4">
                        <Avatar
                          src={userBook.book.thumbnail}
                          alt={userBook.book.title}
                          size="sm"
                          shape="rounded"
                        />
                      </td>
                      <td className="p-4">
                        <Typography
                          variant="small"
                          className="font-bold text-slate-800 dark:text-white"
                        >
                          {userBook.book.title}
                        </Typography>
                      </td>
                      <td className="p-4">
                        {userBook.activation_code ? (
                          <div className="space-y-1">
                            <Typography variant="small" className="font-mono font-bold text-slate-800 dark:text-white">
                              {userBook.activation_code.code}
                            </Typography>
                          </div>
                        ) : (
                          <Typography variant="small" className="text-slate-400">-</Typography>
                        )}
                      </td>
                      <td className="p-4">
                        <Typography variant="small" className="text-slate-600 dark:text-slate-300">
                          {userBook.created_at
                            ? new Date(userBook.created_at).toLocaleDateString("id-ID", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                            : "-"}
                        </Typography>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-slate-50 border border-dashed border-slate-300 rounded-lg dark:bg-slate-900 dark:border-slate-700">
            <BookOpenIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
            <Typography className="text-slate-500 dark:text-slate-400">
              User ini belum memiliki buku.
            </Typography>
          </div>
        )}

        {/* Pagination */}
        <Pagination paginated={paginatedUserBooks} />
      </div>
    </>
  );
}

Books.layout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>;
};
