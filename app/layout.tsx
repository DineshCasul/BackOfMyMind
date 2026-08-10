import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import Starfield from "@/components/Starfield";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "back of my mind",
  description: "A quiet place to write down your dreams.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen font-sans">
        <Starfield />
        {children}
      </body>
    </html>
  );
}
