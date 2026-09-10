export default function Card({ title, badge, action, children, style, className = '' }) {
  return (
    <div className={`rounded-2xl border border-slate-700 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/20 ${className}`} style={style}>
      {(title || badge || action) && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          {title && <div className="text-lg font-black uppercase tracking-[0.12em] text-slate-100">{title}</div>}
          {badge && <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300">{badge}</span>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
