import { ReactNode } from "react";
import { Input, Select, Typography } from "@material-tailwind/react";
import { SearchIcon } from "lucide-react";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  id: string;
  label: string;
  type: "select" | "input";
  options?: FilterOption[];
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

interface SearchFilterToolbarProps {
  searchConfig?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    onSearch?: () => void;
  };
  filters?: FilterConfig[];
  actions?: ReactNode;
  className?: string;
}

export function SearchFilterToolbar({
  searchConfig,
  filters = [],
  actions,
  className = "",
}: SearchFilterToolbarProps) {
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Search Section */}
      {searchConfig && (
        <div className="w-full md:w-72">
          <Typography as="label" htmlFor="search" type="small" color="default" className="font-semibold">
            Cari
          </Typography>
          <Input
            id="search"
            value={searchConfig.value}
            onChange={(e) => searchConfig.onChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchConfig.onSearch?.()}
            placeholder={searchConfig.placeholder || "Cari..."}
            className="!border-t-blue-gray-200 focus:!border-t-gray-900 dark:focus:!border-t-white dark:text-white"
          >
            <Input.Icon>
              <SearchIcon className="h-4 w-4 cursor-pointer" onClick={searchConfig.onSearch} />
            </Input.Icon>
          </Input>
        </div>
      )}

      {/* Filters Section */}
      <div className="flex flex-wrap gap-4">
        {filters.map((filter) => (
          <div key={filter.id} className={`w-full md:w-48 ${filter.className || ""}`}>
            <Typography as="label" htmlFor={filter.id} type="small" color="default" className="font-semibold">
              {filter.label}
            </Typography>
            {filter.type === "select" ? (
              <Select
                id={filter.id}
                value={filter.value}
                onValueChange={filter.onChange}
                placeholder={filter.placeholder}
              >
                <Select.Trigger />
                <Select.List>
                  {filter.options?.map((option) => (
                    <Select.Option key={option.value} value={option.value}>
                      {option.label}
                    </Select.Option>
                  ))}
                </Select.List>
              </Select>
            ) : (
              <Input
                id={filter.id}
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                placeholder={filter.placeholder}
              />
            )}
          </div>
        ))}
      </div>

      {/* Actions Section */}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}