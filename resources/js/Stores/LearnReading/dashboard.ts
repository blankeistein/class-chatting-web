import { generateShortId } from "@/utils";
import { create } from "zustand";

export type ComponentType = "Column" | "Row" | "Text" | "Image";

export interface ComponentProps {
    className?: string[];
    [key: string]: any;
}

export interface ComponentData {
    id: string;
    type: ComponentType;
    props: ComponentProps;
    childrens?: ComponentData[];
    value?: string; // Untuk Text
    src?: string;   // Untuk Image
}

export interface Page {
    id: string;
    name: string;
    components: ComponentData | null;
}

interface DashboardState {
    pages: Page[];
    activePageIndex: number | null;
    activeComponentKey: string | null;

    activePage: () => Page | null;
    activeComponent: () => ComponentData | null;

    // Actions
    addPage: () => void;
    deletePage: (pageId: string) => void;
    updatePage: (id: string, newPageData: Partial<Page>) => void;
    setActivePage: (index: number) => void;
    setActiveComponent: (componentId: string) => void;

    // Component Actions
    deleteComponent: (componentId: string) => void;
    updateComponent: (componentId: string, newComponentData: Partial<ComponentData>) => void;
    updateComponentProps: (componentId: string, newProps: ComponentProps) => void;
    setComponents: (newComponents: ComponentData) => void;
    initComponentChild: (newComponentType: ComponentType) => void;
    addComponentChild: (parentKey: string, newComponentType: ComponentType) => void;
}

// ------------------------------------------------------------------
// 🛠️ Helper Functions
// ------------------------------------------------------------------

const generateComponent = (type: ComponentType): ComponentData => {
    let basic: ComponentData = {
        id: generateShortId(),
        type,
        props: {},
    };

    switch (type) {
        case "Column":
        case "Row":
            basic.childrens = [];
            basic.props.className = [];
            break;
        case "Text":
            basic.value = "Text here";
            break;
        case "Image":
            basic.src = "";
            break;
    }

    return basic;
};

const updateComponentRecursively = (
    component: ComponentData | null,
    targetKey: string,
    updateFn: (c: ComponentData) => ComponentData
): ComponentData | null => {
    if (!component) return null;

    if (component.id === targetKey) {
        return updateFn(component);
    }

    if (component.childrens && component.childrens.length > 0) {
        const newChildrens = component.childrens.map((child) =>
            updateComponentRecursively(child, targetKey, updateFn)
        ).filter((child): child is ComponentData => child !== null);

        // Cek referensi untuk menghindari re-render yang tidak perlu
        if (newChildrens.some((child, index) => child !== component.childrens![index])) {
            return { ...component, childrens: newChildrens };
        }
    }

    return component;
};

const deleteComponentRecursively = (
    component: ComponentData | null,
    targetId: string
): ComponentData | null => {
    if (!component) return null;
    // Jika komponen itu sendiri yang harus dihapus (ditangani di parent biasanya, tapi untuk safety)
    if (component.id === targetId) return null;

    if (!component.childrens) {
        return component;
    }

    const newChildrens = component.childrens
        .filter(child => child.id !== targetId)
        .map(child => deleteComponentRecursively(child, targetId))
        .filter((child): child is ComponentData => child !== null);

    if (newChildrens.length !== component.childrens.length) {
        return { ...component, childrens: newChildrens };
    }

    // Deep check jika child structure berubah
    const hasChanged = newChildrens.some((child, i) => child !== component.childrens![i]);
    if (hasChanged) {
        return { ...component, childrens: newChildrens };
    }

    return component;
};

// ------------------------------------------------------------------
// 🚀 Store Implementation
// ------------------------------------------------------------------

