import { useDashboardStore } from "@/Stores/LearnReading/dashboard";
import { IconButton, List, Typography } from "@material-tailwind/react";
import { CheckIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { KeyboardEvent, memo, useCallback, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";

interface PageItemProps {
    id: string;
    index: number;
    name: string;
    selected: boolean;
}

const PageItem = memo(({ id, index, name, selected }: PageItemProps) => {
    const { setActivePage, deletePage, updatePage } = useDashboardStore(
        useShallow((state) => ({
            setActivePage: state.setActivePage,
            deletePage: state.deletePage,
            updatePage: state.updatePage,
        }))
    );
    const inputRef = useRef<HTMLInputElement>(null);
    const [edit, setEdit] = useState<string | null>(null);

    const handleDelete = useCallback(
        (event: React.MouseEvent) => {
            event.stopPropagation();
            deletePage(id);
        },
        [id, deletePage]
    );

    const handleEditMode = useCallback(
        (event: React.MouseEvent) => {
            event.stopPropagation();
            setEdit(name);
            setTimeout(() => {
                inputRef?.current?.focus();
            }, 100);
        },
        [name]
    );

    const handleChangeName = useCallback(
        (event?: React.MouseEvent) => {
            event?.stopPropagation();
            if (edit !== null) {
                updatePage(id, { name: edit.trim() });
            }
            setEdit(null);
        },
        [edit, id, updatePage]
    );

    const handleKeyDown = useCallback(
        (event: KeyboardEvent<HTMLInputElement>) => {
            if (event.code === "Enter") {
                handleChangeName();
            }
        },
        [handleChangeName]
    );

    return (
        <List.Item
            className="group cursor-pointer"
            onClick={() => setActivePage(index)}
            selected={selected}
            ripple={false}
        >
            {edit !== null ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={edit}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(event) => setEdit(event.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full outline-none bg-transparent"
                />
            ) : (
                <Typography as="span" className="font-medium text-sm">
                    {name}
                </Typography>
            )}
            <List.ItemEnd>
                <div className="flex gap-0.5">
                    {edit !== null ? (
                        <IconButton
                            className="invisible group-hover:visible"
                            size="sm"
                            variant="ghost"
                            onClick={handleChangeName}
                        >
                            <CheckIcon className="size-4 text-green-500" />
                        </IconButton>
                    ) : (
                        <IconButton
                            className="invisible group-hover:visible"
                            size="sm"
                            variant="ghost"
                            onClick={handleEditMode}
                        >
                            <PencilIcon className="size-4" />
                        </IconButton>
                    )}
                    <IconButton
                        className="invisible group-hover:visible"
                        size="sm"
                        variant="ghost"
                        onClick={handleDelete}
                    >
                        <Trash2Icon className="size-4 text-red-500" />
                    </IconButton>
                </div>
            </List.ItemEnd>
        </List.Item>
    );
});

export default PageItem;
