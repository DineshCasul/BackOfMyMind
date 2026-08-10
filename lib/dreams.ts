import type { Dream, MoodType, DreamType } from "@/context/DreamContext";

// Postgres/PostgREST returns column names verbatim (snake_case), the app's
// own types are camelCase, so every row needs converting on the way in.
// Shared by DreamContext (the logged-in user's own dreams) and the public
// feed page (everyone's public dreams), so the two can't drift apart.
export type DreamRow = {
  id: string;
  title: string;
  description: string;
  mood: MoodType;
  date: string;
  tags: string[] | null;
  dream_type: DreamType;
  people: string[] | null;
  setting: string | null;
  vividness: number;
  is_public: boolean;
  user_id: string;
};

export function fromRow(row: DreamRow): Dream {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    mood: row.mood,
    date: row.date,
    tags: row.tags ?? [],
    dreamType: row.dream_type,
    people: row.people ?? [],
    setting: row.setting ?? "",
    vividness: row.vividness,
    isPublic: row.is_public,
  };
}
