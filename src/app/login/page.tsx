"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Kalau user membuka /login padahal sesi Firebase Auth-nya masih aktif
  // (misalnya karena pencet tombol Back setelah login), langsung
  // arahkan ke dashboard yang sesuai — jangan tampilkan tombol login lagi.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCheckingSession(false);
        return;
      }

      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          const role = userSnap.data().role;
          router.replace(role === "admin" ? "/admin/dashboard" : "/dashboard");
          return; // jangan setCheckingSession(false), biar tidak sempat kelip form login
        }
        // Ada sesi auth tapi belum terdaftar di 'users' -> paksa logout
        await signOut(auth);
        setCheckingSession(false);
      } catch (err) {
        console.error("Gagal memeriksa sesi:", err);
        setCheckingSession(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  async function handleGoogleLogin() {
    setError("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const role = userSnap.data().role;
        router.replace(role === "admin" ? "/admin/dashboard" : "/dashboard");
        return;
      }

      // Belum ada di 'users' — cek apakah emailnya sudah didaftarkan admin
      if (!user.email) {
        await signOut(auth);
        setError("Akun Google tidak memiliki email yang valid.");
        return;
      }

      const undanganRef = doc(db, "daftar_petugas", user.email.toLowerCase());
      const undanganSnap = await getDoc(undanganRef);

      if (undanganSnap.exists()) {
        const { nama, role } = undanganSnap.data();

        // Provisioning: pindahkan dari daftar_petugas -> users/{uid}
        await setDoc(userDocRef, {
          nama,
          email: user.email,
          role,
          created_at: serverTimestamp(),
        });
        await deleteDoc(undanganRef);

        router.replace(role === "admin" ? "/admin/dashboard" : "/dashboard");
        return;
      }

      // Tidak terdaftar sama sekali
      await signOut(auth);
      setError("Akun Google Anda belum terdaftar di sistem. Silakan hubungi Administrator.");
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("Proses login dibatalkan.");
      } else if (err.code === "auth/unauthorized-domain") {
        setError("Domain ini belum diizinkan di Firebase Console.");
      } else {
        setError("Gagal masuk dengan Google. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  }

  // Selagi masih mengecek sesi (menghindari kelip form login yang
  // sebentar muncul lalu langsung redirect), tampilkan layar kosong/loading.
  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f4f6]">
        <p className="text-sm text-[#6b7280]">Memeriksa sesi...</p>
      </div>
    );
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f3f4f6] px-4 py-10"
      style={{
        backgroundImage: "radial-gradient(#1e3a8a14 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      <div className="w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-md sm:max-w-md">
        <div className="relative bg-[#1e3a8a] px-6 py-8 sm:px-8 sm:py-10">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, #fff 0px, #fff 1px, transparent 1px, transparent 14px)",
            }}
          />
          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="white" strokeWidth="1.6">
                <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h9L20 8.5V18.5A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5v-13Z" strokeLinejoin="round"/>
                <path d="M14 4v3.5A1.5 1.5 0 0 0 15.5 9H20" strokeLinejoin="round"/>
                <path d="M8 13h8M8 16h5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold text-white sm:text-lg">Sistem Arsip Surat</h1>
              <p className="text-xs text-white/70 sm:text-sm">DPMPTSP Kota Baubau</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-7 sm:px-8 sm:py-8">
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-[#f59e0b]/10 px-3 py-1 text-xs font-medium text-[#b45309]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
            Khusus akun yang terdaftar
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-[#111827] transition-colors hover:bg-gray-50 active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span>Memeriksa akun...</span>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden="true" className="shrink-0">
                  <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.85.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.95v2.33A9 9 0 0 0 9 18z"/>
                  <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.69 9c0-.6.1-1.18.28-1.72V4.95H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.05l3.02-2.33z"/>
                  <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.95l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
                </svg>
                <span>Masuk dengan Google</span>
              </>
            )}
          </button>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-[#dc2626]">
              {error}
            </p>
          )}

          <p className="mt-6 text-center text-xs text-[#6b7280]">
            Belum punya akses? Hubungi Administrator kantor.
          </p>
        </div>
      </div>
    </div>
  );
}