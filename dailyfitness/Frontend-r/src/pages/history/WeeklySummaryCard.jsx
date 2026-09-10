import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function WeeklySummaryCard({ summary, loading }) {
  return (
    <Card title="WEEKLY SUMMARY">
      {loading && <LoadingSpinner text="Loading..." />}
      {!loading && summary && (
        <div>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">Sessions</div>
              <div className="mt-2 text-3xl font-black text-emerald-400">{summary.workoutsThisWeek ?? 0}</div>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">Minutes</div>
              <div className="mt-2 text-3xl font-black text-sky-400">{summary.totalMinutesThisWeek ?? 0}</div>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">Calories</div>
              <div className="mt-2 text-3xl font-black text-amber-300">{summary.totalCaloriesThisWeek ?? 0}</div>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">Streak</div>
              <div className="mt-2 text-3xl font-black text-rose-400">{summary.currentStreak ?? 0}</div>
            </div>
          </div>
          <div className="whitespace-pre-wrap text-sm leading-7 text-slate-400">
            {summary.aiWeeklyAnalysis || ''}
          </div>
        </div>
      )}
    </Card>
  );
}
