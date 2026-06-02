import React, { useCallback } from "react";
import { Head } from "@inertiajs/react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Button,
  Card,
  Chip,
  Dialog,
  IconButton,
  Input,
  Typography,
} from "@material-tailwind/react";
import {
  ArrowDownUp,
  ArrowDownIcon,
  ArrowUpIcon,
  BookOpenTextIcon,
  GripVerticalIcon,
  LoaderCircleIcon,
  PencilIcon,
  PlusIcon,
  SaveIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { PageHeader } from "@/Components/PageHeader";
import { getFirebaseFirestore } from "@/lib/firebase";

type FirestoreBookCategory = {
  name?: string;
  keyword?: string;
};

type FilterBookSettings = {
  items?: FirestoreBookCategory[];
};

type BookCategory = {
  id: string;
  name: string;
  keyword: string;
  order: number;
};

type CategoryForm = {
  name: string;
  keyword: string;
};

type BookCategorySettingsPageProps = {
  settingsDocumentPath: string;
};

const createCategoryId = (category: Pick<BookCategory, "keyword" | "name">, index: number): string => {
  const source = category.keyword || category.name;
  const slug = source
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${index}-${slug || "category"}`;
};

const normalizeCategory = (value: Partial<FirestoreBookCategory>, index: number): BookCategory => {
  const category = {
    name: value.name ?? "",
    keyword: value.keyword ?? "",
    order: index,
  };

  return {
    ...category,
    id: createCategoryId(category, index),
  };
};

const resequenceCategories = (items: BookCategory[]): BookCategory[] => {
  return items.map((category, index) => ({
    ...category,
    order: index,
  }));
};

const serializeCategories = (items: BookCategory[]): FirestoreBookCategory[] => {
  return resequenceCategories(items).map((category) => ({
    name: category.name,
    keyword: category.keyword,
  }));
};

const createEmptyForm = (): CategoryForm => ({
  name: "",
  keyword: "",
});

const SortableCategoryRow = ({
  category,
  isOrderMode,
  hasActiveSearch,
  isDeleting,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: {
  category: BookCategory;
  isOrderMode: boolean;
  hasActiveSearch: boolean;
  isDeleting: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: category.id,
    disabled: !isOrderMode || hasActiveSearch,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-slate-900 ${isDragging ? "opacity-70" : ""}`}
    >
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`rounded-lg border border-slate-200 p-2 text-slate-500 transition dark:border-slate-700 dark:text-slate-300 ${isOrderMode && !hasActiveSearch ? "cursor-grab hover:bg-slate-100 dark:hover:bg-slate-800" : "cursor-not-allowed opacity-50"
              }`}
            {...attributes}
            {...listeners}
            disabled={!isOrderMode || hasActiveSearch}
          >
            <GripVerticalIcon className="h-4 w-4" />
          </button>
          {isOrderMode && (
            <div className="flex items-center gap-1">
              <IconButton variant="ghost" size="sm" onClick={onMoveUp} disabled={!canMoveUp}>
                <ArrowUpIcon className="h-4 w-4" />
              </IconButton>
              <IconButton variant="ghost" size="sm" onClick={onMoveDown} disabled={!canMoveDown}>
                <ArrowDownIcon className="h-4 w-4" />
              </IconButton>
            </div>
          )}
        </div>
      </td>
      <td className="px-4 py-3 align-middle">
        <Typography variant="small" className="font-semibold text-slate-800 dark:text-slate-100">
          {category.name}
        </Typography>
      </td>
      <td className="px-4 py-3 align-middle">
        <Chip size="sm" variant="ghost" className="w-fit bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <Chip.Label>{category.keyword || "-"}</Chip.Label>
        </Chip>
      </td>
      <td className="px-4 py-3 align-middle">
        <Typography variant="small" className="font-medium text-slate-600 dark:text-slate-300">
          {category.order}
        </Typography>
      </td>
      <td className="px-4 py-3 align-middle text-right">
        <div className="flex justify-end gap-2">
          <IconButton variant="ghost" color="secondary" onClick={onEdit}>
            <PencilIcon className="h-4 w-4" />
          </IconButton>
          <IconButton variant="ghost" color="error" onClick={onDelete} disabled={isDeleting}>
            {isDeleting ? <LoaderCircleIcon className="h-4 w-4 animate-spin" /> : <Trash2Icon className="h-4 w-4" />}
          </IconButton>
        </div>
      </td>
    </tr>
  );
};

