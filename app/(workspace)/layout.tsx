import { Suspense, type ReactNode } from "react";
import { requireAdmin } from "@/lib/admin-session";
import { Brand } from "../components/brand";
import { SignOut } from "../components/sign-out";
import { WorkspaceNav } from "../components/workspace-nav";

async function ProtectedWorkspace({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="workspace">
      <a className="skip-link" href="#workspace-content">Skip to content</a>
      <aside className="workspace-sidebar">
        <Brand />
        <p className="eyebrow nav-label">Workspace</p>
        <WorkspaceNav />
      </aside>
      <div className="workspace-main">
        <header className="workspace-topbar">
          <div className="admin-identity">
            <span className="admin-avatar" aria-hidden="true">{admin.email.charAt(0).toUpperCase()}</span>
            <div className="admin-details"><strong>Administrator</strong><span>{admin.email}</span></div>
          </div>
          <SignOut />
        </header>
        <main className="workspace-content" id="workspace-content">{children}</main>
      </div>
    </div>
  );
}

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<main className="standalone-state"><p role="status">Checking your session…</p></main>}>
      <ProtectedWorkspace>{children}</ProtectedWorkspace>
    </Suspense>
  );
}
