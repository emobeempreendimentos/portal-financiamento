import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import AdminLayoutClient from "./AdminLayoutClient";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("portal_token")?.value;

  if (!token) redirect("/login");

  const session = await verifyToken(token);
  if (!session || session.role !== "admin") redirect("/login");

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
