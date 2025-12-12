import { useDashboardStore } from "@/Stores/LearnReading/dashboard";
import { Input, Typography } from "@material-tailwind/react";
import { useEffect, useState } from "react";
import { useActiveComponent } from "@/Hooks/useActiveComponent";

export default function ImageProperties() {
    const activeComponent = useActiveComponent();
    const updateComponent = useDashboardStore((state) => state.updateComponent);

    const [src, setSrc] = useState(activeComponent?.src || "");

    useEffect(() => {
        if (activeComponent) {
            setSrc(activeComponent.src || "");
        }
    }, [activeComponent?.id]);

    const handleBlur = () => {
        if (activeComponent) {
            updateComponent(activeComponent.id, { src });
        }
    };

    if (!activeComponent) return null;

    return (
        <div className="p-2">
            <div className="grid grid-cols-1 gap-4">
                <div>
                    <Typography
                        as="label"
                        className="font-semibold text-sm"
                        htmlFor="src"
                    >
                        Source
                    </Typography>
                    <Input
                        type="text"
                        id="src"
                        value={src}
                        onChange={(e) => setSrc(e.target.value)}
                        onBlur={handleBlur}
                    />
                </div>
            </div>
        </div>
    );
}
