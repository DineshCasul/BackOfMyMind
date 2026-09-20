import type { Dream, DreamType, MoodType } from "@/context/DreamContext";
import { MOOD_META, MOOD_ORDER } from "@/lib/moods";
import { DREAM_TYPE_ORDER } from "@/lib/dreamTypes";
import { parseLocalDateString, startOfWeek, toLocalDateString } from "@/lib/utils";

export type Range = "all" | "90d" | "year";

export const RANGES: { id: Range; label: string }[] = [
  { id: "all", label: "All time" },
  { id: "year", label: "This year" },
  { id: "90d", label: "90 days" },
];

// "YYYY-MM-DD" strings compare correctly as plain strings, so the range test
// is a string comparison: no Date parsing for every dream.
export function filterByRange(dreams: Dream[], range: Range, today = new Date()): Dream[] {
  if (range === "all") return dreams;
  if (range === "year") {
    const start = `${today.getFullYear()}-01-01`;
    return dreams.filter((d) => d.date >= start);
  }
  const from = new Date(today);
  from.setDate(from.getDate() - 89);
  const start = toLocalDateString(from);
  return dreams.filter((d) => d.date >= start);
}

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const WEEKDAY_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const RIVER_WEEKS = 12;

export type Motif = { label: string; count: number; mood: MoodType };

export type WeekBucket = { start: string; counts: Record<MoodType, number>; total: number };

export type Patterns = {
  total: number;
  moodCounts: Record<MoodType, number>;
  typeCounts: Record<DreamType, number>;
  /** How many dreams were rated 1, 2, 3, 4 and 5 for vividness (index 0 is a rating of 1). */
  vividness: number[];
  avgVividness: number;
  /** Dreams by day of the week, Monday first. */
  weekdays: number[];
  /** The most recent RIVER_WEEKS weeks, oldest first, always covering "now" whatever the range. */
  river: WeekBucket[];
  tags: Motif[];
  people: Motif[];
  insights: string[];
};

const emptyMoodCounts = () => Object.fromEntries(MOOD_ORDER.map((m) => [m, 0])) as Record<MoodType, number>;

// Counts how often each tag (or person) appears, ignoring case but keeping the
// first spelling seen for display, and remembers which mood it most often
// shows up alongside, so the motif cloud can colour each word by feeling.
function topMotifs(dreams: Dream[], pick: (d: Dream) => string[], limit: number): Motif[] {
  const byKey = new Map<string, { label: string; count: number; moods: Record<string, number> }>();
  for (const d of dreams) {
    for (const raw of pick(d)) {
      const label = raw.trim();
      if (!label) continue;
      const key = label.toLowerCase();
      const entry = byKey.get(key) ?? { label, count: 0, moods: {} };
      entry.count++;
      entry.moods[d.mood] = (entry.moods[d.mood] ?? 0) + 1;
      byKey.set(key, entry);
    }
  }
  return [...byKey.values()]
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit)
    .map((e) => ({
      label: e.label,
      count: e.count,
      mood: (Object.entries(e.moods).sort((a, b) => b[1] - a[1])[0][0] as MoodType) ?? "neutral",
    }));
}

const pct = (n: number, total: number) => Math.round((n / total) * 100);

const vividWord = (avg: number) => (avg < 2 ? "faint" : avg < 3 ? "hazy" : avg < 4 ? "clear" : "vivid");

// One pass over the dreams builds every number the Patterns page shows, so
// the page does its work once per data change instead of once per chart.
// `allDreams` is only used for the river, which is about "lately" and so
// looks at the whole journal rather than the selected range.
export function computePatterns(dreams: Dream[], allDreams: Dream[], today = new Date()): Patterns {
  const moodCounts = emptyMoodCounts();
  const typeCounts = Object.fromEntries(DREAM_TYPE_ORDER.map((t) => [t, 0])) as Record<DreamType, number>;
  const vividness = [0, 0, 0, 0, 0];
  const weekdays = [0, 0, 0, 0, 0, 0, 0];
  let vividSum = 0;

  for (const d of dreams) {
    moodCounts[d.mood]++;
    typeCounts[d.dreamType]++;
    vividness[Math.min(4, Math.max(0, d.vividness - 1))]++;
    vividSum += d.vividness;
    weekdays[(parseLocalDateString(d.date).getDay() + 6) % 7]++;
  }

  // The river: one bucket per week, ending with the current week.
  const thisWeek = startOfWeek(today);
  const river: WeekBucket[] = Array.from({ length: RIVER_WEEKS }, (_, i) => {
    const start = new Date(thisWeek);
    start.setDate(thisWeek.getDate() - (RIVER_WEEKS - 1 - i) * 7);
    return { start: toLocalDateString(start), counts: emptyMoodCounts(), total: 0 };
  });
  const firstStart = river[0].start;
  for (const d of allDreams) {
    if (d.date < firstStart) continue;
    const start = toLocalDateString(startOfWeek(parseLocalDateString(d.date)));
    const bucket = river.find((b) => b.start === start);
    if (bucket) {
      bucket.counts[d.mood]++;
      bucket.total++;
    }
  }

  const total = dreams.length;
  const avgVividness = total ? vividSum / total : 0;
  const tags = topMotifs(dreams, (d) => d.tags, 16);
  const people = topMotifs(dreams, (d) => d.people, 6);

  // Plain sentences worked out from the numbers above. Each one only states
  // something the data shows, and only when there is enough data for it to mean
  // anything, so a new journal gets fewer lines rather than confident guesses.
  const insights: string[] = [];
  if (total >= 3) {
    const topMood = MOOD_ORDER.reduce((a, b) => (moodCounts[b] > moodCounts[a] ? b : a));
    insights.push(`${MOOD_META[topMood].label} is your most common feeling: ${pct(moodCounts[topMood], total)}% of these dreams.`);

    const topDayCount = Math.max(...weekdays);
    const topDay = weekdays.indexOf(topDayCount);
    if (topDayCount >= 2) insights.push(`You write most on ${WEEKDAY_LONG[topDay]}s (${topDayCount} ${topDayCount === 1 ? "dream" : "dreams"}).`);

    insights.push(`Your dreams are usually ${vividWord(avgVividness)}: ${avgVividness.toFixed(1)} out of 5 on average.`);

    if (typeCounts.lucid > 0) insights.push(`${typeCounts.lucid} of your dreams ${typeCounts.lucid === 1 ? "was" : "were"} lucid (${pct(typeCounts.lucid, total)}%).`);
    if (typeCounts.nightmare > 0) insights.push(`${typeCounts.nightmare} ${typeCounts.nightmare === 1 ? "was a nightmare" : "were nightmares"} (${pct(typeCounts.nightmare, total)}%).`);
    if (tags[0] && tags[0].count >= 2) insights.push(`"${tags[0].label}" turns up more than anything else: in ${tags[0].count} dreams.`);
  }

  return { total, moodCounts, typeCounts, vividness, avgVividness, weekdays, river, tags, people, insights: insights.slice(0, 5) };
}