export default function BookCategorySettingsPage({ settingsDocumentPath }: BookCategorySettingsPageProps) {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const firestore = React.useMemo(() => getFirebaseFirestore(), []);
  const [categories, setCategories] = React.useState<BookCategory[]>([]);
  const [search, setSearch] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isOrderMode, setIsOrderMode] = React.useState(false);
  const [isSavingOrder, setIsSavingOrder] = React.useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<BookCategory | null>(null);
  const [form, setForm] = React.useState<CategoryForm>(createEmptyForm());
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [activeDeleteId, setActiveDeleteId] = React.useState<string | null>(null);

  const saveCategories = useCallback(async (items: BookCategory[]): Promise<void> => {
    if (!firestore) {
      toast.error("Firebase Firestore belum siap.");

      return;
    }

    await setDoc(
      doc(firestore, settingsDocumentPath),
      { items: serializeCategories(items) },
      { merge: true },
    );
  }, [firestore, settingsDocumentPath]);

  React.useEffect(() => {
    if (!firestore) {
      setIsLoading(false);
      toast.error("Firebase Firestore belum terkonfigurasi. Tambahkan VITE_FIREBASE_PROJECT_ID.");

      return;
    }

    const unsubscribe = onSnapshot(
      doc(firestore, settingsDocumentPath),
      (snapshot) => {
        const data = snapshot.data() as FilterBookSettings | undefined;
        const items = Array.isArray(data?.items) ? data.items : [];

        setCategories(items.map(normalizeCategory));
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching filter book settings:", error);
        toast.error("Gagal membaca kategori buku dari Firebase Firestore.");
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [firestore, settingsDocumentPath]);

  const filteredCategories = React.useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return categories;
    }

    return categories.filter((category) => {
      return [category.name, category.keyword, category.id].some((value) => value.toLowerCase().includes(query));
    });
  }, [categories, search]);

  const hasActiveSearch = search.trim().length > 0;
  const sortableIds = React.useMemo(() => filteredCategories.map((category) => category.id), [filteredCategories]);

  const closeDialog = useCallback(() => {
    setIsCreateDialogOpen(false);
    setEditingCategory(null);
    setForm(createEmptyForm());
  }, []);

  const openCreateDialog = useCallback(() => {
    setEditingCategory(null);
    setForm(createEmptyForm());
    setIsCreateDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((category: BookCategory) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      keyword: category.keyword,
    });
    setIsCreateDialogOpen(true);
  }, []);

  const updateForm = useCallback((key: keyof CategoryForm, value: string) => {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
  }, []);

  const moveCategory = useCallback((index: number, direction: "up" | "down") => {
    setCategories((currentCategories) => {
      const nextIndex = direction === "up" ? index - 1 : index + 1;

      if (nextIndex < 0 || nextIndex >= currentCategories.length) {
        return currentCategories;
      }

      const reorderedCategories = [...currentCategories];
      const [selectedCategory] = reorderedCategories.splice(index, 1);
      reorderedCategories.splice(nextIndex, 0, selectedCategory);

      return resequenceCategories(reorderedCategories);
    });
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setCategories((currentCategories) => {
      const oldIndex = currentCategories.findIndex((category) => category.id === active.id);
      const newIndex = currentCategories.findIndex((category) => category.id === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return currentCategories;
      }

      return resequenceCategories(arrayMove(currentCategories, oldIndex, newIndex));
    });
  }, []);

  const saveOrder = useCallback(async () => {
    setIsSavingOrder(true);

    try {
      await saveCategories(categories);
      setCategories((currentCategories) => resequenceCategories(currentCategories));
      setIsOrderMode(false);
      toast.success("Urutan kategori berhasil disimpan.");
    } catch (error) {
      console.error("Error saving category order:", error);
      toast.error("Gagal menyimpan urutan kategori.");
    } finally {
      setIsSavingOrder(false);
    }
  }, [saveCategories, categories]);

  const handleSubmit = useCallback(async () => {
    const name = form.name.trim();
    const keyword = form.keyword.trim().toLowerCase();

    if (!name) {
      toast.error("Nama kategori wajib diisi.");

      return;
    }

    const duplicateKeyword = categories.find((category) => {
      if (editingCategory && category.id === editingCategory.id) {
        return false;
      }

      return category.keyword.toLowerCase() === keyword;
    });

    if (duplicateKeyword) {
      toast.error("Keyword kategori sudah digunakan.");

      return;
    }

    setIsSubmitting(true);

    try {
      if (editingCategory) {
        await saveCategories(categories.map((category) => {
          if (category.id !== editingCategory.id) {
            return category;
          }

          return {
            ...category,
            name,
            keyword,
          };
        }));
        toast.success("Kategori berhasil diperbarui.");
      } else {
        const newCategory = {
          id: createCategoryId({ name, keyword }, categories.length),
          name,
          keyword,
          order: categories.length,
        };

        await saveCategories([...categories, newCategory]);
        toast.success("Kategori berhasil ditambahkan.");
      }

      closeDialog();
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("Gagal menyimpan kategori.");
    } finally {
      setIsSubmitting(false);
    }
  }, [form, categories, editingCategory, saveCategories, closeDialog]);

  const handleDelete = useCallback(async (category: BookCategory) => {
    if (!window.confirm(`Hapus kategori "${category.name}"?`)) {
      return;
    }

    setActiveDeleteId(category.id);

    try {
      await saveCategories(categories.filter((item) => item.id !== category.id));
      toast.success("Kategori berhasil dihapus.");
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Gagal menghapus kategori.");
    } finally {
      setActiveDeleteId(null);
    }
  }, [saveCategories, categories]);

  return (
    <>
      <Head title="Kategori Buku" />
      <Toaster position="top-center" />

      <div className="min-h-screen space-y-6 p-4 md:p-6">
        <PageHeader
          title="Kategori Buku"
          description="Kelola kategori buku untuk memudahkan pengelompokan dan pencarian buku di aplikasi Class Chatting."
          actions={(
            <>
              <Button
                className="flex items-center gap-2 bg-slate-900 dark:bg-white dark:text-slate-900"
                size="sm"
                onClick={openCreateDialog}
              >
                <PlusIcon className="h-4 w-4" />
                Tambah Kategori
              </Button>
              <IconButton
                variant={isOrderMode ? "solid" : "outline"}
                onClick={() => setIsOrderMode((value) => !value)}
                title="Mode urutkan kategori"
              >
                <ArrowDownUp className="h-4 w-4" />
              </IconButton>
            </>
          )}
        />

        <Card className="border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="space-y-3">
              <Typography variant="small" className="font-semibold text-slate-700 dark:text-slate-200">
                Pencarian dan status
              </Typography>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama kategori, keyword, atau ID..."
                className="dark:text-white"
              >
                <Input.Icon>
                  <SearchIcon className="h-4 w-4" />
                </Input.Icon>
              </Input>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Chip size="sm" variant="ghost" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <Chip.Label>{categories.length} kategori</Chip.Label>
              </Chip>
              {isOrderMode && (
                <>
                  <Chip size="sm" variant="ghost" className="bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                    <Chip.Label>Mode urut aktif</Chip.Label>
                  </Chip>
                  {!hasActiveSearch && (
                    <Chip size="sm" variant="ghost" className="bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                      <Chip.Label>Drag & drop atau tombol panah</Chip.Label>
                    </Chip>
                  )}
                  <Button variant="outline" onClick={() => setIsOrderMode(false)}>
                    Batal
                  </Button>
                  <Button color="success" onClick={saveOrder} disabled={isSavingOrder}>
                    {isSavingOrder ? <LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" /> : <SaveIcon className="mr-2 h-4 w-4" />}
                    Simpan Urutan
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>

        {isLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
              />
            ))}
          </div>
        ) : filteredCategories.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                    <thead className="bg-slate-50 dark:bg-slate-950/60">
                      <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <th className="px-4 py-3">Urut</th>
                        <th className="px-4 py-3">Kategori</th>
                        <th className="px-4 py-3">Keyword</th>
                        <th className="px-4 py-3">Order</th>
                        <th className="px-4 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredCategories.map((category) => {
                        const originalIndex = categories.findIndex((item) => item.id === category.id);

                        return (
                          <SortableCategoryRow
                            key={category.id}
                            category={category}
                            isOrderMode={isOrderMode}
                            hasActiveSearch={hasActiveSearch}
                            isDeleting={activeDeleteId === category.id}
                            canMoveUp={originalIndex > 0}
                            canMoveDown={originalIndex < categories.length - 1}
                            onMoveUp={() => moveCategory(originalIndex, "up")}
                            onMoveDown={() => moveCategory(originalIndex, "down")}
                            onEdit={() => openEditDialog(category)}
                            onDelete={() => handleDelete(category)}
                          />
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </SortableContext>
          </DndContext>
        ) : (
          <Card className="border border-dashed border-slate-300 bg-slate-50 p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <BookOpenTextIcon className="h-8 w-8" />
            </div>
            <Typography variant="h6" className="mt-4 text-slate-800 dark:text-white">
              Kategori tidak ditemukan
            </Typography>
            <Typography className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Data Kosong
            </Typography>
          </Card>
        )}
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => !isSubmitting && !open ? closeDialog() : setIsCreateDialogOpen(open)} size="md">
        <Dialog.Overlay>
          <Dialog.Content className="dark:border-slate-800">
            <div className="space-y-5">
              <div>
                <Typography type="h6">
                  {editingCategory ? "Edit Kategori" : "Tambah Kategori"}
                </Typography>
                <Typography className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {editingCategory ? "Perbarui nama dan keyword kategori buku." : "Tambahkan kategori baru ke settings filterBook."}
                </Typography>
              </div>

              <div className="space-y-4">
                <div>
                  <Typography variant="small" className="mb-2 font-medium text-slate-700 dark:text-slate-200">
                    Nama Kategori
                  </Typography>
                  <Input
                    value={form.name}
                    onChange={(event) => updateForm("name", event.target.value)}
                    placeholder="Contoh: TK"
                    className="dark:text-white"
                  />
                </div>

                <div>
                  <Typography variant="small" className="mb-2 font-medium text-slate-700 dark:text-slate-200">
                    Keyword
                  </Typography>
                  <Input
                    value={form.keyword}
                    onChange={(event) => updateForm("keyword", event.target.value)}
                    placeholder="Contoh: tk"
                    className="dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" color="secondary" onClick={closeDialog} disabled={isSubmitting}>
                  Batal
                </Button>
                <Button color="success" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? <LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {editingCategory ? "Simpan Perubahan" : "Tambah Kategori"}
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog>
    </>
  );
}
