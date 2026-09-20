// Shown while one dream is being fetched. It is the outline of the page that
// is about to appear (the back link, the handwritten date, the title, lines
// of ruled text, a few tags, the footer), so the screen holds still and the
// real dream simply fills it in. A grid of card placeholders here would
// promise a list, which is not what opens.
export default function DreamLoading() {
  return (
    <div className="max-w-2xl mx-auto" role="status" aria-live="polite">
      <span className="sr-only">Opening your dream…</span>
      <div className="skeleton h-4 w-14 mb-6" aria-hidden="true" />
      <article className="surface relative overflow-hidden rounded-2xl p-6 sm:p-10" aria-hidden="true">
        <span className="ribbon !right-8" style={{ "--ribbon": "oklch(1 0 0 / 18%)" } as React.CSSProperties} />
        <div className="skeleton h-6 w-48" />
        <div className="mt-4 flex gap-3">
          <div className="skeleton h-3.5 w-20" />
          <div className="skeleton h-3.5 w-16" />
        </div>
        <div className="skeleton mt-3 h-9 w-4/5" />
        <div className="skeleton mt-3 mb-8 h-5 w-40" />
        <div className="ruled pl-14 pr-1 mb-8 space-y-0">
          {[100, 96, 100, 88, 100, 70].map((w, i) => (
            <div key={i} className="flex h-7 items-center">
              <div className="skeleton h-3.5" style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
        <div className="mb-6 flex gap-2">
          <div className="skeleton h-8 w-28 rounded-full" />
          <div className="skeleton h-8 w-24 rounded-full" />
        </div>
        <div className="flex items-center justify-between border-t border-dashed border-white/10 pt-5">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-8 w-16 rounded-full" />
        </div>
      </article>
    </div>
  );
}
