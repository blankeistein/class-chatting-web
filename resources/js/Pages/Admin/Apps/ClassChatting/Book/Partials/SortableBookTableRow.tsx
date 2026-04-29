import { useSortable } from "@dnd-kit/sortable";
import { Book } from "../Index";
import { CSS } from "@dnd-kit/utilities";
import { BookIcon, Copy, EyeIcon, GripVerticalIcon, LoaderCircleIcon, LockIcon, MoreVertical, PencilIcon, Trash2Icon, UnlockIcon } from "lucide-react";
import { Chip, IconButton, Menu, Typography } from "@material-tailwind/react";

type SortableBookTableRowProps = {
  book: Book;
  books: Book[];
  isOrderMode: boolean;
  hasActiveSearch: boolean;
  isDeleting: boolean;
  activeDeleteKey: string | null;
  onView: (book: Book) => void;
  onEdit: (book: Book) => void;
  onCopyLink: (url: string) => void;
  onDelete: (book: Book) => void;
};


export default function SortableBookTableRow({
  book,
  books,
  isOrderMode,
  hasActiveSearch,
  isDeleting,
  onView,
  onEdit,
  onCopyLink,
  onDelete,
}: SortableBookTableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: book.originalKey,
    disabled: !isOrderMode || hasActiveSearch,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`align-top ${isDragging ? "relative z-10 opacity-70" : ""}`}
    >
      <td className="px-4 py-4">
        {isOrderMode && !hasActiveSearch ? (
          <button
            type="button"
            className="inline-flex cursor-grab items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600 active:cursor-grabbing dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            {...attributes}
            {...listeners}
          >
            <GripVerticalIcon className="h-4 w-4" />
            <span className="font-semibold">#{book.order}</span>
          </button>
        ) : (
          <span className="font-semibold text-slate-700 dark:text-slate-200">#{book.order}</span>
        )}
      </td>
      <td className="px-4 py-4">
        <div className="flex min-w-[20rem] items-center gap-3">
          <div className="h-20 w-12 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950">
            {book.cover ? (
              <img
                src={book.cover}
                alt={book.name}
                className="h-full w-full object-cover"
                onError={(event) => {
                  (event.target as HTMLImageElement).src = "https://placehold.co/120x180?text=No+Cover";
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">
                <BookIcon className="h-5 w-5" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <Typography className="line-clamp-2 font-semibold text-slate-800 dark:text-white">
              {book.name}
            </Typography>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">{book.keyword || "-"}</td>
      <td className="px-4 py-4">
        <Chip size="sm" variant="ghost" color={book.status === "publish" ? "success" : "warning"}>
          <Chip.Label>{book.status}</Chip.Label>
        </Chip>
      </td>
      <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">{book.version}</td>
      <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">{book.lock ? <LockIcon className="w-4 h-4" /> : <UnlockIcon className="w-4 h-4" />}</td>
      <td className="px-4 py-4">
        <Menu placement="bottom-end">
          <Menu.Trigger as={IconButton} variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
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
            <Menu.Item onClick={() => onCopyLink(book.url)}>
              <Copy className="h-4 w-4 mr-2" />
              Salin Link
            </Menu.Item>
            <Menu.Item
              className="text-error"
              onClick={() => onDelete(book)}
              disabled={isDeleting}
            >
              {isDeleting ? <LoaderCircleIcon className="h-4 w-4 animate-spin mr-2" /> : <Trash2Icon className="h-4 w-4 mr-2" />}
              Hapus
            </Menu.Item>
          </Menu.Content>
        </Menu>
      </td>
    </tr>
  );
}
