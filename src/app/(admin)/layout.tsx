import { getCurrentAdmin } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentAdmin = await getCurrentAdmin();

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-gray-900 antialiased">
      {/* Sidebar ben trai */}
      <AdminSidebar userRole={currentAdmin?.role || "Admin"} />

      {/* Vung noi dung chinh ben phai */}
      <div className="flex flex-1 flex-col pl-64 transition-all duration-300">
        <AdminHeader user={currentAdmin} />
        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
