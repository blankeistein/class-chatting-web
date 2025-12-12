import { useClassManager } from "@/utils";
import { Select, Typography } from "@material-tailwind/react";

export default function RowProperties() {
    const { findClassValue, updateClass } = useClassManager();

    const justifyOptions = [
        { label: "Start", value: "justify-start" },
        { label: "End", value: "justify-end" },
        { label: "Center", value: "justify-center" },
        { label: "Space Between", value: "justify-between" },
        { label: "Space Around", value: "justify-around" },
        { label: "Space Evenly", value: "justify-evenly" },
    ];

    const alignItemsOptions = [
        { label: "Start", value: "items-start" },
        { label: "End", value: "items-end" },
        { label: "Center", value: "items-center" },
        { label: "Baseline", value: "items-baseline" },
        { label: "Stretch", value: "items-stretch" },
    ];

    return (
        <div className="p-2 grid grid-cols-1 gap-4">
            <div>
                <Typography
                    as="label"
                    className="font-semibold text-sm"
                    htmlFor="justify-content"
                >
                    Justify Content
                </Typography>
                <Select
                    id="justify-content"
                    label="Justify Content"
                    size="sm"
                    value={findClassValue("justify-")}
                    onChange={(value: string | undefined) => updateClass("justify-", value || '')}
                >
                    {justifyOptions.map((opt) => (
                        <Select.Option key={opt.value} value={opt.value}>
                            {opt.label}
                        </Select.Option>
                    ))}
                </Select>
            </div>
            <div>
                <Typography
                    as="label"
                    className="font-semibold text-sm"
                    htmlFor="align-items"
                >
                    Align Items
                </Typography>
                <Select
                    id="align-items"
                    label="Align Items"
                    size="sm"
                    value={findClassValue("items-")}
                    onChange={(value: string | undefined) => updateClass("items-", value || '')}
                >
                    {alignItemsOptions.map((opt) => (
                        <Select.Option key={opt.value} value={opt.value}>
                            {opt.label}
                        </Select.Option>
                    ))}
                </Select>
            </div>
        </div>
    );
}