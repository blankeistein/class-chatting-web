import ComponentRenderer from "@/Components/LearnReading/ComponentRenderer";
import { useLearnReading } from "@/Stores/LearnReading/learn";
import { Head } from "@inertiajs/react";
import { IconButton } from "@material-tailwind/react";
import { AArrowDownIcon, AArrowUpIcon, ChevronLeftIcon } from "lucide-react";
import { useCallback, useState } from "react";

const DUMMY_TEXT =
    "baju itu berwarna merah. rambutnya berwarna pink. tasku berwarna hitam.";

const DUMMY_TEXT_2 = "baju ini merah jenderal. dia pakai pesawat.";

const data = [
    {
        type: "Column",
        props: { className: "pt-5" },
        childrens: [
            {
                type: "Text",
                props: {},
                value: "baju itu berwarna merah. rambutnya berwarna pink. tasku berwarna hitam.",
            },
        ],
    },
    {
        type: "Column",
        props: { className: "pt-5 grid grid-cols-2" },
        childrens: [
            {
                type: "Text",
                props: {},
                value: "darah itu merah jenderal.",
            },
            {
                type: "Text",
                props: {},
                value: "Baju itu putih.",
            },
        ],
    },
];

export default function Learn() {
    const { changeTextProps, textProps } = useLearnReading();
    const [page, setPage] = useState(0);

    const handleIncreaseFont = useCallback(
        (newSize = null) => {
            if (typeof newSize == "number") {
                changeTextProps({ fontSize: newSize });
            } else {
                changeTextProps({ fontSize: textProps.fontSize + 2 });
            }
        },
        [textProps.fontSize]
    );

    const handleDecreaseFont = useCallback(
        (newSize = null) => {
            if (typeof newSize == "number") {
                changeTextProps({ fontSize: newSize });
            } else {
                changeTextProps({ fontSize: textProps.fontSize - 2 });
            }
        },
        [textProps.fontSize]
    );

    return (
        <>
            <Head title="Test" />
            <div className="mx-auto grid grid-rows-[max-content_1fr_max-content] max-w-lg w-full bg-[#F0F7FF] h-screen px-1">
                <div className="flex gap-2"></div>
                <div className="overflow-y-auto">
                    <ComponentRenderer data={data[page]} />
                </div>
                <div className="flex justify-between gap-2 p-1">
                    <IconButton
                        onClick={() =>
                            setPage((prev) => (prev === 0 ? 0 : prev - 1))
                        }
                        disabled={page === 0}
                    >
                        <ChevronLeftIcon />
                    </IconButton>
                    <IconButton onClick={handleDecreaseFont}>
                        <AArrowDownIcon />
                    </IconButton>
                    <IconButton onClick={handleIncreaseFont}>
                        <AArrowUpIcon />
                    </IconButton>
                    <IconButton
                        onClick={() =>
                            setPage((prev) =>
                                prev > data.length - 1
                                    ? data.length - 1
                                    : prev + 1
                            )
                        }
                        disabled={page >= data.length - 1}
                    >
                        <ChevronLeftIcon className="-scale-x-100" />
                    </IconButton>
                </div>
            </div>
        </>
    );
}
