import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";

export const instant = false;

export default async function Home() {
  await requireAdmin();
  redirect("/dashboard");
}
