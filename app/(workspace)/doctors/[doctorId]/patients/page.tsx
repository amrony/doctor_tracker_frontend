import type { Metadata } from "next";
import { RequireAdmin } from "@/app/components/require-admin";
import { DoctorPatientsView } from "./doctor-patients-view";

export const metadata: Metadata = { title: "Doctor Patients" };

type PageProps = {
  params: Promise<{ doctorId: string }>;
};

export default async function DoctorPatientsPage({ params }: PageProps) {
  const { doctorId } = await params;

  return (
    <>
      <RequireAdmin />
      <DoctorPatientsView doctorId={doctorId} />
    </>
  );
}

