import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Finance System",
  description: "Rolling forecast and personal finance planning system"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

