import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, Chip, IconButton, Menu, Typography } from "@material-tailwind/react";
import { ArrowDownIcon, ArrowUpIcon, Copy, EyeIcon, GripVerticalIcon, LoaderCircleIcon, LockIcon, MoreVertical, PencilIcon, Trash2Icon, UnlockIcon } from "lucide-react";
import { memo, useMemo } from "react";
import { Book } from "../Index";

type GridBookCardProps = {
  book: Book;
  isOrderMode: boolean;
  hasActiveSearch: boolean;
  originalIndex: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isDeleting: boolean;
  isSortable?: boolean;
  onView: (book: Book) => void;
  onToggleLock: (book: Book, nextLock: boolean) => void;
  onEdit: (book: Book) => void;
  onCopyLink: (url: string) => void;
  onDelete: (book: Book) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
};

export const GridBookCard = memo(function GridBookCard({
  book,
  isOrderMode,
  hasActiveSearch,
  originalIndex,
  canMoveUp,
  canMoveDown,
  isDeleting,
  isSortable = false,
  onView,
  onToggleLock,
  onEdit,
  onCopyLink,
  onDelete,
  onMoveUp,
  onMoveDown,
}: GridBookCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: book.originalKey,
    disabled: !isSortable,
  });

  const keywords = useMemo(() => {
    return (book.keyword || [])
      .filter((keyword) => keyword);
  }, [book.keyword]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${isDragging ? "z-10 opacity-70" : ""}`}
    >
      <Card.Header className="relative overflow-hidden p-0">
        <div className="group relative h-[320px] w-full shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950">
          <img
            src={book.cover || "/assets/images/book-thumbnail.webp"}
            alt={book.name}
            className="h-full w-full object-cover"
            onError={(event) => {
              (event.target as HTMLImageElement).src = "/assets/images/book-thumbnail.webp";
            }}
          />
          {/* Melihat Info Buku */}
          <button
            type="button"
            className="absolute left-0 top-0 z-10 flex h-full w-full items-center justify-center rounded-lg bg-[rgba(0,0,0,.5)] scale-0 cursor-pointer transition-transform duration-500 group-hover:scale-100"
            onClick={() => onView(book)}
          >
            <EyeIcon className="h-6 w-6 text-white" />
          </button>
        </div>
        <div className="p-2 !absolute top-2 left-0 flex w-full items-center justify-between z-20">
          <div className="flex items-center gap-2">
            {isOrderMode && !hasActiveSearch ? (
              <button
                type="button"
                className="inline-flex cursor-grab items-center gap-1 rounded-full bg-amber-500 px-2 py-1 text-xs font-semibold text-white active:cursor-grabbing"
                {...attributes}
                {...listeners}
              >
                <GripVerticalIcon className="h-3.5 w-3.5" />
                <span>#{book.order}</span>
              </button>
            ) : (
              <IconButton size="sm" onClick={() => onToggleLock(book, !book.lock)} title={book.lock ? "Buka kunci buku" : "Kunci buku"} color={book.lock ? "error" : "success"}>
                {book.lock ? <LockIcon className="h-4 w-4" /> : <UnlockIcon className="h-4 w-4" />}
              </IconButton>
            )}
          </div>
          <Menu placement="bottom-end">
            <Menu.Trigger as={IconButton} className="rounded-full" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Menu.Trigger>
            <Menu.Content>
              <Menu.Item onClick={() => onView(book)}>
                <EyeIcon className="h-4 w-4 mr-2" />
                Lihat
              </Menu.Item>
              <Menu.Item onClick={() => onEdit(book)}>
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </Menu.Item>
              <Menu.Item onClick={() => onCopyLink(book.downloadLink)}>
                <Copy className="h-4 w-4 mr-2" />
                Salin Link
              </Menu.Item>
              <Menu.Item className="text-error" onClick={() => onDelete(book)} disabled={isDeleting}>
                {isDeleting ? <LoaderCircleIcon className="h-4 w-4 animate-spin mr-2" /> : <Trash2Icon className="h-4 w-4 mr-2" />}
                Hapus
              </Menu.Item>
            </Menu.Content>
          </Menu>
        </div>
      </Card.Header>
      <Card.Body>
        <div className="grid grid-rows-[auto_max-content] gap-4">
          <div className="flex w-full flex-col items-start justify-between gap-2">
            <div className="flex gap-2">
              <Chip size="sm" variant="ghost" color={book.status === "publish" ? "success" : "warning"}>
                <Chip.Label>{book.status}</Chip.Label>
              </Chip>
            </div>
            <div className="min-w-0">
              <Typography className="line-clamp-2 font-semibold text-slate-800 dark:text-white">
                {book.name}
              </Typography>
            </div>
            <div className="w-full">
              <Typography as="p" className="mb-1 text-sm">
                Keyword:
              </Typography>
              <div className="flex items-center gap-1">
                {keywords.map((keyword) => (
                  <Chip key={keyword} size="sm" variant="outline">
                    <Chip.Label>{keyword}</Chip.Label>
                  </Chip>
                ))}
              </div>
            </div>
          </div>
          {isOrderMode && !hasActiveSearch && !isSortable && (
            <div className="mt-auto flex items-center gap-2">
              <IconButton variant="ghost" size="sm" onClick={() => onMoveUp(originalIndex)} disabled={!canMoveUp}>
                <ArrowUpIcon className="h-4 w-4" />
              </IconButton>
              <IconButton variant="ghost" size="sm" onClick={() => onMoveDown(originalIndex)} disabled={!canMoveDown}>
                <ArrowDownIcon className="h-4 w-4" />
              </IconButton>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}, (previousProps, nextProps) => {
  return (
    previousProps.book === nextProps.book &&
    previousProps.isOrderMode === nextProps.isOrderMode &&
    previousProps.hasActiveSearch === nextProps.hasActiveSearch &&
    previousProps.originalIndex === nextProps.originalIndex &&
    previousProps.canMoveUp === nextProps.canMoveUp &&
    previousProps.canMoveDown === nextProps.canMoveDown &&
    previousProps.isDeleting === nextProps.isDeleting &&
    previousProps.isSortable === nextProps.isSortable
  );
});
