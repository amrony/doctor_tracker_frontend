"use client";

import { useState } from "react";
import { Icon } from "./ui-icon";

export function SignOut() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function signOut() {
    setPending(true);
    setError(false);

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok || response.status === 401 || response.status === 403) {
        window.location.replace("/sign-in");
        return;
      }
    } catch {
      // The current session can be retried when the connection returns.
    }

    setPending(false);
    setError(true);
  }

  return (
    <div className="sign-out">
      <button className="secondary-button" type="button" onClick={signOut} disabled={pending}>
        <Icon name="sign-out" size={17} />{pending ? "Signing out…" : "Sign out"}
      </button>
      {error && <p className="inline-error" role="alert">Could not sign out. Try again.</p>}
    </div>
  );
}
