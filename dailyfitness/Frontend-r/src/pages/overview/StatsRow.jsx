export default function StatsRow({ summary }) {
  const stats = [
    { label: 'Total Workouts', value: summary?.totalWorkoutsAllTime ?? 0, sub: 'All time', color: 'text-emerald-400' },
    { label: 'This Week', value: summary?.workoutsThisWeek ?? 0, sub: 'Sessions', color: 'text-sky-400' },
    { label: 'Calories Burned', value: summary?.totalCaloriesThisWeek ?? 0, sub: 'This week', color: 'text-amber-300' },
    { label: 'Minutes Trained', value: summary?.totalMinutesThisWeek ?? 0, sub: 'This week', color: 'text-rose-400' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((s) => (
        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5" key={s.label}>
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">{s.label}</div>
          <div className={`text-4xl font-black tracking-tight ${s.color}`}>{s.value}</div>
          <div className="mt-2 text-xs text-slate-400">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}
