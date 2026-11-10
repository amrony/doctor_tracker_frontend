import type { Metadata } from "next";
import { RequireAdmin } from "../../components/require-admin";
import { DoctorsView } from "./doctors-view";

export const metadata: Metadata = { title: "Doctors" };

export default function DoctorsPage() {
  return (
    <>
      <RequireAdmin />
      <DoctorsView />
    </>
  );
}
