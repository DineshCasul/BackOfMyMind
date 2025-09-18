"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-white shadow-md">
      <h1 className="text-xl font-bold">🌙 Dreamscape</h1>
      <div className="flex gap-4">
        <Link href="/">Dashboard</Link>
        <Link href="/dreams">Dreams</Link>
        <Link href="/calendar">Calendar</Link>
        <Link href="/analytics">Analytics</Link>
        <Link href="/settings">Settings</Link>
      </div>
    </nav>
  );
}
