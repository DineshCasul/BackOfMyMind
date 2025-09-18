import type { Metadata } from "next";
import "./globals.css";
import { DreamProvider } from "@/context/DreamContext";

export const metadata: Metadata = {
  title: "DreamJournal",
  description: "Track and reflect on your dreams",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <DreamProvider>{children}</DreamProvider>
      </body>
    </html>
  );
}
