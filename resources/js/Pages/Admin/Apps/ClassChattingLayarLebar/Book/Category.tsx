import React from "react";
import AdminAppLayout from "@/Layouts/AdminAppLayout";
import BookCategorySettingsPage from "@/Pages/Admin/Apps/Partials/Book/BookCategorySettingsPage";

export default function Category() {
  return <BookCategorySettingsPage settingsDocumentPath="apps/class-chatting-layar-lebar/settings/filterBook" />;
}

Category.layout = (page: React.ReactNode) => {
  return <AdminAppLayout appName="class-chatting-layar-lebar">{page}</AdminAppLayout>;
};
