"use client";

// app/dashboard/surat-keluar/page.js
// Halaman Surat Keluar untuk Petugas (User): read-only + cari/filter.

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function SuratKeluarUserPage() {
  const [daftarSurat, setDaftarSurat] = useState([]);
  const [pencarian, setPencarian] = useState("");
  const [tanggalAwal, setTanggalAwal] = useState("");
  const [tanggalAkhir, setTanggalAkhir] = useState("");

  useEffect(() => {
    const q = query(collection(db, "surat_keluar"), orderBy("created_at", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDaftarSurat(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  function cocokPencarian(surat) {
    if (!pencarian.trim()) return true;
    const kata = pencarian.toLowerCase();
    return (
      surat.nomor_surat?.toLowerCase().includes(kata) ||
      surat.perihal?.toLowerCase().includes(kata) ||
      surat.tujuan?.toLowerCase().includes(kata)
    );
  }

  function cocokTanggal(surat) {
    if (!tanggalAwal && !tanggalAkhir) return true;
    const t = surat.tanggal_kirim;
    if (!t) return false;
    if (tanggalAwal && t < tanggalAwal) return false;
    if (tanggalAkhir && t > tanggalAkhir) return false;
    return true;
  }

  const hasilFilter = daftarSurat.filter((s) => cocokPencarian(s) && cocokTanggal(s));

  return (
    <div className="px-6 py-8 sm:px-8">
      <h1 className="text-lg font-semibold text-[#111827]">Surat Keluar</h1>
      <p className="text-sm text-[#6b7280] mt-1 mb-6">
        Daftar surat yang dikirim oleh kantor (tampilan baca saja)
      </p>

      <div className="bg-white rounded-lg shadow-sm p-5 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-1">Cari</label>
          <input
            type="text"
            placeholder="Nomor surat, perihal, atau tujuan"
            value={pencarian}
            onChange={(e) => setPencarian(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-1">Dari Tanggal</label>
          <input
            type="date"
            value={tanggalAwal}
            onChange={(e) => setTanggalAwal(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-1">Sampai Tanggal</label>
          <input
            type="date"
            value={tanggalAkhir}
            onChange={(e) => setTanggalAkhir(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
          />
        </div>
      </div>

      <p className="text-xs text-[#6b7280] mb-3">
        Menampilkan {hasilFilter.length} dari {daftarSurat.length} surat
      </p>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-[#6b7280]">
              <th className="px-4 py-3 font-medium">Nomor Surat</th>
              <th className="px-4 py-3 font-medium">Tanggal Kirim</th>
              <th className="px-4 py-3 font-medium">Tujuan</th>
              <th className="px-4 py-3 font-medium">Perihal</th>
              <th className="px-4 py-3 font-medium">Penandatangan</th>
              <th className="px-4 py-3 font-medium">File</th>
            </tr>
          </thead>
          <tbody>
            {hasilFilter.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-[#6b7280]">
                  Tidak ada surat yang cocok.
                </td>
              </tr>
            ) : (
              hasilFilter.map((surat) => (
                <tr key={surat.id} className="border-t border-gray-100 hover:bg-[#f3f4f6]/60 transition">
                  <td className="px-4 py-3 text-[#111827]">{surat.nomor_surat}</td>
                  <td className="px-4 py-3 text-[#111827]">{surat.tanggal_kirim}</td>
                  <td className="px-4 py-3 text-[#111827]">{surat.tujuan}</td>
                  <td className="px-4 py-3 text-[#111827]">{surat.perihal}</td>
                  <td className="px-4 py-3 text-[#111827]">{surat.penandatangan}</td>
                  <td className="px-4 py-3">
                    {surat.file_url ? (
                      <a
                        href={surat.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1e3a8a] hover:underline"
                      >
                        Lihat
                      </a>
                    ) : (
                      <span className="text-[#6b7280]">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}