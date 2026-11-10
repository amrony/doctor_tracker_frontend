import type { Metadata } from "next";
import Link from "next/link";
import { RequireAdmin } from "../../components/require-admin";
import { Icon } from "../../components/ui-icon";

export const metadata: Metadata = { title: "Dashboard" };

const modules = [
  { title: "Doctors", description: "Open the doctor directory.", href: "/doctors", icon: "doctors" },
  { title: "Patients", description: "Open the patient directory.", href: "/patients", icon: "patients" },
] as const;

export default function DashboardPage() {
  return (
    <>
      <RequireAdmin />
      <header className="page-heading">
        <p className="eyebrow">Workspace overview</p>
        <h1>Dashboard</h1>
        <p className="page-description">Choose a directory to get started.</p>
      </header>
      <div className="module-grid">
        {modules.map(({ title, description, href, icon }) => (
          <Link className="module-card" key={href} href={href} prefetch={false}>
            <span className="module-icon"><Icon name={icon} size={24} /></span>
            <span><strong>{title}</strong><span className="module-description">{description}</span></span>
            <span className="module-arrow"><Icon name="arrow" size={20} /></span>
          </Link>
        ))}
      </div>
    </>
  );
}
