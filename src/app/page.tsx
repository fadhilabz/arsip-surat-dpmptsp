"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          const role = userSnap.data().role;
          router.replace(role === "admin" ? "/admin/dashboard" : "/dashboard");
        } else {
          router.replace("/login");
        }
      } catch (err) {
        console.error("Gagal memeriksa sesi:", err);
        router.replace("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f4f6]">
      <p className="text-sm text-[#6b7280]">Memuat...</p>
    </div>
  );
}