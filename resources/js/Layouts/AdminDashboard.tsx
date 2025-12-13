import React from "react";
import {
  Card,
  Navbar,
} from "@material-tailwind/react";

function Sidebar() {
  return (
    <Card className="h-[calc(100vh-2rem)] w-full max-w-[20rem] p-4 shadow-xl shadow-blue-gray-900/5 fixed top-4 left-4 z-50 hidden lg:flex flex-col">

    </Card>
  );
}

function TopNavbar() {
  return (
    <Navbar className="mx-auto max-w-none px-4 py-3 rounded-xl border border-blue-gray-100 mb-6 sticky top-4 z-40 bg-white/80 backdrop-blur-md">

    </Navbar>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-blue-gray-50/50 flex">
      <Sidebar />
      <div className="flex-1 p-4 lg:ml-[20rem]">
        <TopNavbar />
        {children}
      </div>
    </div>
  );
}