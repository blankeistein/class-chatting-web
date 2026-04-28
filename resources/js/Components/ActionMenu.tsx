import { ReactNode } from "react";
import { Menu, IconButton, Typography } from "@material-tailwind/react";
import { MoreVertical } from "lucide-react";

export interface ActionItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

interface ActionMenuProps {
  items: ActionItem[];
  triggerClassName?: string;
  menuClassName?: string;
}

export function ActionMenu({ items, triggerClassName = "", menuClassName = "" }: ActionMenuProps) {
  return (
    <Menu placement="bottom-end">
      <Menu.Trigger
        as={IconButton}
        variant="ghost"
        size="sm"
        color="secondary"
        className={`rounded-full ${triggerClassName}`}
      >
        <MoreVertical className="w-5 h-5" />
      </Menu.Trigger>
      <Menu.Content className={`z-20 min-w-[160px] dark:bg-slate-900 border-none shadow-xl ${menuClassName}`}>
        {items.map((item, index) => (
          <div key={index}>
            <Menu.Item
              className={`flex items-center gap-2 dark:hover:bg-slate-800 ${item.danger ? "text-error dark:text-red-400" : ""}`}
              onClick={item.onClick}
              disabled={item.disabled}
            >
              {item.icon}
              <Typography variant="small">{item.label}</Typography>
            </Menu.Item>
            {item.divider && <hr className="!my-1 -mx-1 border-slate-100 dark:border-slate-800" />}
          </div>
        ))}
      </Menu.Content>
    </Menu>
  );
}