import type { Metadata } from "next";
import { Quicksand, Fraunces } from "next/font/google";
import Starfield from "@/components/Starfield";
import HeaderGlow from "@/components/HeaderGlow";
import "./globals.css";

// Soft, rounded terminals read as gentler than a neutral grotesk like the
// old Inter, closer to the "dreamy" feel the rest of the UI is going for,
// while staying legible enough for long dream descriptions at body size.
const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
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
    <html lang="en" className={`${quicksand.variable} ${fraunces.variable}`}>
      <body className="min-h-screen font-sans">
        <Starfield />
        <HeaderGlow />
        {children}
      </body>
    </html>
  );
}
