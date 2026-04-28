import { ReactNode } from "react";
import { Typography } from "@material-tailwind/react";

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title = "Tidak ada data ditemukan",
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 bg-slate-50 border border-dashed border-slate-300 rounded-lg dark:bg-slate-900 dark:border-slate-700 ${className}`}>
      {icon && <div className="mb-4">{icon}</div>}
      <Typography className="text-slate-500 dark:text-slate-400 font-medium">
        {title}
      </Typography>
      {description && (
        <Typography className="mt-2 text-sm text-slate-400 dark:text-slate-500">
          {description}
        </Typography>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}