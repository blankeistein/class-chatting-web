import { useDashboardStore } from "@/Stores/LearnReading/dashboard";
import { Button, Menu } from "@material-tailwind/react";
import { ColumnsIcon, PlusIcon, RowsIcon } from "lucide-react";
import { useCallback } from "react";
import ComponentItem from "./ComponentItem";

export default function ComponentsContainer({ components }) {
    const initComponentChild = useDashboardStore((state) => state.initComponentChild);

    const handleInit = useCallback((type) => {
        initComponentChild(type);
    }, []);

    const handleContextMenu = (ref, component) => {
        console.log(component);
    };

    return (
        <>
            {Object.keys(components).length === 0 && (
                <Menu placement="bottom-end">
                    <Menu.Trigger className="w-full">
                        <Button
                            as="p"
                            isFullWidth
                            size="sm"
                            variant="outline"
                            className="items-center"
                        >
                            <PlusIcon className="size-4 mr-1" />
                            Tambah
                        </Button>
                    </Menu.Trigger>
                    <Menu.Content>
                        <Menu.Item onClick={() => handleInit("Column")}>
                            <ColumnsIcon className="size-5 mr-2" />
                            Kolom
                        </Menu.Item>
                        <Menu.Item onClick={() => handleInit("Row")}>
                            <RowsIcon className="size-5 mr-2" />
                            Baris
                        </Menu.Item>
                    </Menu.Content>
                </Menu>
            )}
            {Object.keys(components).length > 0 && (
                <ComponentItem component={components} />
            )}
        </>
    );
}
