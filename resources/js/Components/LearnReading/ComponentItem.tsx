import { useDashboardStore } from "@/Stores/LearnReading/dashboard";
import { Collapse, Menu, Typography } from "@material-tailwind/react";
import clsx from "clsx";
import {
    CaseUpperIcon,
    ChevronRightIcon,
    ColumnsIcon,
    DotIcon,
    ImageIcon,
    PlusIcon,
    RowsIcon,
    Trash2Icon,
} from "lucide-react";
import { useCallback, useState } from "react";
import { shallow } from "zustand/shallow";

const ComponentIcons = {
    Column: <ColumnsIcon className="size-4 mr-1" />,
    Row: <RowsIcon className="size-4 mr-1" />,
    Text: <CaseUpperIcon className="size-4 mr-1" />,
    Image: <ImageIcon className="size-4 mr-1" />,
};

export default function ComponentItem({ component }) {
    const {
        setActiveComponent,
        addComponentChild,
        deleteComponent,
        activeComponentId,
    } = useDashboardStore(
        (state) => ({
            setActiveComponent: state.setActiveComponent,
            addComponentChild: state.addComponentChild,
            deleteComponent: state.deleteComponent,
            activeComponentId: state.activeComponentKey, // Select the key directly!
        }),
        shallow
    );

    const [collapse, setCollapse] = useState(false);

    const handleAdd = useCallback(
        (type) => {
            addComponentChild(component.id, type);
        },
        [component.id, addComponentChild]
    );

    const handleClick = (e) => {
        e.stopPropagation();
        setActiveComponent(component.id);
    };

    // Fungsi untuk menangani penghapusan
    const handleDelete = (e) => {
        e.stopPropagation(); // Hentikan event agar tidak memilih komponen
        deleteComponent(component.id);
    };

    const Icon = ComponentIcons[component.type] || (
        <DotIcon className="size-4 mr-1" />
    );

    return (
        <div className="">
            <div
                className={clsx(
                    "group flex items-center p-1 cursor-pointer hover:bg-slate-100 rounded",
                    activeComponentId === component.id &&
                        "bg-blue-200 hover:bg-blue-300"
                )}
                onClick={handleClick}
            >
                {component.childrens && component.childrens.length > 0 && (
                    <button
                        className="p-0.5 bg-slate-200 rounded mr-1 "
                        onClick={(e) => {
                            e.stopPropagation();
                            setCollapse((prev) => !prev);
                        }}
                    >
                        <ChevronRightIcon
                            className={clsx("size-3", collapse && "rotate-90")}
                        />
                    </button>
                )}
                <Typography
                    as="p"
                    className="!text-sm mr-auto flex items-center select-none"
                >
                    {Icon}
                    {component.type}
                </Typography>

                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        className="p-1 hover:bg-red-200 rounded"
                        onClick={handleDelete}
                    >
                        <Trash2Icon className="size-4 text-red-500" />
                    </button>

                    {["Column", "Row"].includes(component.type) && (
                        <Menu placement="bottom-end">
                            <Menu.Trigger
                                as="div"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button className="p-1 hover:bg-slate-200 rounded">
                                    <PlusIcon className="size-4" />
                                </button>
                            </Menu.Trigger>
                            <Menu.Content onClick={(e) => e.stopPropagation()}>
                                <Menu.Item onClick={() => handleAdd("Column")}>
                                    <ColumnsIcon className="size-4 mr-1" />
                                    Kolom
                                </Menu.Item>
                                <Menu.Item onClick={() => handleAdd("Row")}>
                                    <RowsIcon className="size-4 mr-1" />
                                    Baris
                                </Menu.Item>
                                <Menu.Item onClick={() => handleAdd("Text")}>
                                    <CaseUpperIcon className="size-4 mr-1" />
                                    Teks
                                </Menu.Item>
                                <Menu.Item onClick={() => handleAdd("Image")}>
                                    <ImageIcon className="size-4 mr-1" />
                                    Gambar
                                </Menu.Item>
                            </Menu.Content>
                        </Menu>
                    )}
                </div>
            </div>
            <Collapse open={collapse}>
                <div className="pl-4 border-l ml-2">
                    {Array.isArray(component.childrens) &&
                        component.childrens.map((comp) => (
                            <ComponentItem key={comp.id} component={comp} />
                        ))}
                </div>
            </Collapse>
        </div>
    );
}