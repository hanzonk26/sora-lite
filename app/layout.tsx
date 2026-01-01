import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Sora Lite",
  description: "Personal AI video practice",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}