import type { Metadata } from "next";
import { RequireAdmin } from "../../components/require-admin";
import { PatientsView } from "./patients-view";

export const metadata: Metadata = { title: "Patients" };

export default function PatientsPage() {
  return (
    <>
      <RequireAdmin />
      <PatientsView />
    </>
  );
}
