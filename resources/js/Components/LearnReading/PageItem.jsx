import { useDashboardStore } from "@/Stores/LearnReading/dashboard";
import { IconButton, List } from "@material-tailwind/react";
import { CheckIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { memo, useCallback, useRef, useState } from "react";

import { shallow } from "zustand/shallow";

const PageItem = memo(({ id, index, name, selected }) => {
    const { setActivePage, deletePage, updatePage } = useDashboardStore(
        (state) => ({
            setActivePage: state.setActivePage,
            deletePage: state.deletePage,
            updatePage: state.updatePage,
        }),
        shallow
    );
    const inputRef = useRef();
    const [edit, setEdit] = useState(null);

    const handleDelete = useCallback(
        (event) => {
            event.stopPropagation();
            deletePage(id);
        },
        [id]
    );

    const handleEditMode = useCallback(
        (event) => {
            event.stopPropagation();
            setEdit(name);
            setTimeout(() => {
                inputRef?.current.focus();
            }, 100);
        },
        [id, name, inputRef]
    );

    const handleChangeName = useCallback(
        (event) => {
            event?.stopPropagation();
            updatePage(id, { name: edit.trim() });
            setEdit(null);
        },
        [edit]
    );

    const handleKeyDown = useCallback(
        (event) => {
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
        >
            {edit ? (
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
                name
            )}
            <List.ItemEnd>
                <div className="flex gap-0.5">
                    {edit ? (
                        <IconButton
                            className="invisible group-hover:visible"
                            size="xs"
                            variant="ghost"
                            onClick={handleChangeName}
                        >
                            <CheckIcon className="size-4 text-success" />
                        </IconButton>
                    ) : (
                        <IconButton
                            className="invisible group-hover:visible"
                            size="xs"
                            variant="ghost"
                            onClick={handleEditMode}
                        >
                            <PencilIcon className="size-4" />
                        </IconButton>
                    )}
                    <IconButton
                        className="invisible group-hover:visible"
                        size="xs"
                        variant="ghost"
                        onClick={handleDelete}
                    >
                        <Trash2Icon className="size-4 text-error" />
                    </IconButton>
                </div>
            </List.ItemEnd>
        </List.Item>
    );
});

export default PageItem;
