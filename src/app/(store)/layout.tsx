import StoreHeader from "@/components/layout/StoreHeader";
import StoreFooter from "@/components/layout/StoreFooter";
import { Toaster } from "react-hot-toast";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <StoreHeader />
      <main className="flex-1">{children}</main>
      <StoreFooter />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: "14px",
            padding: "12px 16px",
            fontSize: "14px",
            boxShadow: "0 12px 32px -8px rgba(15,23,42,0.2)",
          },
          success: { iconTheme: { primary: "#f66315", secondary: "#fff" } },
        }}
      />
    </div>
  );
}
