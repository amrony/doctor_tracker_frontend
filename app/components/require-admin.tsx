import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin-session";

async function AdminCheck() {
  await requireAdmin();
  return null;
}

// Verifies the admin session without blocking the static page shell, so
// navigation stays instant while unauthenticated users are still redirected.
export function RequireAdmin() {
  return (
    <Suspense fallback={null}>
      <AdminCheck />
    </Suspense>
  );
}

