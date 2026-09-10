export default function DietPlanResult({ plan }) {
  if (!plan) return null;

  if (typeof plan === 'string') {
    return <div className="mt-4 whitespace-pre-wrap rounded-2xl border border-emerald-500/20 bg-slate-800/80 p-5 text-sm leading-7 text-slate-200">{plan}</div>;
  }

  const { summary, hydrationTip, totalDailyCalories, weekPlan = [] } = plan;

  return (
    <div className="mt-4 whitespace-normal rounded-2xl border border-emerald-500/20 bg-slate-800/80 p-5">
      <div className="mb-5 rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">Summary</div>
        <div className="mb-3 text-sm text-slate-200">{summary || 'No summary provided.'}</div>
        <div className="flex flex-wrap gap-2">
          <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300">
            Total Daily Calories: {totalDailyCalories ?? 'N/A'}
          </div>
          <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300">
            Hydration Tip: {hydrationTip || 'N/A'}
          </div>
        </div>
      </div>

      {weekPlan.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {weekPlan.map((day, i) => (
            <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4" key={i}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-100">{day.day || 'Day'}</div>
                <div className="text-[11px] text-slate-400">{day.calories ?? 'N/A'} kcal</div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex gap-3">
                  <span className="min-w-[78px] text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Breakfast</span>
                  <span className="text-slate-200">{day.breakfast || '-'}</span>
                </div>
                <div className="flex gap-3">
                  <span className="min-w-[78px] text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Lunch</span>
                  <span className="text-slate-200">{day.lunch || '-'}</span>
                </div>
                <div className="flex gap-3">
                  <span className="min-w-[78px] text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Dinner</span>
                  <span className="text-slate-200">{day.dinner || '-'}</span>
                </div>
                <div className="flex gap-3">
                  <span className="min-w-[78px] text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Snack</span>
                  <span className="text-slate-200">{day.snack || '-'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex justify-center py-8 text-sm text-slate-400">No plan data available.</div>
      )}
    </div>
  );
}
