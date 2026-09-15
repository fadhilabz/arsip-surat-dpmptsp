"use client";

// Halaman Laporan (Admin):
// filter periode + jenis surat,
// lalu export Excel/PDF.

import { useEffect, useState } from "react";

import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import * as XLSX from "xlsx";

import jsPDF from "jspdf";

import autoTable from "jspdf-autotable";

const JENIS_OPTIONS = [
  {
    value: "semua",
    label: "Semua Surat",
  },
  {
    value: "masuk",
    label: "Surat Masuk",
  },
  {
    value: "keluar",
    label: "Surat Keluar",
  },
];

type SuratMasuk = {
  id: string;
  nomor_surat: string;
  tanggal_terima: string;
  pengirim: string;
  perihal: string;
  sifat_surat: string;
};

type SuratKeluar = {
  id: string;
  nomor_surat: string;
  tanggal_kirim: string;
  tujuan: string;
  perihal: string;
  penandatangan: string;
};

type BarisLaporan = {
  jenis: string;
  nomor_surat: string;
  tanggal: string;
  relasi: string;
  perihal: string;
  keterangan: string;
};

export default function LaporanPage() {
  const [suratMasuk, setSuratMasuk] =
    useState<SuratMasuk[]>([]);

  const [suratKeluar, setSuratKeluar] =
    useState<SuratKeluar[]>([]);

  const [jenis, setJenis] =
    useState("semua");

  const [tanggalAwal, setTanggalAwal] =
    useState("");

  const [tanggalAkhir, setTanggalAkhir] =
    useState("");

  useEffect(() => {
    // ==============================
    // SURAT MASUK
    // ==============================

    const unsub1 = onSnapshot(
      query(
        collection(db, "surat_masuk"),
        orderBy("tanggal_terima", "desc")
      ),
      (snap) => {
        const data: SuratMasuk[] =
          snap.docs.map((d) => {
            const firestoreData = d.data();

            return {
              id: d.id,

              nomor_surat: String(
                firestoreData.nomor_surat ?? ""
              ),

              tanggal_terima: String(
                firestoreData.tanggal_terima ?? ""
              ),

              pengirim: String(
                firestoreData.pengirim ?? ""
              ),

              perihal: String(
                firestoreData.perihal ?? ""
              ),

              sifat_surat: String(
                firestoreData.sifat_surat ?? ""
              ),
            };
          });

        setSuratMasuk(data);
      },
      (error) => {
        console.error(
          "Gagal mengambil surat masuk:",
          error
        );
      }
    );

    // ==============================
    // SURAT KELUAR
    // ==============================

    const unsub2 = onSnapshot(
      query(
        collection(db, "surat_keluar"),
        orderBy("tanggal_kirim", "desc")
      ),
      (snap) => {
        const data: SuratKeluar[] =
          snap.docs.map((d) => {
            const firestoreData = d.data();

            return {
              id: d.id,

              nomor_surat: String(
                firestoreData.nomor_surat ?? ""
              ),

              tanggal_kirim: String(
                firestoreData.tanggal_kirim ?? ""
              ),

              tujuan: String(
                firestoreData.tujuan ?? ""
              ),

              perihal: String(
                firestoreData.perihal ?? ""
              ),

              penandatangan: String(
                firestoreData.penandatangan ?? ""
              ),
            };
          });

        setSuratKeluar(data);
      },
      (error) => {
        console.error(
          "Gagal mengambil surat keluar:",
          error
        );
      }
    );

    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  // ==============================
  // FILTER TANGGAL
  // ==============================

  function dalamRentang(
    tanggal: string
  ): boolean {
    if (!tanggal) {
      return false;
    }

    if (
      tanggalAwal &&
      tanggal < tanggalAwal
    ) {
      return false;
    }

    if (
      tanggalAkhir &&
      tanggal > tanggalAkhir
    ) {
      return false;
    }

    return true;
  }

  // ==============================
  // DATA SURAT MASUK
  // ==============================

  const barisMasuk: BarisLaporan[] =
    suratMasuk
      .filter((s: SuratMasuk) =>
        dalamRentang(s.tanggal_terima)
      )
      .map(
        (s: SuratMasuk): BarisLaporan => ({
          jenis: "Surat Masuk",

          nomor_surat:
            s.nomor_surat,

          tanggal:
            s.tanggal_terima,

          relasi:
            s.pengirim,

          perihal:
            s.perihal,

          keterangan:
            s.sifat_surat || "-",
        })
      );

  // ==============================
  // DATA SURAT KELUAR
  // ==============================

  const barisKeluar: BarisLaporan[] =
    suratKeluar
      .filter((s: SuratKeluar) =>
        dalamRentang(s.tanggal_kirim)
      )
      .map(
        (s: SuratKeluar): BarisLaporan => ({
          jenis: "Surat Keluar",

          nomor_surat:
            s.nomor_surat,

          tanggal:
            s.tanggal_kirim,

          relasi:
            s.tujuan,

          perihal:
            s.perihal,

          keterangan:
            s.penandatangan || "-",
        })
      );

  // ==============================
  // GABUNGKAN DATA LAPORAN
  // ==============================

  let dataLaporan: BarisLaporan[] = [];

  if (jenis === "masuk") {
    dataLaporan = barisMasuk;
  } else if (jenis === "keluar") {
    dataLaporan = barisKeluar;
  } else {
    dataLaporan = [
      ...barisMasuk,
      ...barisKeluar,
    ];
  }

  dataLaporan.sort(
    (
      a: BarisLaporan,
      b: BarisLaporan
    ) =>
      (b.tanggal || "").localeCompare(
        a.tanggal || ""
      )
  );

  const adaFilterTanggal =
    Boolean(tanggalAwal) ||
    Boolean(tanggalAkhir);

  const bisaExport =
    dataLaporan.length > 0;

  // ==============================
  // NAMA FILE
  // ==============================

  function namaFileLaporan(
    ekstensi: string
  ): string {
    const bagianPeriode =
      tanggalAwal || tanggalAkhir
        ? `_${tanggalAwal || "awal"}_sd_${
            tanggalAkhir || "akhir"
          }`
        : "_semua-periode";

    return `laporan-surat${bagianPeriode}.${ekstensi}`;
  }

  // ==============================
  // EXPORT EXCEL
  // ==============================

  function handleExportExcel() {
    const dataSheet =
      dataLaporan.map(
        (
          row: BarisLaporan,
          i: number
        ) => ({
          No: i + 1,

          Jenis:
            row.jenis,

          "Nomor Surat":
            row.nomor_surat,

          Tanggal:
            row.tanggal,

          "Pengirim / Tujuan":
            row.relasi,

          Perihal:
            row.perihal,

          Keterangan:
            row.keterangan,
        })
      );

    const worksheet =
      XLSX.utils.json_to_sheet(
        dataSheet
      );

    worksheet["!cols"] = [
      { wch: 5 },
      { wch: 14 },
      { wch: 20 },
      { wch: 12 },
      { wch: 25 },
      { wch: 35 },
      { wch: 18 },
    ];

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Laporan Surat"
    );

    XLSX.writeFile(
      workbook,
      namaFileLaporan("xlsx")
    );
  }

  // ==============================
  // EXPORT PDF
  // ==============================

  function handleExportPDF() {
    const docPdf = new jsPDF({
      orientation: "landscape",
    });

    docPdf.setFontSize(13);

    docPdf.text(
      "Laporan Surat Masuk & Surat Keluar",
      14,
      15
    );

    docPdf.setFontSize(9);

    docPdf.setTextColor(
      107,
      114,
      128
    );

    docPdf.text(
      "DPMPTSP Kota Baubau",
      14,
      21
    );

    const periodeText =
      tanggalAwal || tanggalAkhir
        ? `Periode: ${
            tanggalAwal || "-"
          } s/d ${
            tanggalAkhir || "-"
          }`
        : "Periode: Semua Data";

    docPdf.text(
      periodeText,
      14,
      26
    );

    autoTable(docPdf, {
      startY: 32,

      head: [
        [
          "No",
          "Jenis",
          "Nomor Surat",
          "Tanggal",
          "Pengirim/Tujuan",
          "Perihal",
          "Keterangan",
        ],
      ],

      body: dataLaporan.map(
        (
          row: BarisLaporan,
          i: number
        ) => [
          i + 1,
          row.jenis,
          row.nomor_surat,
          row.tanggal,
          row.relasi,
          row.perihal,
          row.keterangan,
        ]
      ),

      headStyles: {
        fillColor: [
          30,
          58,
          138,
        ],
      },

      styles: {
        fontSize: 8,
      },
    });

    docPdf.save(
      namaFileLaporan("pdf")
    );
  }

  return (
    <div>
      {/* ==============================
          HEADER
      ============================== */}

      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[#111827]">
          Laporan
        </h1>

        <p className="text-sm text-[#6b7280] mt-1">
          Filter data surat berdasarkan
          periode, lalu export ke Excel
          atau PDF.
        </p>
      </div>

      {/* ==============================
          FILTER
      ============================== */}

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        {/* Jenis Surat */}

        <div>
          <label className="block text-sm font-medium text-[#111827] mb-1">
            Jenis Surat
          </label>

          <select
            value={jenis}
            onChange={(e) =>
              setJenis(e.target.value)
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
          >
            {JENIS_OPTIONS.map(
              (opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                >
                  {opt.label}
                </option>
              )
            )}
          </select>
        </div>

        {/* Dari Tanggal */}

        <div>
          <label className="block text-sm font-medium text-[#111827] mb-1">
            Dari Tanggal
          </label>

          <input
            type="date"
            value={tanggalAwal}
            onChange={(e) =>
              setTanggalAwal(
                e.target.value
              )
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
          />
        </div>

        {/* Sampai Tanggal */}

        <div>
          <label className="block text-sm font-medium text-[#111827] mb-1">
            Sampai Tanggal
          </label>

          <input
            type="date"
            value={tanggalAkhir}
            onChange={(e) =>
              setTanggalAkhir(
                e.target.value
              )
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
          />
        </div>

        {/* Tombol Export */}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={
              handleExportExcel
            }
            disabled={!bisaExport}
            className="flex-1 rounded-lg border border-[#16a34a] text-[#16a34a] text-sm font-medium px-4 py-2 hover:bg-green-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Export Excel
          </button>

          <button
            type="button"
            onClick={
              handleExportPDF
            }
            disabled={!bisaExport}
            className="flex-1 rounded-lg border border-[#dc2626] text-[#dc2626] text-sm font-medium px-4 py-2 hover:bg-red-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* ==============================
          INFO FILTER
      ============================== */}

      {adaFilterTanggal && (
        <p className="text-xs text-[#6b7280] mb-3">
          Menampilkan{" "}
          {dataLaporan.length} surat
          {tanggalAwal
            ? ` dari ${tanggalAwal}`
            : ""}
          {tanggalAkhir
            ? ` sampai ${tanggalAkhir}`
            : ""}
          .
        </p>
      )}

      {/* ==============================
          PREVIEW TABEL
      ============================== */}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-[#6b7280]">
                <th className="px-4 py-3 font-medium">
                  Jenis
                </th>

                <th className="px-4 py-3 font-medium">
                  Nomor Surat
                </th>

                <th className="px-4 py-3 font-medium">
                  Tanggal
                </th>

                <th className="px-4 py-3 font-medium">
                  Pengirim / Tujuan
                </th>

                <th className="px-4 py-3 font-medium">
                  Perihal
                </th>

                <th className="px-4 py-3 font-medium">
                  Keterangan
                </th>
              </tr>
            </thead>

            <tbody>
              {dataLaporan.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-[#6b7280]"
                  >
                    Tidak ada data
                    untuk filter yang
                    dipilih.
                  </td>
                </tr>
              ) : (
                dataLaporan.map(
                  (
                    row: BarisLaporan,
                    i: number
                  ) => (
                    <tr
                      key={`${row.jenis}-${row.nomor_surat}-${i}`}
                      className="border-t border-gray-100 hover:bg-[#f3f4f6]/60 transition"
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-lg px-2 py-1 text-xs font-medium ${
                            row.jenis ===
                            "Surat Masuk"
                              ? "bg-[#1e3a8a]/10 text-[#1e3a8a]"
                              : "bg-[#f59e0b]/10 text-[#b45309]"
                          }`}
                        >
                          {row.jenis}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-[#111827]">
                        {row.nomor_surat}
                      </td>

                      <td className="px-4 py-3 text-[#111827]">
                        {row.tanggal}
                      </td>

                      <td className="px-4 py-3 text-[#111827]">
                        {row.relasi}
                      </td>

                      <td className="px-4 py-3 text-[#111827]">
                        {row.perihal}
                      </td>

                      <td className="px-4 py-3 text-[#111827]">
                        {row.keterangan}
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}