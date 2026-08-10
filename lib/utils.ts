import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// "YYYY-MM-DD" from a Date's *local* calendar day, not toISOString(), which
// converts to UTC first and can shift the date by a day in either direction
// depending on the user's timezone offset.
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Inverse of toLocalDateString, `new Date("YYYY-MM-DD")` parses as UTC
// midnight, which is the wrong calendar day in any timezone ahead of UTC.
// Constructing from the numeric parts instead always gives local midnight.
export function parseLocalDateString(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}
