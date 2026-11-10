import type { Metadata } from "next";
import { Brand } from "../components/brand";
import { Icon } from "../components/ui-icon";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <main className="sign-in-page">
      <aside className="sign-in-intro" aria-label="About Doctor Tracker">
        <Brand />
        <div className="intro-copy">
          <p className="eyebrow">Clinic administration</p>
          <p className="intro-heading">A clearer view of your practice.</p>
          <p className="intro-description">Manage your doctors, patient records, and clinic activity in one workspace.</p>
        </div>
        <svg className="intro-pulse" viewBox="0 0 650 220" fill="none" aria-hidden="true">
          <path d="M0 146h165l35-30 37 54 56-116 52 146 44-78 28 24h233" stroke="currentColor" strokeWidth="2" />
          <circle cx="293" cy="54" r="7" stroke="currentColor" strokeWidth="2" />
        </svg>
        <p className="intro-footer"><Icon name="lock" size={16} /> Administrator access</p>
      </aside>
      <section className="sign-in-main">
        <div className="sign-in-content">
          <div className="mobile-brand"><Brand /></div>
          <p className="eyebrow">Admin workspace</p>
          <h1>Sign in</h1>
          <p className="page-description">Enter your administrator credentials to continue.</p>
          <SignInForm />
        </div>
      </section>
    </main>
  );
}
