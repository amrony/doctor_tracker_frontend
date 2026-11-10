import type { Metadata } from "next";
import { RequireAdmin } from "../../components/require-admin";
import { DashboardView } from "./dashboard-view";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <>
      <RequireAdmin />
      <DashboardView />
    </>
  );
}
