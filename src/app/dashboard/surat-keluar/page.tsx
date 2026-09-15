"use client";

import {
  ChangeEvent,
  useEffect,
  useState,
} from "react";

import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

type SuratKeluar = {
  id: string;
  nomor_surat: string;
  tanggal_kirim: string;
  tujuan: string;
  perihal: string;
  penandatangan: string;
  file_url?: string;
};

export default function SuratKeluarPage() {
  const [daftarSurat, setDaftarSurat] = useState<
    SuratKeluar[]
  >([]);

  const [pencarian, setPencarian] = useState("");
  const [tanggalAwal, setTanggalAwal] = useState("");
  const [tanggalAkhir, setTanggalAkhir] = useState("");

  // =========================
  // AMBIL DATA FIRESTORE
  // =========================
  useEffect(() => {
    const q = query(
      collection(db, "surat_keluar"),
      orderBy("created_at", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: SuratKeluar[] = snapshot.docs.map(
          (d) => {
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
              file_url: firestoreData.file_url
                ? String(firestoreData.file_url)
                : "",
            };
          }
        );

        setDaftarSurat(data);
      },
      (error) => {
        console.error(
          "Gagal mengambil data surat keluar:",
          error
        );
      }
    );

    return () => unsubscribe();
  }, []);

  // =========================
  // FILTER PENCARIAN
  // =========================
  function cocokPencarian(
    surat: SuratKeluar
  ): boolean {
    const kata = pencarian
      .trim()
      .toLowerCase();

    if (!kata) {
      return true;
    }

    return (
      surat.nomor_surat
        .toLowerCase()
        .includes(kata) ||
      surat.perihal
        .toLowerCase()
        .includes(kata) ||
      surat.tujuan
        .toLowerCase()
        .includes(kata)
    );
  }

  // =========================
  // FILTER TANGGAL
  // =========================
  function cocokTanggal(
    surat: SuratKeluar
  ): boolean {
    const tanggal = surat.tanggal_kirim;

    if (!tanggalAwal && !tanggalAkhir) {
      return true;
    }

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

  // =========================
  // HASIL FILTER
  // =========================
  const hasilFilter: SuratKeluar[] =
    daftarSurat.filter(
      (surat: SuratKeluar) =>
        cocokPencarian(surat) &&
        cocokTanggal(surat)
    );

  // =========================
  // INPUT PENCARIAN
  // =========================
  function handlePencarian(
    e: ChangeEvent<HTMLInputElement>
  ) {
    setPencarian(e.target.value);
  }

  // =========================
  // TANGGAL AWAL
  // =========================
  function handleTanggalAwal(
    e: ChangeEvent<HTMLInputElement>
  ) {
    setTanggalAwal(e.target.value);
  }

  // =========================
  // TANGGAL AKHIR
  // =========================
  function handleTanggalAkhir(
    e: ChangeEvent<HTMLInputElement>
  ) {
    setTanggalAkhir(e.target.value);
  }

  // =========================
  // RESET FILTER
  // =========================
  function resetFilter() {
    setPencarian("");
    setTanggalAwal("");
    setTanggalAkhir("");
  }

  return (
    <div>
      {/* =========================
          HEADER
      ========================= */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-[#111827]">
            Surat Keluar
          </h1>

          <p className="text-sm text-[#6b7280] mt-1">
            Daftar surat yang dikirim oleh kantor
          </p>
        </div>
      </div>

      {/* =========================
          FILTER
      ========================= */}
      <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* PENCARIAN */}
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Pencarian
            </label>

            <input
              type="text"
              value={pencarian}
              onChange={handlePencarian}
              placeholder="Nomor surat, perihal, atau tujuan"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
            />
          </div>

          {/* TANGGAL AWAL */}
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Tanggal Awal
            </label>

            <input
              type="date"
              value={tanggalAwal}
              onChange={handleTanggalAwal}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
            />
          </div>

          {/* TANGGAL AKHIR */}
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Tanggal Akhir
            </label>

            <input
              type="date"
              value={tanggalAkhir}
              onChange={handleTanggalAkhir}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
            />
          </div>
        </div>

        {/* RESET */}
        {(pencarian ||
          tanggalAwal ||
          tanggalAkhir) && (
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={resetFilter}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-[#111827] hover:bg-gray-50 transition"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* =========================
          INFORMASI JUMLAH DATA
      ========================= */}
      <div className="mb-3">
        <p className="text-xs text-[#6b7280]">
          Menampilkan{" "}
          <span className="font-medium text-[#111827]">
            {hasilFilter.length}
          </span>{" "}
          dari{" "}
          <span className="font-medium text-[#111827]">
            {daftarSurat.length}
          </span>{" "}
          surat
        </p>
      </div>

      {/* =========================
          TABEL SURAT
      ========================= */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">

            {/* HEADER TABEL */}
            <thead>
              <tr className="bg-gray-50 text-left text-[#6b7280]">

                <th className="px-4 py-3 font-medium">
                  Nomor Surat
                </th>

                <th className="px-4 py-3 font-medium">
                  Tanggal Kirim
                </th>

                <th className="px-4 py-3 font-medium">
                  Tujuan
                </th>

                <th className="px-4 py-3 font-medium">
                  Perihal
                </th>

                <th className="px-4 py-3 font-medium">
                  Penandatangan
                </th>

                <th className="px-4 py-3 font-medium">
                  File
                </th>

              </tr>
            </thead>

            {/* ISI TABEL */}
            <tbody>

              {hasilFilter.length === 0 ? (

                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-[#6b7280]"
                  >
                    {daftarSurat.length === 0
                      ? "Belum ada surat keluar yang tercatat."
                      : "Tidak ada surat yang sesuai dengan pencarian atau filter tanggal."}
                  </td>
                </tr>

              ) : (

                hasilFilter.map(
                  (surat: SuratKeluar) => (
                    <tr
                      key={surat.id}
                      className="border-t border-gray-100 hover:bg-gray-50 transition"
                    >

                      {/* NOMOR SURAT */}
                      <td className="px-4 py-3 text-[#111827]">
                        {surat.nomor_surat}
                      </td>

                      {/* TANGGAL */}
                      <td className="px-4 py-3 text-[#111827]">
                        {surat.tanggal_kirim}
                      </td>

                      {/* TUJUAN */}
                      <td className="px-4 py-3 text-[#111827]">
                        {surat.tujuan}
                      </td>

                      {/* PERIHAL */}
                      <td className="px-4 py-3 text-[#111827]">
                        {surat.perihal}
                      </td>

                      {/* PENANDATANGAN */}
                      <td className="px-4 py-3 text-[#111827]">
                        {surat.penandatangan}
                      </td>

                      {/* FILE */}
                      <td className="px-4 py-3">

                        {surat.file_url ? (

                          <a
                            href={surat.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-md bg-[#1e3a8a] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1e3a8a]/90 transition"
                          >
                            Lihat Surat
                          </a>

                        ) : (

                          <span className="text-[#9ca3af]">
                            Tidak ada file
                          </span>

                        )}

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