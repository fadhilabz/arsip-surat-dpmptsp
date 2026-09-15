"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
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
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

type SuratKeluar = {
  id: string;
  nomor_surat: string;
  tanggal_kirim: string;
  tujuan: string;
  perihal: string;
  penandatangan: string;
  file_url?: string;
  created_at?: unknown;
};

type FormSurat = {
  nomor_surat: string;
  tanggal_kirim: string;
  tujuan: string;
  perihal: string;
  penandatangan: string;
  file: File | null;
};

const FORM_KOSONG: FormSurat = {
  nomor_surat: "",
  tanggal_kirim: "",
  tujuan: "",
  perihal: "",
  penandatangan: "",
  file: null,
};

export default function SuratKeluarPage() {
  const [daftarSurat, setDaftarSurat] = useState<SuratKeluar[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormSurat>(FORM_KOSONG);

  // Ambil data realtime dari Firestore
  useEffect(() => {
    const q = query(
      collection(db, "surat_keluar"),
      orderBy("created_at", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: SuratKeluar[] = snapshot.docs.map((d) => {
          const firestoreData = d.data();

          return {
            id: d.id,
            nomor_surat: String(firestoreData.nomor_surat ?? ""),
            tanggal_kirim: String(firestoreData.tanggal_kirim ?? ""),
            tujuan: String(firestoreData.tujuan ?? ""),
            perihal: String(firestoreData.perihal ?? ""),
            penandatangan: String(firestoreData.penandatangan ?? ""),
            file_url: firestoreData.file_url
              ? String(firestoreData.file_url)
              : "",
            created_at: firestoreData.created_at,
          };
        });

        setDaftarSurat(data);
      },
      (error) => {
        console.error("Gagal mengambil data surat keluar:", error);
        alert("Gagal mengambil data surat keluar.");
      }
    );

    return () => unsubscribe();
  }, []);

  function handleChange(
    e: ChangeEvent<HTMLInputElement>
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

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleEditClick(surat: SuratKeluar) {
    setEditingId(surat.id);

    setForm({
      nomor_surat: surat.nomor_surat,
      tanggal_kirim: surat.tanggal_kirim,
      tujuan: surat.tujuan,
      perihal: surat.perihal,
      penandatangan: surat.penandatangan,
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
      `Hapus surat nomor "${nomorSurat}"?\n\nTindakan ini tidak bisa dibatalkan.`
    );

    if (!yakin) return;

    try {
      await deleteDoc(doc(db, "surat_keluar", id));

      alert("Surat berhasil dihapus.");
    } catch (error) {
      console.error("Gagal menghapus surat:", error);
      alert("Gagal menghapus surat. Silakan coba lagi.");
    }
  }

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (saving) return;

    setSaving(true);

    try {
      let file_url = "";

      // Upload file baru jika dipilih
      if (form.file) {
        const fileRef = ref(
          storage,
          `surat_keluar/${Date.now()}_${form.file.name}`
        );

        await uploadBytes(fileRef, form.file);

        file_url = await getDownloadURL(fileRef);
      }

      if (editingId) {
        // MODE EDIT
        const dataUpdate: {
          nomor_surat: string;
          tanggal_kirim: string;
          tujuan: string;
          perihal: string;
          penandatangan: string;
          file_url?: string;
        } = {
          nomor_surat: form.nomor_surat,
          tanggal_kirim: form.tanggal_kirim,
          tujuan: form.tujuan,
          perihal: form.perihal,
          penandatangan: form.penandatangan,
        };

        // Hanya update file_url jika file baru dipilih
        if (file_url) {
          dataUpdate.file_url = file_url;
        }

        await updateDoc(
          doc(db, "surat_keluar", editingId),
          dataUpdate
        );

        alert("Surat berhasil diperbarui.");
      } else {
        // MODE TAMBAH BARU
        await addDoc(collection(db, "surat_keluar"), {
          nomor_surat: form.nomor_surat,
          tanggal_kirim: form.tanggal_kirim,
          tujuan: form.tujuan,
          perihal: form.perihal,
          penandatangan: form.penandatangan,
          file_url: file_url,
          created_at: serverTimestamp(),
        });

        alert("Surat berhasil ditambahkan.");
      }

      setForm(FORM_KOSONG);
      setEditingId(null);
      setShowForm(false);
    } catch (error) {
      console.error("Gagal menyimpan surat:", error);
      alert("Gagal menyimpan surat. Silakan coba lagi.");
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
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-[#111827]">
            Surat Keluar
          </h1>

          <p className="text-sm text-[#6b7280] mt-1">
            Daftar surat yang dikirim oleh kantor
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

      {/* FORM */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-sm p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <p className="md:col-span-2 text-sm font-medium text-[#111827]">
            {editingId ? "Edit Surat" : "Tambah Surat Baru"}
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
              placeholder="Masukkan nomor surat"
            />
          </div>

          {/* Tanggal */}
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Tanggal Kirim
            </label>

            <input
              type="date"
              name="tanggal_kirim"
              required
              value={form.tanggal_kirim}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
            />
          </div>

          {/* Tujuan */}
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Tujuan
            </label>

            <input
              type="text"
              name="tujuan"
              required
              value={form.tujuan}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
              placeholder="Masukkan tujuan surat"
            />
          </div>

          {/* Penandatangan */}
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Penandatangan
            </label>

            <input
              type="text"
              name="penandatangan"
              required
              value={form.penandatangan}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
              placeholder="Nama penandatangan"
            />
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
              placeholder="Masukkan perihal surat"
            />
          </div>

          {/* File */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#111827] mb-1">
              File Scan Surat{" "}
              {editingId && "(kosongkan jika tidak diganti)"}
            </label>

            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="text-sm"
            />

            <p className="text-xs text-gray-500 mt-1">
              Format yang disarankan: PDF, JPG, JPEG, atau PNG.
            </p>
          </div>

          {/* BUTTON */}
          <div className="md:col-span-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleBatal}
              disabled={saving}
              className="rounded-lg border border-gray-300 text-[#111827] text-sm font-medium px-4 py-2 hover:bg-[#f3f4f6] transition disabled:opacity-60"
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

      {/* TABEL */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
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

                <th className="px-4 py-3 font-medium">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {daftarSurat.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-[#6b7280]"
                  >
                    Belum ada surat keluar yang tercatat.
                  </td>
                </tr>
              ) : (
                daftarSurat.map((surat: SuratKeluar) => (
                  <tr
                    key={surat.id}
                    className="border-t border-gray-100 hover:bg-[#f3f4f6]/60 transition"
                  >
                    <td className="px-4 py-3 text-[#111827]">
                      {surat.nomor_surat}
                    </td>

                    <td className="px-4 py-3 text-[#111827]">
                      {surat.tanggal_kirim}
                    </td>

                    <td className="px-4 py-3 text-[#111827]">
                      {surat.tujuan}
                    </td>

                    <td className="px-4 py-3 text-[#111827]">
                      {surat.perihal}
                    </td>

                    <td className="px-4 py-3 text-[#111827]">
                      {surat.penandatangan}
                    </td>

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
                        <span className="text-[#6b7280]">
                          -
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            handleEditClick(surat)
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}