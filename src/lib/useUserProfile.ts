"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type Profile = {
  nama: string;
  email: string;
  role: "admin" | "user";
};

export function useUserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubDoc: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Bersihkan listener profile milik user sebelumnya (kalau ada)
      // sebelum memasang yang baru.
      if (unsubDoc) {
        unsubDoc();
        unsubDoc = null;
      }

      setUser(firebaseUser);

      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      unsubDoc = onSnapshot(doc(db, "users", firebaseUser.uid), (snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as Profile);
        } else {
          setProfile(null);
        }
        setLoading(false);
      });
    });

    return () => {
      unsubAuth();
      if (unsubDoc) unsubDoc();
    };
  }, []);

  return { user, profile, loading };
}