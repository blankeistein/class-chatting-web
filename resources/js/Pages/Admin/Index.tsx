import {
  Card,
  Typography,
} from "@material-tailwind/react";
import DashboardLayout from "@/Layouts/AdminDashboard";

export default function Index() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
      {/* Content */}
    </div>
  )
}

Index.layout = (page: React.ReactNode) => {
  return <DashboardLayout>{page}</DashboardLayout>
}