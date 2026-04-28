import { ReactNode } from "react";
import { Card } from "@material-tailwind/react";

interface LoadingStateProps {
  count?: number;
  className?: string;
  gridClassName?: string;
}

export function LoadingState({
  count = 6,
  className = "",
  gridClassName = "grid grid-cols-1 gap-4 xl:grid-cols-2",
}: LoadingStateProps) {
  return (
    <div className={gridClassName}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`h-32 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900 ${className}`}
        />
      ))}
    </div>
  );
}