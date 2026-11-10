import type { Metadata } from "next";
import { RequireAdmin } from "../../components/require-admin";
import { WorkspaceState } from "../../components/workspace-state";

export const metadata: Metadata = { title: "Patients" };

export default function PatientsPage() {
  return (
    <>
      <RequireAdmin />
      <header className="page-heading">
        <p className="eyebrow">Directories</p>
        <h1>Patients</h1>
        <p className="page-description">Your patient directory.</p>
      </header>
      <WorkspaceState icon="patients" title="Patient directory setup" description="Patient records will appear here when the directory is connected." />
    </>
  );
}
