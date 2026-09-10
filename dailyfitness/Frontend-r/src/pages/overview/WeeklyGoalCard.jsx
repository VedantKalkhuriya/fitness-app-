import Card from '../../components/common/Card';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const TARGET_DAYS = 5;

export default function WeeklyGoalCard({ workoutsThisWeek = 0 }) {
  const percent = Math.min(100, (workoutsThisWeek / TARGET_DAYS) * 100);

  return (
    <Card title="WEEKLY GOAL" badge={`${TARGET_DAYS} days target`}>
      <div className="mb-3 text-sm text-slate-400">
        {workoutsThisWeek} of {TARGET_DAYS} days completed
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-emerald-400 transition-all duration-500" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {DAY_LABELS.map((day, i) => (
          <div
            key={i}
            className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold ${
              i < workoutsThisWeek
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border-slate-700 bg-slate-800 text-slate-500'
            }`}
          >
            {day}
          </div>
        ))}
      </div>
    </Card>
  );
}
