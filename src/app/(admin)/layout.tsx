import { getCurrentAdmin } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { Toaster } from "react-hot-toast";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentAdmin = await getCurrentAdmin();
  // Tai khoan bi khoa / da xoa (token con han nhung CSDL khong con hop le) -> dang nhap lai
  if (!currentAdmin) redirect("/admin/login");

  return (
    <div className="admin-shell flex min-h-screen bg-[#f5f6f8] text-slate-900 antialiased">
      {/* Sidebar ben trai */}
      <AdminSidebar userRole={currentAdmin.role} />

      {/* Vung noi dung chinh ben phai */}
      <div className="flex flex-1 flex-col pl-64 transition-all duration-300">
        <AdminHeader user={currentAdmin} />
        <main className="flex-1 px-6 py-7 md:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            zIndex: 99999,
            borderRadius: "12px",
            fontSize: "13px",
            padding: "10px 14px",
          },
        }}
      />
    </div>
  );
}
