"use client";

export default function AdminTopbar({ title, onOpenSidebar }) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 md:hidden">
      <button
        onClick={onOpenSidebar}
        className="rounded-lg p-1.5 text-[#111827] hover:bg-[#f3f4f6]"
        aria-label="Buka menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>
      <p className="text-sm font-semibold text-[#111827]">{title}</p>
    </header>
  );
}