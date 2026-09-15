"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Surat = {
  id: string;
  nomor_surat?: string;
  perihal?: string;
  status?: string;
  tanggal_terima?: string;
  tanggal_kirim?: string;
};

export default function UserDashboardPage() {
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

  return (
    <div className="px-6 py-8 sm:px-8">
      <h1 className="text-xl font-semibold text-[#111827]">Dashboard</h1>
      <p className="mt-1 text-sm text-[#6b7280]">Ringkasan surat masuk dan surat keluar (tampilan baca saja).</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-xs font-medium text-[#6b7280]">Surat Masuk</p>
          <p className="mt-2 text-2xl font-semibold text-[#1e3a8a]">{suratMasuk.length}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-xs font-medium text-[#6b7280]">Surat Keluar</p>
          <p className="mt-2 text-2xl font-semibold text-[#1e3a8a]">{suratKeluar.length}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-xs font-medium text-[#6b7280]">Diproses</p>
          <p className="mt-2 text-2xl font-semibold text-[#ca8a04]">{diproses}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-xs font-medium text-[#6b7280]">Selesai</p>
          <p className="mt-2 text-2xl font-semibold text-[#16a34a]">{selesai}</p>
        </div>
      </div>

      <div className="mt-6 rounded-lg bg-[#f59e0b]/10 px-4 py-3 text-sm text-[#b45309]">
        Belum Diproses: <strong>{belumDiproses}</strong> surat menunggu tindak lanjut.
      </div>
    </div>
  );
}