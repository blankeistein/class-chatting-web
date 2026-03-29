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
import { Head, Link, router, useForm } from "@inertiajs/react";
import {
  PlusIcon,
  VideoIcon,
  LayoutGridIcon,
  ListIcon,
  EditIcon,
  Trash2Icon,
  PlayCircleIcon,
  MoreVerticalIcon,
  SearchIcon,
  EyeIcon,
  Server,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

interface Video {
  id: number;
  slug: string;
  title: string;
  description: string;
  video_url: string | null;
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

const formatVideoDate = (date: string) => {
  return new Date(date).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const openVideoDetail = (video: Video) => {
  router.get(route("admin.videos.show", video.slug));
};

const VideoActions = ({
  video,
  onDelete,
}: {
  video: Video;
  onDelete: (video: Video) => void;
}) => {
  return (
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
      <Menu.Content className="z-20 min-w-[180px] border-none shadow-xl dark:bg-slate-900">
        <Menu.Item
          className="flex items-center gap-2 dark:hover:bg-slate-800"
          onClick={() => openVideoDetail(video)}
        >
          <EyeIcon className="w-4 h-4" />
          Lihat Detail
        </Menu.Item>
        <Menu.Item
          className={`flex items-center gap-2 dark:hover:bg-slate-800 ${!video.video_url ? "cursor-not-allowed opacity-60" : ""}`}
          onClick={() => video.video_url && window.open(video.video_url, "_blank")}
        >
          <PlayCircleIcon className="w-4 h-4" />
          {video.video_url ? "Buka File Video" : "Menunggu HLS"}
        </Menu.Item>
        <Menu.Item
          className="flex items-center gap-2 dark:hover:bg-slate-800"
          onClick={() => router.get(route("admin.videos.edit", video.slug))}
        >
          <EditIcon className="w-4 h-4" />
          Edit Video
        </Menu.Item>
        <hr className="-mx-1 !my-1 border-slate-100 dark:border-slate-800" />
        <Menu.Item
          className="flex items-center gap-2 text-error dark:text-red-400 dark:hover:bg-slate-800"
          onClick={() => onDelete(video)}
        >
          <Trash2Icon className="w-4 h-4" />
          Hapus
        </Menu.Item>
      </Menu.Content>
    </Menu>
  );
};

const VideoGridCard = ({
  video,
  onDelete,
}: {
  video: Video;
  onDelete: (video: Video) => void;
}) => {
  return (
    <Card className="relative overflow-hidden border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <button
        type="button"
        onClick={() => openVideoDetail(video)}
        className="group block w-full text-left"
      >
        <div className="relative h-[180px] w-full aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800">
          {video.thumbnail ? (
            <img
              src={video.thumbnail}
              alt={video.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-400 dark:text-slate-500">
              <VideoIcon className="h-10 w-10" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-900 opacity-0 shadow-sm transition-opacity duration-300 group-hover:opacity-100">
            <EyeIcon className="h-3.5 w-3.5" />
            Lihat Detail
          </div>
        </div>
      </button>

      <div className="absolute right-3 top-3 z-10">
        <VideoActions video={video} onDelete={onDelete} />
      </div>

      <Card.Body className="flex h-full flex-col gap-4 p-4">
        <button
          type="button"
          onClick={() => openVideoDetail(video)}
          className="space-y-2 text-left"
        >
          <Typography
            variant="h6"
            className="line-clamp-2 text-sm font-bold text-slate-800 transition-colors hover:text-primary dark:text-white"
            title={video.title}
          >
            {video.title}
          </Typography>
          <Typography className="line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
            {video.description}
          </Typography>
        </button>

        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {video.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium capitalize text-primary"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
          <div>
            <Typography className="text-xs text-slate-500 dark:text-slate-400">
              {formatVideoDate(video.created_at)}
            </Typography>
            {video.uploader && (
              <Typography className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Oleh: {video.uploader.name}
              </Typography>
            )}
          </div>
          <Button
            size="sm"
            color="secondary"
            className="flex items-center gap-2"
            onClick={() => openVideoDetail(video)}
          >
            <PlayCircleIcon className="h-4 w-4" />
            {video.video_url ? "Putar" : "Detail"}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default function Index({
  videos: paginatedVideos,
  filters,
}: {
  videos: any;
  filters?: { search?: string; sort?: string };
}) {
  const [videos, setVideos] = useState<Video[]>(paginatedVideos.data);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [search, setSearch] = useState(filters?.search || "");
  const [sort, setSort] = useState(
    SORT_OPTIONS.find((option) => option.value === (filters?.sort || "latest")) ||
    SORT_OPTIONS[0],
  );

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);

  React.useEffect(() => {
    setVideos(paginatedVideos.data);
  }, [paginatedVideos.data]);

  const handleFilter = () => {
    router.get(
      route("admin.videos.index"),
      { search, sort: sort.value },
      {
        preserveState: true,
        replace: true,
        only: ["videos", "filters"],
      },
    );
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleFilter();
    }
  };

  const deleteForm = useForm();

  const openDelete = (video: Video) => {
    setCurrentVideo(video);
    setIsDeleteOpen(true);
  };

  const handleDeleteSubmit = () => {
    if (!currentVideo) {
      return;
    }

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

      <div className="min-h-screen space-y-6 p-4">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <Typography variant="h4" className="font-bold text-slate-800 dark:text-white">
              Daftar Video
            </Typography>
            <Typography className="text-slate-500 dark:text-slate-400">
              Kelola video pembelajaran dan unggah ke server.
            </Typography>
          </div>
          <div className="flex gap-2">
            <Button as={Link} href={route("admin.videos.jobs")} className="flex items-center gap-2 ">
              <Server className="h-4 w-4" />
              Tugas
            </Button>
            <Button
              className="flex items-center gap-2"
              size="sm"
              onClick={() => router.get(route("admin.videos.create"))}
            >
              <PlusIcon className="h-4 w-4" />
              Unggah Video
            </Button>
          </div>
        </div>

        <Card className="border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Card.Body className="flex flex-col items-center justify-between gap-4 p-4 md:flex-row">
            <div className="flex w-full flex-1 flex-col items-stretch gap-3 sm:flex-row md:w-auto">
              <div className="w-full sm:w-72">
                <Input
                  placeholder="Cari nama atau tags..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleSearchKeyPress}
                  className="pr-10 dark:text-white"
                >
                  <Input.Icon>
                    <SearchIcon className="h-4 w-4 cursor-pointer" onClick={handleFilter} />
                  </Input.Icon>
                </Input>
              </div>
              <div className="w-full sm:w-48">
                <Select
                  value={sort.value}
                  onValueChange={(value) => {
                    const option = SORT_OPTIONS.find((item) => item.value === value);
                    if (option) {
                      setSort(option);
                      router.get(
                        route("admin.videos.index"),
                        { search, sort: value },
                        { preserveState: true, replace: true },
                      );
                    }
                  }}
                >
                  <Select.Trigger placeholder="Urutkan" className="dark:text-white">
                    {() => sort.label || "Urutkan"}
                  </Select.Trigger>
                  <Select.List>
                    {SORT_OPTIONS.map((option) => (
                      <Select.Option key={option.value} value={option.value}>
                        {option.label}
                      </Select.Option>
                    ))}
                  </Select.List>
                </Select>
              </div>
            </div>

            <div className="flex self-end border-l border-slate-200 pl-4 dark:border-slate-700 md:self-auto">
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
          </Card.Body>
        </Card>

        {videos.length > 0 ? (
          viewMode === "list" ? (
            <Card className="overflow-hidden border border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="min-w-max w-full table-auto text-left">
                  <thead>
                    <tr>
                      {["Video", "Deskripsi", "Diupload Pada", "Aksi"].map((head) => (
                        <th
                          key={head}
                          className="border-y border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/50"
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
                        className="border-b border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                      >
                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => openVideoDetail(video)}
                            className="flex items-center gap-4 text-left"
                          >
                            {video.thumbnail ? (
                              <img
                                src={video.thumbnail}
                                alt={video.title}
                                className="h-20 w-32 rounded bg-slate-200 object-cover dark:bg-slate-700"
                              />
                            ) : (
                              <div className="flex h-20 w-32 items-center justify-center rounded bg-slate-200 text-slate-400 dark:bg-slate-700">
                                <VideoIcon className="h-6 w-6" />
                              </div>
                            )}
                            <div>
                              <Typography
                                variant="small"
                                className="max-w-[240px] line-clamp-1 font-bold text-slate-800 transition-colors hover:text-primary dark:text-white"
                                title={video.title}
                              >
                                {video.title}
                              </Typography>
                              <Typography className="mt-1 flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                                <EyeIcon className="h-3.5 w-3.5" />
                                Klik untuk lihat detail
                              </Typography>
                            </div>
                          </button>
                        </td>
                        <td className="p-4">
                          <Typography
                            variant="small"
                            className="max-w-[300px] line-clamp-2 text-slate-600 dark:text-slate-300"
                          >
                            {video.description}
                          </Typography>
                          {video.tags && video.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {video.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium capitalize text-primary"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <Typography variant="small" className="text-slate-600 dark:text-slate-300">
                            {formatVideoDate(video.created_at)}
                          </Typography>
                          {video.uploader && (
                            <Typography variant="small" className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                              Oleh: {video.uploader.name}
                            </Typography>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center gap-2">
                            <VideoActions video={video} onDelete={openDelete} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {videos.map((video) => (
                <VideoGridCard key={video.id} video={video} onDelete={openDelete} />
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-12 dark:border-slate-700 dark:bg-slate-900">
            <VideoIcon className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
            <Typography className="text-slate-500 dark:text-slate-400">
              Tidak ada video ditemukan.
            </Typography>
          </div>
        )}

        <div className="mt-8 flex justify-center gap-2">
          {(paginatedVideos.meta?.links || paginatedVideos.links).map((link: any, key: number) => (
            <Button
              key={key}
              variant={link.active ? "solid" : "ghost"}
              size="sm"
              color={link.active ? "primary" : "secondary"}
              className={`flex items-center gap-2 ${!link.url ? "cursor-not-allowed opacity-50" : ""}`}
              onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
              dangerouslySetInnerHTML={{ __html: link.label }}
              disabled={!link.url}
            />
          ))}
        </div>
      </div>

      <Dialog open={isDeleteOpen} onOpenChange={() => setIsDeleteOpen(false)} size="sm">
        <Dialog.Overlay>
          <Dialog.Content className="dark:border-slate-800">
            <Typography type="h6" className="dark:text-white">
              Hapus Video
            </Typography>
            <Typography className="mb-6 mt-2 text-foreground">
              Apakah Anda yakin ingin menghapus video <strong>{currentVideo?.title}</strong>? Video ini juga akan dihapus dari server penyimpanan secara permanen.
            </Typography>
            <div className="mb-1 flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                color="secondary"
                onClick={() => setIsDeleteOpen(false)}
                className="mr-2"
              >
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
