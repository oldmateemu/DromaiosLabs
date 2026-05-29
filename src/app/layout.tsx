import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dromaios Cockpit",
  description: "Company command cockpit for Dromaios Labs."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
