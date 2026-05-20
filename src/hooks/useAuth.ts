"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/types";

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => {
        if (!r.ok) throw new Error("Não autenticado");
        return r.json();
      })
      .then((d) => setUser(d.data))
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return { user, loading, logout };
}
