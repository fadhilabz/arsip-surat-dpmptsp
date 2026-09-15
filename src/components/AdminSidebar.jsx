"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU_ADMIN = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/surat-masuk", label: "Surat Masuk" },
  { href: "/admin/surat-keluar", label: "Surat Keluar" },
  { href: "/admin/petugas", label: "Kelola Petugas" },
  { href: "/admin/laporan", label: "Laporan" },
];

export default function AdminSidebar({ open, onClose, profile, onLogout }) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay gelap saat sidebar terbuka di HP */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col bg-[#1e3a8a] text-white transition-transform duration-200 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full"}
        md:static md:translate-x-0 md:w-60`}
      >
        <div className="flex items-center justify-between px-5 py-6">
          <div>
            <p className="text-sm font-semibold leading-tight">Sistem Arsip Surat</p>
            <p className="text-xs text-white/60">DPMPTSP Kota Baubau</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-white/70 hover:bg-white/10 md:hidden"
            aria-label="Tutup menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3">
          {MENU_ADMIN.map((item) => {
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
            onClick={onLogout}
            className="w-full rounded-lg bg-white/10 px-3 py-2 text-left text-sm text-white/90 hover:bg-white/15"
          >
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
}