import { generateShortId } from "@/utils";
import { create } from "zustand";

const generateComponent = (type) => {
    let basic = {
        id: generateShortId(),
        type,
        props: {},
    };

    switch (type) {
        case "Column":
            basic["childrens"] = [];
            basic.props["className"] = []; // Inisialisasi sebagai array
            break;
        case "Row":
            basic["childrens"] = [];
            basic.props["className"] = []; // Inisialisasi sebagai array
            break;
        case "Text":
            basic["value"] = "Text here";
            break;
        case "Image":
            basic["src"] = "";
            break;
    }

    return basic;
};

// Helper rekursif untuk MEMPERBARUI komponen
const updateComponentRecursively = (component, targetKey, updateFn) => {
    if (component.id === targetKey) {
        return updateFn(component);
    }

    if (component.childrens && component.childrens.length > 0) {
        const newChildrens = component.childrens.map((child) =>
            updateComponentRecursively(child, targetKey, updateFn)
        );
        if (newChildrens.some((child, index) => child !== component.childrens[index])) {
            return { ...component, childrens: newChildrens };
        }
    }

    return component;
};

// Helper rekursif untuk MENGHAPUS komponen
const deleteComponentRecursively = (component, targetId) => {
    if (!component || !component.childrens) {
        return component;
    }

    const newChildrens = component.childrens.filter(child => child.id !== targetId);

    if (newChildrens.length !== component.childrens.length) {
        return {
            ...component,
            childrens: newChildrens.map(child => deleteComponentRecursively(child, targetId)),
        };
    }

    return {
        ...component,
        childrens: component.childrens.map(child => deleteComponentRecursively(child, targetId)),
    };
};

export const useDashboardStore = create((set, get) => ({
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
        if (!activePage || !activeComponentKey) return null;

        const findComponentById = (component, id) => {
            if (!component || typeof component !== 'object') return null;
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
    addPage: () => set((state) => ({ pages: [...state.pages, { id: generateShortId(), name: "New Page", components: {} }] })),

    deletePage: (pageId) => {
        if (confirm("Are you sure?")) {
            set((state) => {
                const newPages = state.pages.filter((data) => data.id !== pageId);
                let newActiveIndex = state.activePageIndex;
                const deletedIndex = state.pages.findIndex(p => p.id === pageId);

                if (deletedIndex === state.activePageIndex) {
                    newActiveIndex = null;
                } else if (state.activePageIndex !== null && deletedIndex < state.activePageIndex) {
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

    updatePage: (id, newPageData) => set((state) => ({ pages: state.pages.map((page) => (page.id === id ? { ...page, ...newPageData } : page)) })),

    setActivePage: (index) => set((state) => ({ activePageIndex: state.activePageIndex === index ? null : index, activeComponentKey: null })),

    setActiveComponent: (componentId) => set((state) => ({ activeComponentKey: state.activeComponentKey === componentId ? null : componentId })),

    deleteComponent: (componentId) => {
        if (!confirm("Hapus komponen ini beserta isinya?")) return;

        set((state) => {
            const { pages, activePageIndex, activeComponentKey } = state;
            if (activePageIndex === null) return {};

            const currentPage = pages[activePageIndex];

            if (currentPage.components?.id === componentId) {
                const newPages = [...pages];
                newPages[activePageIndex] = { ...currentPage, components: {} };
                return {
                    pages: newPages,
                    activeComponentKey: activeComponentKey === componentId ? null : activeComponentKey,
                };
            }

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
    
            const updateFn = (component) => ({
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

            const updateFn = (component) => ({
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
        return { pages: state.pages.map((page, index) => (index === state.activePageIndex ? { ...page, components: newComponents } : page)) };
    }),

    initComponentChild: (newComponentType) => set((state) => {
        if (state.activePageIndex === null) return {};
        const newChild = generateComponent(newComponentType);
        return { pages: state.pages.map((page, index) => (index !== state.activePageIndex ? page : { ...page, components: newChild })) };
    }),

    addComponentChild: (parentKey, newComponentType) => set((state) => {
        if (state.activePageIndex === null) return {};
        const newChild = generateComponent(newComponentType);
        const updateFn = (component) => ({ ...component, childrens: [...component.childrens, newChild] });
        return {
            pages: state.pages.map((page, index) => {
                if (index !== state.activePageIndex) return page;
                const updatedComponents = updateComponentRecursively(page.components, parentKey, updateFn);
                return { ...page, components: updatedComponents };
            }),
        };
    }),
}));
