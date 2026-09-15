"use client";

// app/admin/laporan/page.js
// Halaman Laporan (Admin): filter periode + jenis surat, lalu export Excel/PDF.
// Ambil data dari koleksi surat_masuk & surat_keluar, filter di client berdasarkan tanggal.

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const JENIS_OPTIONS = [
  { value: "semua", label: "Semua Surat" },
  { value: "masuk", label: "Surat Masuk" },
  { value: "keluar", label: "Surat Keluar" },
];

export default function LaporanPage() {
  const [suratMasuk, setSuratMasuk] = useState([]);
  const [suratKeluar, setSuratKeluar] = useState([]);

  const [jenis, setJenis] = useState("semua");
  const [tanggalAwal, setTanggalAwal] = useState("");
  const [tanggalAkhir, setTanggalAkhir] = useState("");

  useEffect(() => {
    const unsub1 = onSnapshot(
      query(collection(db, "surat_masuk"), orderBy("tanggal_terima", "desc")),
      (snap) => setSuratMasuk(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsub2 = onSnapshot(
      query(collection(db, "surat_keluar"), orderBy("tanggal_kirim", "desc")),
      (snap) => setSuratKeluar(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  function dalamRentang(tanggal) {
    if (!tanggal) return false;
    if (tanggalAwal && tanggal < tanggalAwal) return false;
    if (tanggalAkhir && tanggal > tanggalAkhir) return false;
    return true;
  }

  // Gabungkan jadi satu bentuk baris laporan yang seragam
  const barisMasuk = suratMasuk
    .filter((s) => dalamRentang(s.tanggal_terima))
    .map((s) => ({
      jenis: "Surat Masuk",
      nomor_surat: s.nomor_surat,
      tanggal: s.tanggal_terima,
      relasi: s.pengirim, // pengirim untuk surat masuk
      perihal: s.perihal,
      keterangan: s.sifat_surat || "-",
    }));

  const barisKeluar = suratKeluar
    .filter((s) => dalamRentang(s.tanggal_kirim))
    .map((s) => ({
      jenis: "Surat Keluar",
      nomor_surat: s.nomor_surat,
      tanggal: s.tanggal_kirim,
      relasi: s.tujuan, // tujuan untuk surat keluar
      perihal: s.perihal,
      keterangan: s.penandatangan || "-",
    }));

  let dataLaporan = [];
  if (jenis === "masuk") dataLaporan = barisMasuk;
  else if (jenis === "keluar") dataLaporan = barisKeluar;
  else dataLaporan = [...barisMasuk, ...barisKeluar];

  dataLaporan.sort((a, b) => (b.tanggal || "").localeCompare(a.tanggal || ""));

  const adaFilterTanggal = tanggalAwal || tanggalAkhir;
  const bisaExport = dataLaporan.length > 0;

  function namaFileLaporan(ekstensi) {
    const bagianPeriode =
      tanggalAwal || tanggalAkhir
        ? `_${tanggalAwal || "awal"}_sd_${tanggalAkhir || "akhir"}`
        : "_semua-periode";
    return `laporan-surat${bagianPeriode}.${ekstensi}`;
  }

  function handleExportExcel() {
    const dataSheet = dataLaporan.map((row, i) => ({
      No: i + 1,
      Jenis: row.jenis,
      "Nomor Surat": row.nomor_surat,
      Tanggal: row.tanggal,
      "Pengirim / Tujuan": row.relasi,
      Perihal: row.perihal,
      Keterangan: row.keterangan,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataSheet);
    worksheet["!cols"] = [
      { wch: 5 },
      { wch: 14 },
      { wch: 20 },
      { wch: 12 },
      { wch: 25 },
      { wch: 35 },
      { wch: 18 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Surat");
    XLSX.writeFile(workbook, namaFileLaporan("xlsx"));
  }

  function handleExportPDF() {
    const docPdf = new jsPDF({ orientation: "landscape" });

    docPdf.setFontSize(13);
    docPdf.text("Laporan Surat Masuk & Surat Keluar", 14, 15);
    docPdf.setFontSize(9);
    docPdf.setTextColor(107, 114, 128);
    docPdf.text("DPMPTSP Kota Baubau", 14, 21);

    const periodeText =
      tanggalAwal || tanggalAkhir
        ? `Periode: ${tanggalAwal || "-"} s/d ${tanggalAkhir || "-"}`
        : "Periode: Semua Data";
    docPdf.text(periodeText, 14, 26);

    autoTable(docPdf, {
      startY: 32,
      head: [["No", "Jenis", "Nomor Surat", "Tanggal", "Pengirim/Tujuan", "Perihal", "Keterangan"]],
      body: dataLaporan.map((row, i) => [
        i + 1,
        row.jenis,
        row.nomor_surat,
        row.tanggal,
        row.relasi,
        row.perihal,
        row.keterangan,
      ]),
      headStyles: { fillColor: [30, 58, 138] }, // #1e3a8a
      styles: { fontSize: 8 },
    });

    docPdf.save(namaFileLaporan("pdf"));
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[#111827]">Laporan</h1>
        <p className="text-sm text-[#6b7280] mt-1">
          Filter data surat berdasarkan periode, lalu export ke Excel atau PDF.
        </p>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-1">
            Jenis Surat
          </label>
          <select
            value={jenis}
            onChange={(e) => setJenis(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
          >
            {JENIS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#111827] mb-1">
            Dari Tanggal
          </label>
          <input
            type="date"
            value={tanggalAwal}
            onChange={(e) => setTanggalAwal(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#111827] mb-1">
            Sampai Tanggal
          </label>
          <input
            type="date"
            value={tanggalAkhir}
            onChange={(e) => setTanggalAkhir(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExportExcel}
            disabled={!bisaExport}
            className="flex-1 rounded-lg border border-[#16a34a] text-[#16a34a] text-sm font-medium px-4 py-2 hover:bg-green-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Export Excel
          </button>
          <button
            onClick={handleExportPDF}
            disabled={!bisaExport}
            className="flex-1 rounded-lg border border-[#dc2626] text-[#dc2626] text-sm font-medium px-4 py-2 hover:bg-red-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Export PDF
          </button>
        </div>
      </div>

      {adaFilterTanggal && (
        <p className="text-xs text-[#6b7280] mb-3">
          Menampilkan {dataLaporan.length} surat
          {tanggalAwal ? ` dari ${tanggalAwal}` : ""}
          {tanggalAkhir ? ` sampai ${tanggalAkhir}` : ""}.
        </p>
      )}

      {/* Preview tabel */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-[#6b7280]">
              <th className="px-4 py-3 font-medium">Jenis</th>
              <th className="px-4 py-3 font-medium">Nomor Surat</th>
              <th className="px-4 py-3 font-medium">Tanggal</th>
              <th className="px-4 py-3 font-medium">Pengirim / Tujuan</th>
              <th className="px-4 py-3 font-medium">Perihal</th>
              <th className="px-4 py-3 font-medium">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {dataLaporan.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-[#6b7280]">
                  Tidak ada data untuk filter yang dipilih.
                </td>
              </tr>
            ) : (
              dataLaporan.map((row, i) => (
                <tr
                  key={`${row.jenis}-${row.nomor_surat}-${i}`}
                  className="border-t border-gray-100 hover:bg-[#f3f4f6]/60 transition"
                >
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-lg px-2 py-1 text-xs font-medium ${
                        row.jenis === "Surat Masuk"
                          ? "bg-[#1e3a8a]/10 text-[#1e3a8a]"
                          : "bg-[#f59e0b]/10 text-[#b45309]"
                      }`}
                    >
                      {row.jenis}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#111827]">{row.nomor_surat}</td>
                  <td className="px-4 py-3 text-[#111827]">{row.tanggal}</td>
                  <td className="px-4 py-3 text-[#111827]">{row.relasi}</td>
                  <td className="px-4 py-3 text-[#111827]">{row.perihal}</td>
                  <td className="px-4 py-3 text-[#111827]">{row.keterangan}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}