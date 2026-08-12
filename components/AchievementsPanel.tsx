"use client";

import { useAchievements } from "@/context/AchievementContext";
import { ACHIEVEMENTS, CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/achievements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingState from "@/components/LoadingState";
import { cn } from "@/lib/utils";
import { Award } from "lucide-react";

export default function AchievementsPanel() {
  const { stats, unlockedIds, loading } = useAchievements();

  if (loading) {
    return <LoadingState label="Tallying your badges…" />;
  }

  return (
    <>
      <div className="flex items-center gap-2.5 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
        <Award className="size-6 text-primary" strokeWidth={1.5} />
        <h2 className="text-2xl font-serif">Achievements</h2>
        <span className="text-sm text-muted-foreground ml-1">
          {unlockedIds.size}/{ACHIEVEMENTS.length}
        </span>
      </div>

      <div className="flex flex-col gap-6">
        {CATEGORY_ORDER.map((category) => {
          const items = ACHIEVEMENTS.filter((a) => a.category === category);
          return (
            <Card key={category} className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
              <CardHeader>
                <CardTitle className="text-base font-serif">{CATEGORY_LABELS[category]}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {items.map((achievement) => {
                    const isUnlocked = unlockedIds.has(achievement.id);
                    const progress = !isUnlocked ? achievement.progress?.(stats) : undefined;
                    const Icon = achievement.icon;
                    return (
                      <div
                        key={achievement.id}
                        title={achievement.description}
                        className={cn(
                          "flex flex-col items-center text-center gap-1.5 rounded-xl border p-3 transition-all duration-200",
                          isUnlocked
                            ? "border-primary/40 bg-primary/10 hover:-translate-y-0.5"
                            : "border-border bg-card/50 opacity-60"
                        )}
                      >
                        <Icon
                          className={cn("size-5", isUnlocked ? "text-primary" : "text-muted-foreground")}
                          strokeWidth={1.5}
                        />
                        <p className="text-xs font-medium leading-tight">{achievement.label}</p>
                        {progress && progress.target > 1 && (
                          <div className="w-full h-1 rounded-full bg-muted overflow-hidden mt-0.5">
                            <div
                              className="h-full bg-primary/60"
                              style={{ width: `${Math.min(100, (progress.current / progress.target) * 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
