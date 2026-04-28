import { IconButton } from "@material-tailwind/react";
import { LayoutGridIcon, ListIcon } from "lucide-react";

export type ViewMode = "grid" | "table" | "list";

interface ViewModeToggleProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  modes?: ViewMode[];
  className?: string;
}

export function ViewModeToggle({
  currentMode,
  onModeChange,
  modes = ["grid", "table"],
  className = "",
}: ViewModeToggleProps) {
  return (
    <div className={`flex items-center gap-1 border-l border-secondary pl-2 ml-auto ${className}`}>
      {modes.includes("grid") && (
        <IconButton
          variant={currentMode === "grid" ? "solid" : "ghost"}
          onClick={() => onModeChange("grid")}
          title="Mode grid"
        >
          <LayoutGridIcon className="h-4 w-4" />
        </IconButton>
      )}
      {modes.includes("table") && (
        <IconButton
          variant={currentMode === "table" ? "solid" : "ghost"}
          onClick={() => onModeChange("table")}
          title="Mode tabel"
        >
          <ListIcon className="h-4 w-4" />
        </IconButton>
      )}
      {modes.includes("list") && (
        <IconButton
          variant={currentMode === "list" ? "solid" : "ghost"}
          onClick={() => onModeChange("list")}
          title="Mode list"
        >
          <ListIcon className="h-4 w-4" />
        </IconButton>
      )}
    </div>
  );
}