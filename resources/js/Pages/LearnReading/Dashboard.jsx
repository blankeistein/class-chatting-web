import ComponentRenderer from "@/Components/LearnReading/ComponentRenderer";
import ComponentsContainer from "@/Components/LearnReading/ComponentsContainer";
import { PROPERTIES_MAP } from "@/Components/LearnReading/contanta";
import PageItem from "@/Components/LearnReading/PageItem";
import { useActiveComponent } from "@/Hooks/useActiveComponent";
import { useDashboardStore } from "@/Stores/LearnReading/dashboard";
import { Head } from "@inertiajs/react";
import { IconButton, List, Typography } from "@material-tailwind/react";
import { PlusIcon } from "lucide-react";
import { shallow } from "zustand/shallow";

export default function Dashboard() {
    const { pages, activePageIndex } = useDashboardStore(
        (state) => ({
            pages: state.pages,
            activePageIndex: state.activePageIndex,
        }),
        shallow
    );

    const addPage = useDashboardStore((state) => state.addPage);
    const activeComponent = useActiveComponent();

    const Properties = activeComponent?.type
        ? PROPERTIES_MAP[activeComponent.type]
        : null;

    return (
        <>
            <Head title="Lestari Ilmu" />
            <div className="h-screen flex">
                {/* Container */}
                <div className="bg-white w-full max-w-[320px]">
                    <div className="grid grid-rows-[max-content_1fr_max-content_1fr] gap-4 h-screen p-2">
                        <div className="flex justify-between items-center select-none">
                            <Typography
                                as="h5"
                                className="!text-base font-medium"
                            >
                                Pages
                            </Typography>

                            <IconButton
                                variant="ghost"
                                size="sm"
                                onClick={addPage}
                            >
                                <PlusIcon className="size-5" />
                            </IconButton>
                        </div>
                        <div className="overflow-auto">
                            {pages.length === 0 && (
                                <Typography
                                    as="p"
                                    className="text-center text-sm"
                                >
                                    Halaman Kosong
                                </Typography>
                            )}
                            {pages && (
                                <List>
                                    {pages.map((data, index) => (
                                        <PageItem
                                            key={data.id}
                                            id={data.id}
                                            index={index}
                                            name={data.name}
                                            selected={index === activePageIndex}
                                        />
                                    ))}
                                </List>
                            )}
                        </div>

                        <div className="flex justify-between items-center select-none">
                            <Typography
                                as="h5"
                                className="!text-base font-medium"
                            >
                                Components
                            </Typography>
                        </div>
                        <div className="overflow-auto">
                            {activePageIndex !== null &&
                                pages[activePageIndex]?.components && (
                                    <ComponentsContainer
                                        components={
                                            pages[activePageIndex].components
                                        }
                                    />
                                )}
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div className="bg-gray-100 w-full flex items-center justify-center">
                    <div className="bg-white rounded-md w-full max-w-[320px] h-full max-h-[520px] shadow-md">
                        <ComponentRenderer
                            data={pages[activePageIndex]?.components}
                        />
                    </div>
                </div>

                {/* Properti */}
                <div
                    className={`bg-white w-full max-w-[320px] shadow-sm ${
                        !activeComponent && "hidden"
                    }`}
                >
                    <div className="p-2 px-4 border-b">
                        <Typography
                            as="h5"
                            className="!text-base font-bold"
                        >
                            {activeComponent?.type}
                        </Typography>
                    </div>
                    <div>
                        {activeComponent && Properties && <Properties />}
                    </div>
                </div>
            </div>
        </>
    );
}
