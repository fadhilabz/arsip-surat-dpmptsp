"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useUserProfile } from "@/lib/useUserProfile";

const MENU_USER = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/surat-masuk", label: "Surat Masuk" },
  { href: "/dashboard/surat-keluar", label: "Surat Keluar" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useUserProfile();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/");
      return;
    }
    // Admin tetap boleh lihat dashboard user jika mau, jadi tidak di-redirect paksa di sini.
  }, [loading, user, router]);

  if (loading || !profile) {
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

  return (
    <div className="flex min-h-screen bg-[#f3f4f6]">
      <aside className="flex w-60 shrink-0 flex-col bg-[#1e3a8a] text-white">
        <div className="px-5 py-6">
          <p className="text-sm font-semibold leading-tight">Sistem Arsip Surat</p>
          <p className="text-xs text-white/60">DPMPTSP Kota Baubau</p>
        </div>

        <nav className="flex-1 px-3">
          {MENU_USER.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mb-1 block rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active ? "bg-white/15 font-medium" : "text-white/80 hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-3 py-4">
          <div className="mb-3 px-2">
            <p className="truncate text-sm font-medium">{profile.nama}</p>
            <p className="truncate text-xs text-white/60">{profile.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full rounded-lg bg-white/10 px-3 py-2 text-left text-sm text-white/90 hover:bg-white/15"
          >
            Keluar
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}