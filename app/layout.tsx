import type { Metadata } from "next";
import { Quicksand, Fraunces, Caveat } from "next/font/google";
import Starfield from "@/components/Starfield";
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
  axes: ["SOFT", "opsz"],
});

// A handwriting face, used sparingly (dates, margin notes, the little
// "last night, I..." prompts) so the journal feels written in, not typeset.
// Everything long-form stays in Quicksand/Fraunces for legibility.
const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
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
    <html lang="en" className={`${quicksand.variable} ${fraunces.variable} ${caveat.variable}`}>
      <body className="relative min-h-screen font-sans">
        <Starfield />
        {children}
      </body>
    </html>
  );
}
