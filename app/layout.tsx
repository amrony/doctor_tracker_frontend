import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Doctor Tracker", template: "%s | Doctor Tracker" },
  description: "The administrative workspace for doctor and patient records.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
