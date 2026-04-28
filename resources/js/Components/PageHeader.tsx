import { ReactNode } from "react";
import { Typography, Button } from "@material-tailwind/react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className = "" }: PageHeaderProps) {
  return (
    <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${className}`}>
      <div>
        <Typography variant="h4" className="font-bold text-slate-800 dark:text-white">
          {title}
        </Typography>
        {description && (
          <Typography className="text-slate-500 dark:text-slate-400">
            {description}
          </Typography>
        )}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}