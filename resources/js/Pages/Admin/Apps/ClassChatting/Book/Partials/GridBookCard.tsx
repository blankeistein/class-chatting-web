import { Card, Chip, IconButton, Menu, Typography } from "@material-tailwind/react";
import { ArrowDownIcon, ArrowUpIcon, Copy, LoaderCircleIcon, LockIcon, MoreVertical, PencilIcon, Trash2Icon, UnlockIcon } from "lucide-react";
import { memo, useMemo } from "react";
import { FirebaseBookForm } from "./EditBookDialog";

type FirebaseBook = FirebaseBookForm;

type GridBookCardProps = {
  book: FirebaseBook;
  isOrderMode: boolean;
  hasActiveSearch: boolean;
  originalIndex: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isDeleting: boolean;
  onToggleLock: (book: FirebaseBook, nextLock: boolean) => void;
  onEdit: (book: FirebaseBook) => void;
  onCopyLink: (url: string) => void;
  onDelete: (book: FirebaseBook) => void;
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
  onToggleLock,
  onEdit,
  onCopyLink,
  onDelete,
  onMoveUp,
  onMoveDown,
}: GridBookCardProps) {
  const keywords = useMemo(() => {
    return (book.keyword || "")
      .split(",")
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword);
  }, [book.keyword]);

  return (
    <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <Card.Header className="relative overflow-hidden p-0">
        <div className="h-[320px] w-full shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950">
          <img
            src={book.coverBook || "/assets/images/book-thumbnail.webp"}
            alt={book.nameBook}
            className="h-full w-full object-cover"
            onError={(event) => {
              (event.target as HTMLImageElement).src = "/assets/images/book-thumbnail.webp";
            }}
          />
        </div>
        <div className="p-2 !absolute top-2 left-0 flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            {isOrderMode && !hasActiveSearch ? (
              <Chip size="sm" color="warning">
                <Chip.Label>#{book.orderBook}</Chip.Label>
              </Chip>
            ) : (
              <IconButton size="sm" onClick={() => onToggleLock(book, !book.lock)} title={book.lock ? "Buka kunci buku" : "Kunci buku"}>
                {book.lock ? <LockIcon className="h-4 w-4" /> : <UnlockIcon className="h-4 w-4" />}
              </IconButton>
            )}
          </div>
          <Menu placement="bottom-end">
            <Menu.Trigger as={IconButton} className="rounded-full" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Menu.Trigger>
            <Menu.Content>
              <Menu.Item onClick={() => onEdit(book)}>
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </Menu.Item>
              <Menu.Item onClick={() => onCopyLink(book.urlBook)}>
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
                {book.nameBook}
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
          {isOrderMode && !hasActiveSearch && (
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
    previousProps.isDeleting === nextProps.isDeleting
  );
});
