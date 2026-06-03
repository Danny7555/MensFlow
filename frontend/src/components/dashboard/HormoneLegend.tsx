
export function HormoneLegend() {
  return (
    <div className="flex items-center gap-4 text-[11px] font-normal">
      <div className="flex items-center gap-2">
        <span className="w-3.5 h-2 rounded-full bg-pink-500" />
        <span className="text-[var(--mf-text)] font-normal">Estrogen</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-3.5 h-2 rounded-full bg-violet-500" />
        <span className="text-[var(--mf-text)] font-normal">Progesterone</span>
      </div>
    </div>
  )
}
