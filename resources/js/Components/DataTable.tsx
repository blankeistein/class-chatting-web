import { ReactNode } from "react";
import { Typography } from "@material-tailwind/react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  rowKey: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  emptyMessage = "Tidak ada data ditemukan.",
  emptyIcon,
  rowKey,
  onRowClick,
  className = "",
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-50 border border-dashed border-slate-300 rounded-lg dark:bg-slate-900 dark:border-slate-700">
        {emptyIcon}
        <Typography className="text-slate-500 dark:text-slate-400">
          {emptyMessage}
        </Typography>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full min-w-max table-auto text-left">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`border-y border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-4 ${column.headerClassName || ""}`}
              >
                <Typography
                  variant="small"
                  className="font-bold leading-none opacity-70 text-slate-500 dark:text-slate-300"
                >
                  {column.header}
                </Typography>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={rowKey(item)}
              className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 cursor-pointer"
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`p-4 ${column.className || ""}`}
                >
                  {column.render ? column.render(item, index) : (
                    <Typography variant="small" className="text-slate-700 dark:text-slate-300">
                      {String((item as any)[column.key])}
                    </Typography>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}