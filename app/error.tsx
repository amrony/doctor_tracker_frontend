"use client";

import { WorkspaceState } from "./components/workspace-state";

export default function ErrorPage() {
  return (
    <main className="standalone-state">
      <WorkspaceState icon="error" title="Workspace unavailable" description="We couldn’t load the workspace. Check your connection and try again." />
      <button className="secondary-button" onClick={() => window.location.reload()}>Try again</button>
    </main>
  );
}
