"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useUserProfile } from "@/lib/useUserProfile";
import AdminSidebar from "@/components/AdminSidebar";
import AdminTopbar from "@/components/AdminTopbar";

const MENU_ADMIN = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/surat-masuk", label: "Surat Masuk" },
  { href: "/admin/surat-keluar", label: "Surat Keluar" },
  { href: "/admin/petugas", label: "Kelola Petugas" },
  { href: "/admin/laporan", label: "Laporan" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useUserProfile();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/");
      return;
    }
    if (profile && profile.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [loading, user, profile, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading || !profile || profile.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f4f6] text-sm text-[#6b7280]">
        Memuat...
      </div>
    );
  }

  async function handleLogout() {
    await signOut(auth);
    router.replace("/");
  }

  const pageTitle =
    MENU_ADMIN.find((item) => item.href === pathname)?.label ?? "Admin";

  return (
    <div className="flex min-h-screen bg-[#f3f4f6]">
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        profile={profile}
        onLogout={handleLogout}
      />

      <div className="flex min-h-screen flex-1 flex-col">
        <AdminTopbar title={pageTitle} onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}