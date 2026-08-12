import {
  Flame,
  BookOpen,
  Eye,
  Ghost,
  Repeat,
  Sparkles,
  Camera,
  Palette,
  Tag,
  Layers,
  Users,
  MapPin,
  Globe,
  Heart,
  ThumbsUp,
  Calendar,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";
import type { Dream, DreamType, MoodType } from "@/context/DreamContext";
import { computeStreaks } from "@/lib/streaks";
import { parseLocalDateString } from "@/lib/utils";
import { MOOD_ORDER, MOOD_META } from "@/lib/moods";

export type AchievementCategory =
  | "streak"
  | "milestone"
  | "dreamType"
  | "vividness"
  | "mood"
  | "tags"
  | "people"
  | "setting"
  | "social"
  | "time";

export type AchievementProgress = { current: number; target: number };

export type Achievement = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  category: AchievementCategory;
  check: (ctx: AchievementContext) => boolean;
  progress?: (ctx: AchievementContext) => AchievementProgress;
};

// Everything the catalog's `check`/`progress` functions read, computed
// once per render from the dreams already sitting in DreamContext (plus
// likesReceived, which needs its own query since likes live on other
// users' view of a dream, not the dream row itself). Keeping this as one
// pre-aggregated object means each achievement definition below is a
// cheap lookup instead of its own pass over every dream.
export type AchievementContext = {
  total: number;
  longestStreak: number;
  typeCounts: Record<DreamType, number>;
  moodCounts: Record<MoodType, number>;
  allMoodsLogged: boolean;
  vividFiveCount: number;
  avgVividness: number;
  maxTagCount: number;
  distinctTagCount: number;
  maxPersonCount: number;
  distinctPeopleCount: number;
  distinctSettingCount: number;
  publicCount: number;
  favoriteCount: number;
  likesReceived: number;
  weekendCount: number;
  distinctMonthsLogged: number;
};

export function buildAchievementContext(dreams: Dream[], likesReceived: number): AchievementContext {
  const typeCounts: Record<DreamType, number> = { normal: 0, lucid: 0, nightmare: 0, recurring: 0 };
  const moodCounts = Object.fromEntries(MOOD_ORDER.map((m) => [m, 0])) as Record<MoodType, number>;
  const tagCounts: Record<string, number> = {};
  const peopleCounts: Record<string, number> = {};
  const settings = new Set<string>();
  const months = new Set<string>();
  let vividFiveCount = 0;
  let vividnessSum = 0;
  let publicCount = 0;
  let favoriteCount = 0;
  let weekendCount = 0;

  for (const dream of dreams) {
    typeCounts[dream.dreamType]++;
    moodCounts[dream.mood]++;
    vividnessSum += dream.vividness;
    if (dream.vividness === 5) vividFiveCount++;
    if (dream.isPublic) publicCount++;
    if (dream.isFavorite) favoriteCount++;
    if (dream.setting.trim()) settings.add(dream.setting.trim().toLowerCase());
    months.add(dream.date.slice(5, 7));
    for (const tag of dream.tags) {
      const key = tag.trim().toLowerCase();
      if (key) tagCounts[key] = (tagCounts[key] || 0) + 1;
    }
    for (const person of dream.people) {
      const key = person.trim().toLowerCase();
      if (key) peopleCounts[key] = (peopleCounts[key] || 0) + 1;
    }
    // getDay(): 0 = Sunday, 6 = Saturday.
    const weekday = parseLocalDateString(dream.date).getDay();
    if (weekday === 0 || weekday === 6) weekendCount++;
  }

  return {
    total: dreams.length,
    longestStreak: computeStreaks(dreams.map((d) => d.date)).longest,
    typeCounts,
    moodCounts,
    allMoodsLogged: MOOD_ORDER.every((m) => moodCounts[m] > 0),
    vividFiveCount,
    avgVividness: dreams.length ? vividnessSum / dreams.length : 0,
    maxTagCount: Object.values(tagCounts).reduce((max, c) => Math.max(max, c), 0),
    distinctTagCount: Object.keys(tagCounts).length,
    maxPersonCount: Object.values(peopleCounts).reduce((max, c) => Math.max(max, c), 0),
    distinctPeopleCount: Object.keys(peopleCounts).length,
    distinctSettingCount: settings.size,
    publicCount,
    favoriteCount,
    likesReceived,
    weekendCount,
    distinctMonthsLogged: months.size,
  };
}

