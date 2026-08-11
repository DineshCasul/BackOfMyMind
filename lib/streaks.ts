import { toLocalDateString, parseLocalDateString } from "@/lib/utils";

export type StreakInfo = { current: number; longest: number };

const MS_PER_DAY = 86_400_000;

// "YYYY-MM-DD" strings sort lexicographically in calendar order, so a plain
// string sort works without parsing dates first.
export function computeStreaks(dates: string[]): StreakInfo {
  const uniqueSorted = Array.from(new Set(dates)).sort();
  if (uniqueSorted.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < uniqueSorted.length; i++) {
    const dayDiff = Math.round(
      (parseLocalDateString(uniqueSorted[i]).getTime() - parseLocalDateString(uniqueSorted[i - 1]).getTime()) /
        MS_PER_DAY
    );
    run = dayDiff === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  let current = 1;
  for (let i = uniqueSorted.length - 1; i > 0; i--) {
    const dayDiff = Math.round(
      (parseLocalDateString(uniqueSorted[i]).getTime() - parseLocalDateString(uniqueSorted[i - 1]).getTime()) /
        MS_PER_DAY
    );
    if (dayDiff === 1) current += 1;
    else break;
  }

  // A streak only counts as "current" if the most recent entry is today or
  // yesterday, otherwise it already ended and the current streak is 0.
  const mostRecent = uniqueSorted[uniqueSorted.length - 1];
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (mostRecent !== toLocalDateString(today) && mostRecent !== toLocalDateString(yesterday)) {
    current = 0;
  }

  return { current, longest };
}
