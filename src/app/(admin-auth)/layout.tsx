import { Toaster } from "react-hot-toast";

// Layout rieng cho trang dang nhap quan tri: khong co sidebar/header,
// va khong yeu cau dang nhap (layout (admin) se chuyen huong neu chua dang nhap)
export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{ duration: 3000, style: { borderRadius: "12px", fontSize: "13px", padding: "10px 14px" } }}
      />
    </>
  );
}
