import { ReactNode } from "react";

interface CardGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  itemKey: (item: T) => string | number;
  className?: string;
  gridClassName?: string;
}

export function CardGrid<T>({
  items,
  renderItem,
  emptyMessage = "Tidak ada data ditemukan",
  emptyIcon,
  itemKey,
  className = "",
  gridClassName = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6",
}: CardGridProps<T>) {
  if (items.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-12 bg-slate-50 border border-dashed border-slate-300 rounded-lg dark:bg-slate-900 dark:border-slate-700 ${className}`}>
        {emptyIcon && <div className="mb-4">{emptyIcon}</div>}
        <div className="text-slate-500 dark:text-slate-400">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className={gridClassName}>
      {items.map((item, index) => (
        <div key={itemKey(item)}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}