export const useDashboardStore = create<DashboardState>((set, get) => ({
    // STATE
    pages: [],
    activePageIndex: null,
    activeComponentKey: null,

    // GETTERS
    activePage: () => {
        const { pages, activePageIndex } = get();
        if (activePageIndex === null) return null;
        return pages[activePageIndex];
    },

    activeComponent: () => {
        const { activeComponentKey } = get();
        const activePage = get().activePage();
        if (!activePage || !activePage.components || !activeComponentKey) return null;

        const findComponentById = (component: ComponentData | null, id: string): ComponentData | null => {
            if (!component) return null;
            if (component.id === id) return component;
            if (component.childrens) {
                for (const child of component.childrens) {
                    const found = findComponentById(child, id);
                    if (found) return found;
                }
            }
            return null;
        };
        return findComponentById(activePage.components, activeComponentKey);
    },

    // ACTIONS
    addPage: () => set((state) => ({
        pages: [...state.pages, { id: generateShortId(), name: "New Page", components: null }]
    })),

    deletePage: (pageId) => {
        if (confirm("Are you sure?")) {
            set((state) => {
                const newPages = state.pages.filter((data) => data.id !== pageId);
                let newActiveIndex = state.activePageIndex;
                const deletedIndex = state.pages.findIndex(p => p.id === pageId);

                if (deletedIndex === state.activePageIndex) {
                    newActiveIndex = null;
                } else if (state.activePageIndex !== null && deletedIndex !== -1 && deletedIndex < state.activePageIndex) {
                    newActiveIndex = state.activePageIndex - 1;
                }

                return {
                    pages: newPages,
                    activePageIndex: newActiveIndex,
                    activeComponentKey: newActiveIndex === null ? null : state.activeComponentKey,
                };
            });
        }
    },

    updatePage: (id, newPageData) => set((state) => ({
        pages: state.pages.map((page) => (page.id === id ? { ...page, ...newPageData } : page))
    })),

    setActivePage: (index) => set((state) => ({
        activePageIndex: state.activePageIndex === index ? null : index,
        activeComponentKey: null
    })),

    setActiveComponent: (componentId) => set((state) => ({
        activeComponentKey: state.activeComponentKey === componentId ? null : componentId
    })),

    deleteComponent: (componentId) => {
        if (!confirm("Hapus komponen ini beserta isinya?")) return;

        set((state) => {
            const { pages, activePageIndex, activeComponentKey } = state;
            if (activePageIndex === null) return {};

            const currentPage = pages[activePageIndex];

            // Case: Menghapus root component
            if (currentPage.components?.id === componentId) {
                const newPages = [...pages];
                newPages[activePageIndex] = { ...currentPage, components: null };
                return {
                    pages: newPages,
                    activeComponentKey: activeComponentKey === componentId ? null : activeComponentKey,
                };
            }

            // Case: Menghapus child component
            const updatedComponents = deleteComponentRecursively(currentPage.components, componentId);

            const newPages = [...pages];
            newPages[activePageIndex] = { ...currentPage, components: updatedComponents };

            return {
                pages: newPages,
                activeComponentKey: activeComponentKey === componentId ? null : activeComponentKey,
            };
        });
    },

    updateComponent: (componentId, newComponentData) => {
        set((state) => {
            if (state.activePageIndex === null) return {};

            const updateFn = (component: ComponentData) => ({
                ...component,
                ...newComponentData,
            });

            const currentPage = state.pages[state.activePageIndex];
            const updatedComponents = updateComponentRecursively(
                currentPage.components,
                componentId,
                updateFn
            );

            const newPages = [...state.pages];
            newPages[state.activePageIndex] = { ...currentPage, components: updatedComponents };

            return { pages: newPages };
        });
    },

    updateComponentProps: (componentId, newProps) => {
        set((state) => {
            if (state.activePageIndex === null) return {};

            const updateFn = (component: ComponentData) => ({
                ...component,
                props: {
                    ...component.props,
                    ...newProps,
                },
            });

            const currentPage = state.pages[state.activePageIndex];
            const updatedComponents = updateComponentRecursively(
                currentPage.components,
                componentId,
                updateFn
            );

            const newPages = [...state.pages];
            newPages[state.activePageIndex] = { ...currentPage, components: updatedComponents };

            return { pages: newPages };
        });
    },

    setComponents: (newComponents) => set((state) => {
        if (state.activePageIndex === null) return {};
        return {
            pages: state.pages.map((page, index) =>
                (index === state.activePageIndex ? { ...page, components: newComponents } : page)
            )
        };
    }),

    initComponentChild: (newComponentType) => set((state) => {
        if (state.activePageIndex === null) return {};
        const newChild = generateComponent(newComponentType);
        return {
            pages: state.pages.map((page, index) =>
                (index !== state.activePageIndex ? page : { ...page, components: newChild })
            )
        };
    }),

    addComponentChild: (parentKey, newComponentType) => set((state) => {
        if (state.activePageIndex === null) return {};
        const newChild = generateComponent(newComponentType);

        const updateFn = (component: ComponentData) => ({
            ...component,
            childrens: [...(component.childrens || []), newChild]
        });

        return {
            pages: state.pages.map((page, index) => {
                if (index !== state.activePageIndex) return page;
                const updatedComponents = updateComponentRecursively(page.components, parentKey, updateFn);
                return { ...page, components: updatedComponents };
            }),
        };
    }),
}));