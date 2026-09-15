"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Surat = {
  id: string;
  nomor_surat?: string;
  perihal?: string;
  status?: string;
  tanggal_terima?: string;
  tanggal_kirim?: string;
  pengirim?: string;
  tujuan?: string;
};

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <p className="text-xs font-medium text-[#6b7280]">{label}</p>
      <p className="mt-2 text-2xl font-semibold" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [suratMasuk, setSuratMasuk] = useState<Surat[]>([]);
  const [suratKeluar, setSuratKeluar] = useState<Surat[]>([]);

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, "surat_masuk"), (snap) => {
      setSuratMasuk(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    const unsub2 = onSnapshot(collection(db, "surat_keluar"), (snap) => {
      setSuratKeluar(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const belumDiproses = suratMasuk.filter((s) => s.status === "belum_diproses").length;
  const diproses = suratMasuk.filter((s) => s.status === "diproses").length;
  const selesai = suratMasuk.filter((s) => s.status === "selesai").length;

  const aktivitasTerbaru = [
    ...suratMasuk.map((s) => ({ ...s, jenis: "Masuk" as const, tanggal: s.tanggal_terima })),
    ...suratKeluar.map((s) => ({ ...s, jenis: "Keluar" as const, tanggal: s.tanggal_kirim })),
  ]
    .sort((a, b) => (b.tanggal || "").localeCompare(a.tanggal || ""))
    .slice(0, 8);

  return (
    <div className="px-6 py-8 sm:px-8">
      <h1 className="text-xl font-semibold text-[#111827]">Dashboard Admin</h1>
      <p className="mt-1 text-sm text-[#6b7280]">Ringkasan surat masuk dan surat keluar.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Surat Masuk" value={suratMasuk.length} accent="#1e3a8a" />
        <StatCard label="Total Surat Keluar" value={suratKeluar.length} accent="#1e3a8a" />
        <StatCard label="Belum Diproses" value={belumDiproses} accent="#dc2626" />
        <StatCard label="Selesai" value={selesai} accent="#16a34a" />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-[#111827]">Aktivitas Terbaru</h2>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs text-[#6b7280]">
              <tr>
                <th className="px-4 py-2.5">Jenis</th>
                <th className="px-4 py-2.5">Nomor Surat</th>
                <th className="px-4 py-2.5">Perihal</th>
                <th className="px-4 py-2.5">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {aktivitasTerbaru.map((s) => (
                <tr key={`${s.jenis}-${s.id}`} className="border-t border-gray-100 hover:bg-blue-50/40">
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        s.jenis === "Masuk"
                          ? "bg-[#1e3a8a]/10 text-[#1e3a8a]"
                          : "bg-[#f59e0b]/10 text-[#b45309]"
                      }`}
                    >
                      {s.jenis}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">{s.nomor_surat || "-"}</td>
                  <td className="px-4 py-2.5">{s.perihal || "-"}</td>
                  <td className="px-4 py-2.5 text-[#6b7280]">{s.tanggal || "-"}</td>
                </tr>
              ))}
              {aktivitasTerbaru.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-[#6b7280]">
                    Belum ada data surat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}