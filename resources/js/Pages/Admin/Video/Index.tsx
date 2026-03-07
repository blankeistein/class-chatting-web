import React, { useState } from "react";
import {
  Card,
  Typography,
  Button,
  IconButton,
  Dialog,
  Menu,
  Input,
  Select,
} from "@material-tailwind/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, useForm } from "@inertiajs/react";
import {
  PlusIcon,
  VideoIcon,
  EditIcon,
  Trash2Icon,
  PlayCircleIcon,
  MoreVerticalIcon,
  SearchIcon,
  ArrowUpDownIcon,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

interface Video {
  id: number;
  slug: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail: string | null;
  tags?: string[];
  created_at: string;
  uploader?: {
    name: string;
  };
}

const SORT_OPTIONS = [
  { label: "Terbaru", value: "latest" },
  { label: "Terlama", value: "oldest" },
  { label: "Nama (A-Z)", value: "name_asc" },
  { label: "Nama (Z-A)", value: "name_desc" },
];

export default function Index({ videos: paginatedVideos, filters }: { videos: any, filters?: { search?: string, sort?: string } }) {
  const [videos, setVideos] = useState<Video[]>(paginatedVideos.data);
  const [search, setSearch] = useState(filters?.search || "");
  const [sort, setSort] = useState(SORT_OPTIONS.find(o => o.value === (filters?.sort || "latest")) || SORT_OPTIONS[0]);


  // Modals state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);

  React.useEffect(() => {
    setVideos(paginatedVideos.data);
  }, [paginatedVideos.data]);

  const handleFilter = () => {
    router.get(route('admin.videos.index'), { search, sort: sort.value }, {
      preserveState: true,
      replace: true,
      only: ['videos', 'filters']
    });
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFilter();
    }
  };

  // Delete Form
  const deleteForm = useForm();

  const openDelete = (video: Video) => {
    setCurrentVideo(video);
    setIsDeleteOpen(true);
  };

  const handleDeleteSubmit = () => {
    if (!currentVideo) return;
    deleteForm.delete(route("admin.videos.destroy", currentVideo.slug), {
      onSuccess: () => {
        toast.success("Video berhasil dihapus.");
        setIsDeleteOpen(false);
      },
      onError: () => toast.error("Gagal menghapus video."),
    });
  };

  return (
    <>
      <Head title="Manajemen Video" />
      <Toaster position="top-center" />

      <div className="p-4 space-y-6 min-h-screen">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Typography variant="h4" className="font-bold text-slate-800 dark:text-white">
              Daftar Video
            </Typography>
            <Typography className="text-slate-500 dark:text-slate-400">
              Kelola video pembelajaran dan unggah ke server.
            </Typography>
          </div>
          <div className="flex gap-2">
            <Button
              className="flex items-center gap-2 bg-slate-900 dark:bg-white dark:text-slate-900 shadow-none border border-surface dark:border-none"
              size="sm"
              onClick={() => router.get(route("admin.videos.create"))}
            >
              <PlusIcon className="w-4 h-4" />
              Unggah Video
            </Button>
          </div>
        </div>

        {/* Toolbar Section */}
        <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <Card.Body className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full md:w-auto flex-1">
              <div className="w-full sm:w-72">
                <Input
                  placeholder="Cari nama atau tags..."
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
              <div className="w-full sm:w-48">
                <Select
                  value={sort.value}
                  onValueChange={(val) => {
                    const option = SORT_OPTIONS.find(o => o.value === val);
                    if (option) {
                      setSort(option);
                      router.get(route('admin.videos.index'), { search, sort: val }, { preserveState: true, replace: true });
                    }
                  }}
                >
                  <Select.Trigger placeholder="Urutkan" className="dark:text-white">
                    {() => sort.label || "Urutkan"}
                  </Select.Trigger>
                  <Select.List>
                    {SORT_OPTIONS.map((opt) => (
                      <Select.Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Select.Option>
                    ))}
                  </Select.List>
                </Select>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Content Area */}
        {videos.length > 0 ? (
          <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max table-auto text-left">
                <thead>
                  <tr>
                    {["Video", "Deskripsi", "Diupload Pada", "Aksi"].map((head) => (
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
                  {videos.map((video) => (
                    <tr
                      key={video.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          {video.thumbnail ? (
                            <img src={video.thumbnail} alt={video.title} className="h-20 w-32 bg-slate-200 dark:bg-slate-700 rounded object-cover" />
                          ) : (
                            <div className="h-20 w-32 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center text-slate-400">
                              <VideoIcon className="w-6 h-6" />
                            </div>
                          )}
                          <div>
                            <Typography
                              variant="small"
                              className="font-bold text-slate-800 dark:text-white line-clamp-1 max-w-[200px]"
                              title={video.title}
                            >
                              {video.title}
                            </Typography>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Typography
                          variant="small"
                          className="text-slate-600 dark:text-slate-300 line-clamp-2 max-w-[300px]"
                        >
                          {video.description}
                        </Typography>
                        {video.tags && video.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {video.tags.map(tag => (
                              <span key={tag} className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-medium capitalize">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <Typography variant="small" className="text-slate-600 dark:text-slate-300">
                          {new Date(video.created_at).toLocaleDateString("id-ID", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </Typography>
                        {video.uploader && (
                          <Typography variant="small" className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                            Oleh: {video.uploader.name}
                          </Typography>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-center">
                          <Menu placement="bottom-end">
                            <Menu.Trigger
                              as={IconButton}
                              variant="ghost"
                              size="sm"
                              color="secondary"
                              className="rounded-full"
                            >
                              <MoreVerticalIcon className="w-5 h-5" />
                            </Menu.Trigger>
                            <Menu.Content className="z-20 min-w-[160px] dark:bg-slate-900 border-none shadow-xl">
                              <Menu.Item
                                className="flex items-center gap-2 dark:hover:bg-slate-800"
                                onClick={() => window.open(video.video_url, "_blank")}
                              >
                                <PlayCircleIcon className="w-4 h-4" />
                                Lihat Video
                              </Menu.Item>
                              <Menu.Item
                                className="flex items-center gap-2 dark:hover:bg-slate-800"
                                onClick={() => router.get(route("admin.videos.edit", video.slug))}
                              >
                                <EditIcon className="w-4 h-4 " />
                                Edit Video
                              </Menu.Item>
                              <hr className="!my-1 -mx-1 border-slate-100 dark:border-slate-800" />
                              <Menu.Item
                                className="flex items-center gap-2 text-error dark:text-red-400 dark:hover:bg-slate-800"
                                onClick={() => openDelete(video)}
                              >
                                <Trash2Icon className="w-4 h-4" />
                                Hapus
                              </Menu.Item>
                            </Menu.Content>
                          </Menu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-slate-50 border border-dashed border-slate-300 rounded-lg dark:bg-slate-900 dark:border-slate-700">
            <VideoIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
            <Typography className="text-slate-500 dark:text-slate-400">
              Tidak ada video ditemukan.
            </Typography>
          </div>
        )}

        {/* Pagination */}
        <div className="mt-8 flex justify-center gap-2">
          {(paginatedVideos.meta?.links || paginatedVideos.links).map((link: any, key: number) => (
            <Button
              key={key}
              variant={link.active ? "solid" : "ghost"}
              size="sm"
              color={link.active ? "primary" : "secondary"}
              className={`flex items-center gap-2 ${!link.url ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
              dangerouslySetInnerHTML={{ __html: link.label }}
              disabled={!link.url}
            />
          ))}
        </div>
      </div>



      {/* --- Delete Modal --- */}
      <Dialog open={isDeleteOpen} onOpenChange={() => setIsDeleteOpen(false)} size="sm" >
        <Dialog.Overlay>
          <Dialog.Content className="dark:border-slate-800">
            <Typography type="h6" className="dark:text-white">Hapus Video</Typography>
            <Typography className="mb-6 mt-2 text-foreground">
              Apakah Anda yakin ingin menghapus video <strong>{currentVideo?.title}</strong>? Video ini juga akan dihapus dari server penyimpanan secara permanen.
            </Typography>
            <div className="mb-1 flex items-center justify-end gap-2">
              <Button variant="ghost" color="secondary" onClick={() => setIsDeleteOpen(false)} className="mr-2">
                Batal
              </Button>
              <Button color="error" onClick={handleDeleteSubmit} disabled={deleteForm.processing}>
                {deleteForm.processing ? "Menghapus..." : "Ya, Hapus"}
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
