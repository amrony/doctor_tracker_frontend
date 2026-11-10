"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./ui-icon";

const items = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Doctors", href: "/doctors", icon: "doctors" },
  { label: "Patients", href: "/patients", icon: "patients" },
] as const;

export function WorkspaceNav() {
  const pathname = usePathname();

  return (
    <nav className="workspace-nav" aria-label="Workspace">
      {items.map(({ label, href, icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link key={href} href={href} prefetch={false} aria-current={active ? "page" : undefined}>
            <Icon name={icon} />{label}
          </Link>
        );
      })}
    </nav>
  );
}
