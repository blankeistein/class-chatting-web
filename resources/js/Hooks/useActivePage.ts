import { useDashboardStore } from "@/Stores/LearnReading/dashboard";

export const useActivePage = () => {
    return useDashboardStore((state) => {
        if (state.activePageIndex === null) {
            return null;
        }
        return state.pages[state.activePageIndex];
    });
};