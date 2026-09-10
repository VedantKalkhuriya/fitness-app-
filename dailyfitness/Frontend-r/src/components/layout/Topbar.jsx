import { useSelector } from 'react-redux';

export default function Topbar({ title }) {
  const streak = useSelector((state) => state.workout.summary?.currentStreak ?? 0);

  return (
    <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-8 py-5 backdrop-blur">
      <div className="text-xl font-black uppercase tracking-[0.2em] text-slate-100">{title}</div>
      <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-300">
        <span>🔥</span>
        <span>{streak} day streak</span>
      </div>
    </div>
  );
}
