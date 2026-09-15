"use client";

// app/dashboard/surat-masuk/page.tsx
// Halaman Surat Masuk untuk Petugas (User): read-only + cari/filter + lihat detail + beri disposisi.
// Disposisi disimpan sebagai array di field "disposisi" pada dokumen surat_masuk (riwayat, bukan overwrite).

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useUserProfile } from "@/lib/useUserProfile";

type Disposisi = {
  oleh_nama: string;
  oleh_email: string;
  ditujukan_ke: string;
  catatan: string;
  tanggal: string;
};

type Surat = {
  id: string;
  nomor_surat: string;
  tanggal_terima: string;
  pengirim: string;
  perihal: string;
  sifat_surat?: string;
  file_url?: string;
  status?: string;
  disposisi?: Disposisi[];
};

export default function SuratMasukUserPage() {
  const { profile } = useUserProfile();

  const [daftarSurat, setDaftarSurat] = useState<Surat[]>([]);
  const [pencarian, setPencarian] = useState("");
  const [tanggalAwal, setTanggalAwal] = useState("");
  const [tanggalAkhir, setTanggalAkhir] = useState("");

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formDisposisi, setFormDisposisi] = useState({ ditujukan_ke: "", catatan: "" });
  const [mengirim, setMengirim] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "surat_masuk"), orderBy("created_at", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDaftarSurat(
        snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Surat, "id">) }))
      );
    });
    return () => unsubscribe();
  }, []);

  function cocokPencarian(surat: Surat) {
    if (!pencarian.trim()) return true;
    const kata = pencarian.toLowerCase();
    return (
      surat.nomor_surat?.toLowerCase().includes(kata) ||
      surat.perihal?.toLowerCase().includes(kata) ||
      surat.pengirim?.toLowerCase().includes(kata)
    );
  }

  function cocokTanggal(surat: Surat) {
    if (!tanggalAwal && !tanggalAkhir) return true;
    const t = surat.tanggal_terima;
    if (!t) return false;
    if (tanggalAwal && t < tanggalAwal) return false;
    if (tanggalAkhir && t > tanggalAkhir) return false;
    return true;
  }

  const hasilFilter = daftarSurat.filter((s) => cocokPencarian(s) && cocokTanggal(s));

  function handleToggleDetail(surat: Surat) {
    if (expandedId === surat.id) {
      setExpandedId(null);
    } else {
      setExpandedId(surat.id);
      setFormDisposisi({ ditujukan_ke: "", catatan: "" });
    }
  }

  async function handleKirimDisposisi(suratId: string) {
    if (!formDisposisi.ditujukan_ke.trim() || !formDisposisi.catatan.trim()) {
      alert("Ditujukan ke dan catatan disposisi wajib diisi.");
      return;
    }

    setMengirim(true);
    try {
      await updateDoc(doc(db, "surat_masuk", suratId), {
        disposisi: arrayUnion({
          oleh_nama: profile?.nama || "Tidak diketahui",
          oleh_email: profile?.email || "",
          ditujukan_ke: formDisposisi.ditujukan_ke.trim(),
          catatan: formDisposisi.catatan.trim(),
          tanggal: new Date().toISOString(),
        }),
      });
      setFormDisposisi({ ditujukan_ke: "", catatan: "" });
    } catch (err) {
      alert("Gagal mengirim disposisi. Silakan coba lagi.");
    } finally {
      setMengirim(false);
    }
  }

  return (
    <div className="px-6 py-8 sm:px-8">
      <h1 className="text-lg font-semibold text-[#111827]">Surat Masuk</h1>
      <p className="text-sm text-[#6b7280] mt-1 mb-6">
        Daftar surat yang diterima kantor (tampilan baca saja)
      </p>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-sm p-5 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-[#111827] mb-1">Cari</label>
          <input
            type="text"
            placeholder="Nomor surat, perihal, atau pengirim"
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

      {/* Daftar surat */}
      <div className="space-y-3">
        {hasilFilter.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm px-4 py-6 text-center text-sm text-[#6b7280]">
            Tidak ada surat yang cocok dengan pencarian/filter.
          </div>
        )}

        {hasilFilter.map((surat) => {
          const terbuka = expandedId === surat.id;
          const riwayatDisposisi = surat.disposisi || [];

          return (
            <div key={surat.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => handleToggleDetail(surat)}
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-[#f3f4f6]/60 transition"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#111827] truncate">
                    {surat.perihal}
                  </p>
                  <p className="text-xs text-[#6b7280] mt-0.5">
                    {surat.nomor_surat} &middot; {surat.pengirim} &middot; {surat.tanggal_terima}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`rounded-lg px-2 py-1 text-xs font-medium ${
                      surat.status === "selesai"
                        ? "bg-green-50 text-[#16a34a]"
                        : "bg-yellow-50 text-[#ca8a04]"
                    }`}
                  >
                    {surat.status === "selesai" ? "Selesai" : "Belum Diproses"}
                  </span>
                  <span className="text-[#6b7280] text-sm">{terbuka ? "▲" : "▼"}</span>
                </div>
              </button>

              {terbuka && (
                <div className="border-t border-gray-100 px-5 py-4 bg-[#f3f4f6]/40">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
                    <p>
                      <span className="text-[#6b7280]">Sifat Surat:</span> {surat.sifat_surat || "-"}
                    </p>
                    <p>
                      <span className="text-[#6b7280]">Lampiran:</span>{" "}
                      {surat.file_url ? (
                        <a
                          href={surat.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#1e3a8a] hover:underline"
                        >
                          Buka File
                        </a>
                      ) : (
                        "Tidak ada"
                      )}
                    </p>
                  </div>

                  {/* Riwayat disposisi */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-[#111827] mb-2">
                      Riwayat Disposisi ({riwayatDisposisi.length})
                    </p>
                    {riwayatDisposisi.length === 0 ? (
                      <p className="text-xs text-[#6b7280]">Belum ada disposisi untuk surat ini.</p>
                    ) : (
                      <div className="space-y-2">
                        {riwayatDisposisi.map((d, i) => (
                          <div key={i} className="rounded-lg bg-white border border-gray-200 px-3 py-2">
                            <div className="flex items-center justify-between text-xs text-[#6b7280] mb-1">
                              <span>
                                Ditujukan ke <strong className="text-[#111827]">{d.ditujukan_ke}</strong>
                              </span>
                              <span>{new Date(d.tanggal).toLocaleDateString("id-ID")}</span>
                            </div>
                            <p className="text-sm text-[#111827]">{d.catatan}</p>
                            <p className="text-xs text-[#6b7280] mt-1">— {d.oleh_nama}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Form tambah disposisi */}
                  <div className="rounded-lg bg-white border border-gray-200 p-4">
                    <p className="text-xs font-semibold text-[#111827] mb-3">Beri Disposisi Baru</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <input
                        type="text"
                        placeholder="Ditujukan ke (bidang/pimpinan)"
                        value={formDisposisi.ditujukan_ke}
                        onChange={(e) =>
                          setFormDisposisi((prev) => ({ ...prev, ditujukan_ke: e.target.value }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
                      />
                    </div>
                    <textarea
                      placeholder="Catatan / instruksi disposisi"
                      value={formDisposisi.catatan}
                      onChange={(e) =>
                        setFormDisposisi((prev) => ({ ...prev, catatan: e.target.value }))
                      }
                      rows={2}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] mb-3"
                    />
                    <button
                      onClick={() => handleKirimDisposisi(surat.id)}
                      disabled={mengirim}
                      className="rounded-lg bg-[#1e3a8a] text-white text-sm font-medium px-4 py-2 hover:bg-[#1e3a8a]/90 transition disabled:opacity-60"
                    >
                      {mengirim ? "Mengirim..." : "Kirim Disposisi"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}