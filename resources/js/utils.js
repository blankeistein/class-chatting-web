import { useDashboardStore } from "./Stores/LearnReading/dashboard";
import { useActiveComponent } from "./Hooks/useActiveComponent";

export function generateShortId() {
    const timestamp = new Date().getTime().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 9);
    return `_${timestamp}${randomPart}`;
}

// Helper untuk mengelola kelas-kelas Tailwind di dalam array
export const useClassManager = () => {
    const activeComponent = useActiveComponent();
    const updateComponentProps = useDashboardStore(
        (state) => state.updateComponentProps
    );

    const findClassValue = (prefix) => {
        const className = activeComponent?.props?.className || [];
        return className.find((cls) => cls.startsWith(prefix)) || "";
    };

    const updateClass = (prefix, newClass) => {
        if (!activeComponent) return;

        const oldClasses = activeComponent.props?.className || [];
        // 1. Hapus kelas lama yang punya prefix sama
        const filteredClasses = oldClasses.filter(
            (cls) => !cls.startsWith(prefix)
        );
        // 2. Tambahkan kelas baru jika ada
        if (newClass) {
            filteredClasses.push(newClass);
        }
        // 3. Panggil action di store
        updateComponentProps(activeComponent.id, {
            className: filteredClasses,
        });
    };

    return { findClassValue, updateClass };
};