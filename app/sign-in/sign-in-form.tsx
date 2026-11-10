"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "../components/ui-icon";

export function SignInForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });

      if (response.ok) {
        window.location.replace("/dashboard");
        return;
      }

      const result = await response.json().catch(() => null);
      setError(response.status < 500 && typeof result?.message === "string"
        ? result.message
        : "The sign-in service is unavailable. Try again shortly.");
    } catch {
      setError("The sign-in service is unavailable. Try again shortly.");
    }

    setPending(false);
  }

  return (
    <form className="sign-in-form" method="post" onSubmit={signIn} aria-busy={pending}>
      <label htmlFor="email">Email address</label>
      <input id="email" name="email" type="email" placeholder="admin@example.com" autoComplete="username" maxLength={254} required />
      <label htmlFor="password">Password</label>
      <input id="password" name="password" type="password" autoComplete="current-password" maxLength={128} required />
      {error && <p className="form-error" role="alert"><Icon name="error" size={18} />{error}</p>}
      <button className="primary-button" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}<Icon name="arrow" size={18} />
      </button>
    </form>
  );
}