// Generates one Achievement per threshold in `thresholds`, all sharing an
// icon/category/id-prefix and reading the same numeric value off the
// context. Cuts ~40 of the 51 catalog entries below down to one line each
// instead of a hand-written object apiece.
function tier(
  idPrefix: string,
  category: AchievementCategory,
  icon: LucideIcon,
  thresholds: number[],
  label: (n: number) => string,
  description: (n: number) => string,
  value: (ctx: AchievementContext) => number
): Achievement[] {
  return thresholds.map((n) => ({
    id: `${idPrefix}-${n}`,
    label: label(n),
    description: description(n),
    icon,
    category,
    check: (ctx) => value(ctx) >= n,
    progress: (ctx) => ({ current: Math.min(value(ctx), n), target: n }),
  }));
}

export const ACHIEVEMENTS: Achievement[] = [
  ...tier(
    "streak",
    "streak",
    Flame,
    [3, 7, 14, 30, 60],
    (n) => `${n}-Night Streak`,
    (n) => `Log a dream ${n} nights in a row.`,
    (ctx) => ctx.longestStreak
  ),
  ...tier(
    "dreams",
    "milestone",
    BookOpen,
    [1, 10, 25, 50, 100, 250],
    (n) => (n === 1 ? "First Dream Logged" : `${n} Dreams Logged`),
    (n) => (n === 1 ? "Log your very first dream." : `Log ${n} dreams in total.`),
    (ctx) => ctx.total
  ),
  ...tier(
    "lucid",
    "dreamType",
    Eye,
    [1, 5, 10, 25],
    (n) => (n === 1 ? "First Lucid Dream" : `${n} Lucid Dreams`),
    (n) => (n === 1 ? "Log your first lucid dream." : `Log ${n} lucid dreams.`),
    (ctx) => ctx.typeCounts.lucid
  ),
  ...tier(
    "nightmare",
    "dreamType",
    Ghost,
    [1, 5, 10, 25],
    (n) => (n === 1 ? "First Nightmare Survived" : `${n} Nightmares Survived`),
    (n) => (n === 1 ? "Log your first nightmare." : `Log ${n} nightmares.`),
    (ctx) => ctx.typeCounts.nightmare
  ),
  ...tier(
    "recurring",
    "dreamType",
    Repeat,
    [1, 5, 10],
    (n) => (n === 1 ? "First Recurring Dream" : `${n} Recurring Dreams`),
    (n) => (n === 1 ? "Tag your first dream as recurring." : `Log ${n} recurring dreams.`),
    (ctx) => ctx.typeCounts.recurring
  ),
  ...tier(
    "vivid",
    "vividness",
    Sparkles,
    [1, 10, 25],
    (n) => (n === 1 ? "Vivid Recall" : `${n} Vivid Dreams`),
    (n) => (n === 1 ? "Log a dream with max vividness (5/5)." : `Log ${n} dreams with max vividness.`),
    (ctx) => ctx.vividFiveCount
  ),
  {
    id: "avg-vividness",
    label: "Dream Photographer",
    description: "Average 4.5+ vividness across at least 10 dreams.",
    icon: Camera,
    category: "vividness",
    check: (ctx) => ctx.total >= 10 && ctx.avgVividness >= 4.5,
  },
  {
    id: "all-moods",
    label: "Full Spectrum",
    description: "Log at least one dream in every mood.",
    icon: Palette,
    category: "mood",
    check: (ctx) => ctx.allMoodsLogged,
  },
  ...MOOD_ORDER.map(
    (mood): Achievement => ({
      id: `mood-${mood}-10`,
      label: `${MOOD_META[mood].label} x10`,
      description: `Log 10 dreams feeling ${MOOD_META[mood].label.toLowerCase()}.`,
      icon: MOOD_META[mood].icon,
      category: "mood",
      check: (ctx) => ctx.moodCounts[mood] >= 10,
      progress: (ctx) => ({ current: Math.min(ctx.moodCounts[mood], 10), target: 10 }),
    })
  ),
  ...tier(
    "tag-repeat",
    "tags",
    Tag,
    [5, 10],
    (n) => `Recurring Motif x${n}`,
    (n) => `Mention the same tag in ${n} different dreams.`,
    (ctx) => ctx.maxTagCount
  ),
  ...tier(
    "tag-distinct",
    "tags",
    Layers,
    [10, 25],
    (n) => `${n} Unique Tags`,
    (n) => `Use ${n} different tags across your dreams.`,
    (ctx) => ctx.distinctTagCount
  ),
  ...tier(
    "person-repeat",
    "people",
    Users,
    [5, 10],
    (n) => `Familiar Face x${n}`,
    (n) => `Mention the same person in ${n} different dreams.`,
    (ctx) => ctx.maxPersonCount
  ),
  ...tier(
    "person-distinct",
    "people",
    Users,
    [10],
    (n) => `${n} People Remembered`,
    (n) => `Mention ${n} different people across your dreams.`,
    (ctx) => ctx.distinctPeopleCount
  ),
  ...tier(
    "setting-distinct",
    "setting",
    MapPin,
    [5, 10],
    (n) => `${n} Dream Worlds`,
    (n) => `Log dreams set in ${n} different places.`,
    (ctx) => ctx.distinctSettingCount
  ),
  {
    id: "first-public",
    label: "Going Public",
    description: "Share your first dream publicly.",
    icon: Globe,
    category: "social",
    check: (ctx) => ctx.publicCount >= 1,
  },
  ...tier(
    "public",
    "social",
    Globe,
    [10],
    (n) => `${n} Dreams Shared`,
    (n) => `Share ${n} dreams publicly.`,
    (ctx) => ctx.publicCount
  ),
  {
    id: "first-favorite",
    label: "Keepsake",
    description: "Mark your first dream as a favorite.",
    icon: Heart,
    category: "social",
    check: (ctx) => ctx.favoriteCount >= 1,
  },
  ...tier(
    "favorite",
    "social",
    Heart,
    [10],
    (n) => `${n} Favorites`,
    (n) => `Mark ${n} dreams as favorites.`,
    (ctx) => ctx.favoriteCount
  ),
  ...tier(
    "likes",
    "social",
    ThumbsUp,
    [1, 10],
    (n) => (n === 1 ? "First Admirer" : `${n} Likes Received`),
    (n) => (n === 1 ? "Receive your first like on a public dream." : `Receive ${n} likes total on your public dreams.`),
    (ctx) => ctx.likesReceived
  ),
  ...tier(
    "weekend",
    "time",
    Calendar,
    [5],
    () => "Weekend Dreamer",
    (n) => `Log ${n} dreams on a weekend.`,
    (ctx) => ctx.weekendCount
  ),
  {
    id: "year-rounder",
    label: "Year-Rounder",
    description: "Log at least one dream in every calendar month.",
    icon: CalendarDays,
    category: "time",
    check: (ctx) => ctx.distinctMonthsLogged >= 12,
  },
];

export function computeUnlockedAchievementIds(ctx: AchievementContext): string[] {
  return ACHIEVEMENTS.filter((a) => a.check(ctx)).map((a) => a.id);
}

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  streak: "Streaks",
  milestone: "Milestones",
  dreamType: "Dream Types",
  vividness: "Vividness",
  mood: "Moods",
  tags: "Tags",
  people: "People",
  setting: "Settings",
  social: "Social",
  time: "Calendar",
};

export const CATEGORY_ORDER: AchievementCategory[] = [
  "streak",
  "milestone",
  "dreamType",
  "vividness",
  "mood",
  "tags",
  "people",
  "setting",
  "social",
  "time",
];
