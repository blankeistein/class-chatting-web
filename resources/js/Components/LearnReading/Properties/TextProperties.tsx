import { useDashboardStore } from "@/Stores/LearnReading/dashboard";
import { Input } from "@material-tailwind/react";
import { useEffect, useState } from "react";
import { useActiveComponent } from "@/Hooks/useActiveComponent";

export default function TextProperties() {
    const activeComponent = useActiveComponent();
    const updateComponent = useDashboardStore((state) => state.updateComponent);

    // Gunakan state lokal untuk input agar tidak lag saat mengetik cepat
    const [value, setValue] = useState(activeComponent?.value || "");

    // Sinkronkan state lokal jika komponen aktif berubah
    useEffect(() => {
        if (activeComponent) {
            setValue(activeComponent.value || "");
        }
    }, [activeComponent?.id]);

    // Panggil action dari store saat input selesai diubah (onBlur)
    const handleBlur = () => {
        if (activeComponent) {
            updateComponent(activeComponent.id, { value });
        }
    };

    if (!activeComponent) return null;

    return (
        <div className="p-4">
            <Input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleBlur}
            />
        </div>
    );
}