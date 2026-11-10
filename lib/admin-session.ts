import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

type Admin = { email: string; role: "admin" };

const sessionCookieNames = ["__Host-doctor_tracker_session", "doctor_tracker_session"];

export const requireAdmin = cache(async (): Promise<Admin> => {
  const cookieStore = await cookies();
  const sessionCookies = sessionCookieNames.flatMap((name) => {
    const value = cookieStore.get(name)?.value;
    return value && /^[a-f0-9]{64}$/.test(value) ? [`${name}=${value}`] : [];
  });

  if (sessionCookies.length === 0) redirect("/sign-in");

  const backendOrigin = process.env.BACKEND_ORIGIN || "http://127.0.0.1:4000";
  const response = await fetch(new URL("/api/auth/me", backendOrigin), {
    cache: "no-store",
    headers: { cookie: sessionCookies.join("; ") },
    redirect: "error",
    signal: AbortSignal.timeout(5000),
  });

  if (response.status === 401 || response.status === 403) redirect("/sign-in");
  if (!response.ok) throw new Error("Unable to check the admin session.");

  const { data } = await response.json();
  if (data?.role !== "admin" || typeof data.email !== "string") {
    throw new Error("Invalid admin session response.");
  }

  return { email: data.email, role: data.role };
});
