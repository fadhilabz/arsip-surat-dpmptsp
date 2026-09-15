"use client";

import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type Petugas = {
  id: string; // uid
  nama: string;
  email: string;
  role: "admin" | "user";
};

type Undangan = {
  id: string; // email
  nama: string;
  role: "admin" | "user";
};

export default function KelolaPetugasPage() {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [petugasAktif, setPetugasAktif] = useState<Petugas[]>([]);
  const [undangan, setUndangan] = useState<Undangan[]>([]);

  useEffect(() => {
    const unsubUsers = onSnapshot(
      query(collection(db, "users"), orderBy("nama")),
      (snap) => {
        setPetugasAktif(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Petugas, "id">) }))
        );
      }
    );

    const unsubUndangan = onSnapshot(collection(db, "daftar_petugas"), (snap) => {
      setUndangan(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Undangan, "id">) }))
      );
    });

    return () => {
      unsubUsers();
      unsubUndangan();
    };
  }, []);

  async function handleTambahPetugas(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    const emailBersih = email.trim().toLowerCase();

    if (!nama.trim() || !emailBersih) {
      setFormError("Nama dan email wajib diisi.");
      return;
    }

    const sudahJadiUser = petugasAktif.some((p) => p.email.toLowerCase() === emailBersih);
    const sudahDiundang = undangan.some((u) => u.id === emailBersih);

    if (sudahJadiUser || sudahDiundang) {
      setFormError("Email ini sudah terdaftar sebagai petugas atau sudah diundang.");
      return;
    }

    setSubmitting(true);
    try {
      await setDoc(doc(db, "daftar_petugas", emailBersih), {
        nama: nama.trim(),
        role,
        created_at: serverTimestamp(),
      });
      setFormSuccess(
        `Petugas "${nama.trim()}" berhasil ditambahkan. Akses aktif setelah petugas login dengan akun Google (${emailBersih}).`
      );
      setNama("");
      setEmail("");
      setRole("user");
    } catch (err) {
      console.error(err);
      setFormError("Gagal menambahkan petugas. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUbahRole(uid: string, roleBaru: "admin" | "user") {
    await updateDoc(doc(db, "users", uid), { role: roleBaru });
  }

  async function handleHapusPetugas(uid: string) {
    if (!confirm("Yakin ingin menghapus akses petugas ini?")) return;
    await deleteDoc(doc(db, "users", uid));
  }

  async function handleBatalUndangan(email: string) {
    if (!confirm("Batalkan undangan untuk email ini?")) return;
    await deleteDoc(doc(db, "daftar_petugas", email));
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-xl font-semibold text-[#111827]">Kelola Petugas</h1>
      <p className="mt-1 text-sm text-[#6b7280]">
        Tambahkan email petugas baru. Akun akan aktif otomatis saat petugas login dengan Google.
      </p>

      {/* Form tambah petugas */}
      <form
        onSubmit={handleTambahPetugas}
        className="mt-6 rounded-lg border border-gray-200 bg-white p-5"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="mb-1 block text-xs font-medium text-[#111827]">Nama</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Nama petugas"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1e3a8a] focus:outline-none"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="mb-1 block text-xs font-medium text-[#111827]">Email Google</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@gmail.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1e3a8a] focus:outline-none"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="mb-1 block text-xs font-medium text-[#111827]">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "user")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1e3a8a] focus:outline-none"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {formError && (
          <p className="mt-3 rounded-lg bg-red-50 px-3.5 py-2 text-sm text-[#dc2626]">{formError}</p>
        )}
        {formSuccess && (
          <p className="mt-3 rounded-lg bg-green-50 px-3.5 py-2 text-sm text-[#16a34a]">{formSuccess}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 rounded-lg bg-[#1e3a8a] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e3a8a]/90 disabled:opacity-60"
        >
          {submitting ? "Menyimpan..." : "Tambah Petugas"}
        </button>
      </form>

      {/* Undangan belum login */}
      {undangan.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-[#111827]">
            Menunggu Login Pertama ({undangan.length})
          </h2>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs text-[#6b7280]">
                <tr>
                  <th className="px-4 py-2.5">Nama</th>
                  <th className="px-4 py-2.5">Email</th>
                  <th className="px-4 py-2.5">Role</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {undangan.map((u) => (
                  <tr key={u.id} className="border-t border-gray-100">
                    <td className="px-4 py-2.5">{u.nama}</td>
                    <td className="px-4 py-2.5 text-[#6b7280]">{u.id}</td>
                    <td className="px-4 py-2.5">
                      <span className="rounded-full bg-[#ca8a04]/10 px-2 py-0.5 text-xs font-medium text-[#ca8a04]">
                        {u.role === "admin" ? "Admin" : "User"} · Pending
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => handleBatalUndangan(u.id)}
                        className="text-xs font-medium text-[#dc2626] hover:underline"
                      >
                        Batalkan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Petugas aktif */}
      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-[#111827]">
          Petugas Aktif ({petugasAktif.length})
        </h2>
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs text-[#6b7280]">
              <tr>
                <th className="px-4 py-2.5">Nama</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {petugasAktif.map((p) => (
                <tr key={p.id} className="border-t border-gray-100 hover:bg-blue-50/40">
                  <td className="px-4 py-2.5">{p.nama}</td>
                  <td className="px-4 py-2.5 text-[#6b7280]">{p.email}</td>
                  <td className="px-4 py-2.5">
                    <select
                      value={p.role}
                      onChange={(e) => handleUbahRole(p.id, e.target.value as "admin" | "user")}
                      className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-[#1e3a8a] focus:outline-none"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => handleHapusPetugas(p.id)}
                      className="text-xs font-medium text-[#dc2626] hover:underline"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
              {petugasAktif.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-[#6b7280]">
                    Belum ada petugas.
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