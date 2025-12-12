import { useDashboardStore } from "@/Stores/LearnReading/dashboard";

const findComponentById = (component: any, id: string) => {
    if (!component || typeof component !== "object") return null;
    if (component.id === id) return component;
    if (component.childrens) {
        for (const child of component.childrens) {
            const found: any = findComponentById(child, id);
            if (found) return found;
        }
    }
    return null;
};

export const useActiveComponent = () => {
    return useDashboardStore((state) => {
        if (state.activePageIndex === null || !state.activeComponentKey) {
            return null;
        }
        const activePage = state.pages[state.activePageIndex];
        if (!activePage) return null;
        return findComponentById(activePage.components, state.activeComponentKey);
    });
};