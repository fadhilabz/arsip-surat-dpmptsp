"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import {
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

import { db, storage } from "@/lib/firebase";

const SIFAT_OPTIONS = [
  "Biasa",
  "Penting",
  "Rahasia",
];

type SuratMasuk = {
  id: string;
  nomor_surat: string;
  tanggal_terima: string;
  pengirim: string;
  perihal: string;
  sifat_surat: string;
  status: string;
  file_url?: string;
};

type FormSurat = {
  nomor_surat: string;
  tanggal_terima: string;
  pengirim: string;
  perihal: string;
  sifat_surat: string;
  file: File | null;
};

type DataUpdate = {
  nomor_surat: string;
  tanggal_terima: string;
  pengirim: string;
  perihal: string;
  sifat_surat: string;
  file_url?: string;
};

const FORM_KOSONG: FormSurat = {
  nomor_surat: "",
  tanggal_terima: "",
  pengirim: "",
  perihal: "",
  sifat_surat: "Biasa",
  file: null,
};

export default function SuratMasukPage() {
  const [daftarSurat, setDaftarSurat] =
    useState<SuratMasuk[]>([]);

  const [showForm, setShowForm] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<FormSurat>(FORM_KOSONG);

  // Ambil data realtime dari Firestore
  useEffect(() => {
    const q = query(
      collection(db, "surat_masuk"),
      orderBy("created_at", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: SuratMasuk[] =
          snapshot.docs.map((d) => {
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
                firestoreData.sifat_surat ?? "Biasa"
              ),

              status: String(
                firestoreData.status ??
                  "belum_diproses"
              ),

              file_url: firestoreData.file_url
                ? String(firestoreData.file_url)
                : "",
            };
          });

        setDaftarSurat(data);
      },
      (error) => {
        console.error(
          "Gagal mengambil data surat masuk:",
          error
        );
      }
    );

    return () => unsubscribe();
  }, []);

  function handleChange(
    e: ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleFileChange(
    e: ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0] ?? null;

    setForm((prev) => ({
      ...prev,
      file,
    }));
  }

  function handleTambahBaru() {
    setEditingId(null);
    setForm(FORM_KOSONG);
    setShowForm(true);
  }

  function handleEditClick(
    surat: SuratMasuk
  ) {
    setEditingId(surat.id);

    setForm({
      nomor_surat: surat.nomor_surat,
      tanggal_terima: surat.tanggal_terima,
      pengirim: surat.pengirim,
      perihal: surat.perihal,
      sifat_surat: surat.sifat_surat,
      file: null,
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleDelete(
    id: string,
    nomorSurat: string
  ) {
    const yakin = window.confirm(
      `Hapus surat nomor "${nomorSurat}"? Tindakan ini tidak bisa dibatalkan.`
    );

    if (!yakin) {
      return;
    }

    try {
      await deleteDoc(
        doc(db, "surat_masuk", id)
      );
    } catch (err) {
      console.error(
        "Gagal menghapus surat:",
        err
      );

      alert(
        "Gagal menghapus surat. Silakan coba lagi."
      );
    }
  }

  async function handleToggleStatus(
    surat: SuratMasuk
  ) {
    const statusBaru =
      surat.status === "selesai"
        ? "belum_diproses"
        : "selesai";

    try {
      await updateDoc(
        doc(db, "surat_masuk", surat.id),
        {
          status: statusBaru,
        }
      );
    } catch (err) {
      console.error(
        "Gagal mengubah status:",
        err
      );

      alert(
        "Gagal mengubah status. Silakan coba lagi."
      );
    }
  }

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setSaving(true);

    try {
      let file_url = "";

      // Upload file baru jika admin memilih file
      if (form.file) {
        const fileRef = ref(
          storage,
          `surat_masuk/${Date.now()}_${form.file.name}`
        );

        await uploadBytes(
          fileRef,
          form.file
        );

        file_url =
          await getDownloadURL(fileRef);
      }

      if (editingId) {
        // =========================
        // MODE EDIT
        // =========================

        const dataUpdate: DataUpdate = {
          nomor_surat:
            form.nomor_surat,

          tanggal_terima:
            form.tanggal_terima,

          pengirim:
            form.pengirim,

          perihal:
            form.perihal,

          sifat_surat:
            form.sifat_surat,
        };

        // Hanya update file jika
        // admin memilih file baru
        if (file_url) {
          dataUpdate.file_url =
            file_url;
        }

        await updateDoc(
          doc(
            db,
            "surat_masuk",
            editingId
          ),
          dataUpdate
        );
      } else {
        // =========================
        // MODE TAMBAH BARU
        // =========================

        await addDoc(
          collection(
            db,
            "surat_masuk"
          ),
          {
            nomor_surat:
              form.nomor_surat,

            tanggal_terima:
              form.tanggal_terima,

            pengirim:
              form.pengirim,

            perihal:
              form.perihal,

            sifat_surat:
              form.sifat_surat,

            file_url:
              file_url || "",

            status:
              "belum_diproses",

            created_at:
              serverTimestamp(),
          }
        );
      }

      setForm(FORM_KOSONG);
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      console.error(
        "Gagal menyimpan surat:",
        err
      );

      alert(
        "Gagal menyimpan surat. Silakan coba lagi."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleBatal() {
    setForm(FORM_KOSONG);
    setEditingId(null);
    setShowForm(false);
  }

  return (
    <div>
      {/* =========================
          HEADER
      ========================== */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-[#111827]">
            Surat Masuk
          </h1>

          <p className="text-sm text-[#6b7280] mt-1">
            Daftar surat yang diterima kantor
          </p>
        </div>

        {!showForm && (
          <button
            type="button"
            onClick={handleTambahBaru}
            className="rounded-lg bg-[#1e3a8a] text-white text-sm font-medium px-4 py-2 hover:bg-[#1e3a8a]/90 transition"
          >
            + Tambah Surat
          </button>
        )}
      </div>

      {/* =========================
          FORM
      ========================== */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-sm p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <p className="md:col-span-2 text-sm font-medium text-[#111827]">
            {editingId
              ? "Edit Surat"
              : "Tambah Surat Baru"}
          </p>

          {/* Nomor Surat */}
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Nomor Surat
            </label>

            <input
              type="text"
              name="nomor_surat"
              required
              value={form.nomor_surat}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
            />
          </div>

          {/* Tanggal Terima */}
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Tanggal Terima
            </label>

            <input
              type="date"
              name="tanggal_terima"
              required
              value={form.tanggal_terima}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
            />
          </div>

          {/* Pengirim */}
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Pengirim / Instansi Asal
            </label>

            <input
              type="text"
              name="pengirim"
              required
              value={form.pengirim}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
            />
          </div>

          {/* Sifat Surat */}
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Sifat Surat
            </label>

            <select
              name="sifat_surat"
              value={form.sifat_surat}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
            >
              {SIFAT_OPTIONS.map(
                (opt) => (
                  <option
                    key={opt}
                    value={opt}
                  >
                    {opt}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Perihal */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Perihal
            </label>

            <input
              type="text"
              name="perihal"
              required
              value={form.perihal}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
            />
          </div>

          {/* File */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#111827] mb-1">
              File Scan Surat{" "}
              {editingId &&
                " (kosongkan jika tidak diganti)"}
            </label>

            <input
              type="file"
              onChange={handleFileChange}
              className="text-sm"
            />
          </div>

          {/* Tombol */}
          <div className="md:col-span-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleBatal}
              className="rounded-lg border border-gray-300 text-[#111827] text-sm font-medium px-4 py-2 hover:bg-[#f3f4f6] transition"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#1e3a8a] text-white text-sm font-medium px-4 py-2 hover:bg-[#1e3a8a]/90 transition disabled:opacity-60"
            >
              {saving
                ? "Menyimpan..."
                : editingId
                ? "Simpan Perubahan"
                : "Simpan Surat"}
            </button>
          </div>
        </form>
      )}

      {/* =========================
          TABEL
      ========================== */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-[#6b7280]">
                <th className="px-4 py-3 font-medium">
                  Nomor Surat
                </th>

                <th className="px-4 py-3 font-medium">
                  Tanggal Terima
                </th>

                <th className="px-4 py-3 font-medium">
                  Pengirim
                </th>

                <th className="px-4 py-3 font-medium">
                  Perihal
                </th>

                <th className="px-4 py-3 font-medium">
                  Sifat
                </th>

                <th className="px-4 py-3 font-medium">
                  Status
                </th>

                <th className="px-4 py-3 font-medium">
                  File
                </th>

                <th className="px-4 py-3 font-medium">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {daftarSurat.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-6 text-center text-[#6b7280]"
                  >
                    Belum ada surat masuk
                    yang tercatat.
                  </td>
                </tr>
              ) : (
                daftarSurat.map(
                  (surat) => (
                    <tr
                      key={surat.id}
                      className="border-t border-gray-100 hover:bg-[#f3f4f6]/60 transition"
                    >
                      {/* Nomor */}
                      <td className="px-4 py-3 text-[#111827]">
                        {surat.nomor_surat}
                      </td>

                      {/* Tanggal */}
                      <td className="px-4 py-3 text-[#111827]">
                        {surat.tanggal_terima}
                      </td>

                      {/* Pengirim */}
                      <td className="px-4 py-3 text-[#111827]">
                        {surat.pengirim}
                      </td>

                      {/* Perihal */}
                      <td className="px-4 py-3 text-[#111827]">
                        {surat.perihal}
                      </td>

                      {/* Sifat */}
                      <td className="px-4 py-3 text-[#111827]">
                        {surat.sifat_surat}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleStatus(
                              surat
                            )
                          }
                          className={`inline-block rounded-lg px-2 py-1 text-xs font-medium transition ${
                            surat.status ===
                            "selesai"
                              ? "bg-green-50 text-[#16a34a] hover:bg-green-100"
                              : "bg-yellow-50 text-[#ca8a04] hover:bg-yellow-100"
                          }`}
                          title="Klik untuk ubah status"
                        >
                          {surat.status ===
                          "selesai"
                            ? "Selesai"
                            : "Belum Diproses"}
                        </button>
                      </td>

                      {/* File */}
                      <td className="px-4 py-3">
                        {surat.file_url ? (
                          <a
                            href={
                              surat.file_url
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#1e3a8a] hover:underline"
                          >
                            Lihat
                          </a>
                        ) : (
                          <span className="text-[#6b7280]">
                            -
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              handleEditClick(
                                surat
                              )
                            }
                            className="text-[#1e3a8a] hover:underline"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                surat.id,
                                surat.nomor_surat
                              )
                            }
                            className="text-[#dc2626] hover:underline"
                          >
                            Hapus
                          </button>
                        </div>
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