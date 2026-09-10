import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';

const PILL_CLASS = {
  Great: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  Tired: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  Average: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
};

export default function RecentWorkoutsCard({ workouts = [] }) {
  const navigate = useNavigate();
  const recent = workouts.slice(0, 5);

  return (
    <Card
      title="RECENT WORKOUTS"
      action={
        <Button variant="secondary" small onClick={() => navigate('/dashboard/history')}>
          View All
        </Button>
      }
    >
      {recent.length === 0 ? (
        <EmptyState icon="🏋️" text="No workouts logged yet. Start today!" />
      ) : (
        recent.map((w, i) => (
          <div
            key={i}
            className={`flex items-center justify-between gap-3 border-b border-slate-700 py-4 last:border-b-0 first:pt-0`}
          >
            <div>
              <div className="text-sm font-semibold text-slate-100">{w.workoutType}</div>
              <div className="mt-1 text-xs text-slate-400">
                {w.durationMinutes} mins · {w.caloriesBurned} kcal
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${PILL_CLASS[w.feeling] || 'border-sky-500/30 bg-sky-500/10 text-sky-300'}`}>
                {w.feeling}
              </div>
              <div className="mt-2 text-[11px] text-slate-400">{w.workoutDate}</div>
            </div>
          </div>
        ))
      )}
    </Card>
  );
}
