import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import { fetchSummary, fetchHistory } from '../store/slices/workoutSlice';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { fitnessApi } from '../utils/api';
import WeeklySummaryCard from './history/WeeklySummaryCard';
import AiHistoryCard from './history/AiHistoryCard';

const PILL_CLASS = {
  Great: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  Tired: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  Average: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
};

function isoDate(date) {
  return date.toISOString().split('T')[0];
}

export default function History() {
  const dispatch = useDispatch();
  const userId = useSelector((state) => state.auth.userId);
  const { summary, history, summaryStatus, historyStatus } = useSelector((state) => state.workout);

  const [start, setStart] = useState(isoDate(new Date(Date.now() - 7 * 86400000)));
  const [end, setEnd] = useState(isoDate(new Date()));

  const loadAiHistory = useCallback(() => fitnessApi.getAiHistory(userId), [userId]);
  const { run: runAiHistory, data: aiHistory } = useAsyncAction(loadAiHistory);

  function loadAll() {
    dispatch(fetchHistory({ userId, range: { start, end } }));
    dispatch(fetchSummary(userId));
    runAiHistory();
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <Card
        title="WORKOUT HISTORY"
        action={
          <div className="flex flex-wrap gap-2">
            <input
              type="date"
              className="w-[150px] rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-emerald-400"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
            <input
              type="date"
              className="w-[150px] rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-emerald-400"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
            <Button variant="secondary" small onClick={() => dispatch(fetchHistory({ userId, range: { start, end } }))}>
              Filter
            </Button>
          </div>
        }
      >
        {historyStatus === 'loading' && <div className="flex items-center justify-center gap-3 py-5 text-sm text-slate-400"><div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-400" /> Loading...</div>}
        {historyStatus !== 'loading' && history.length === 0 && (
          <EmptyState icon="📅" text="No workouts found for this period." />
        )}
        {historyStatus !== 'loading' && history.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr>
                  <th className="pb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">Date</th>
                  <th className="pb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">Type</th>
                  <th className="pb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">Duration</th>
                  <th className="pb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">Calories</th>
                  <th className="pb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">Feeling</th>
                  <th className="pb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">Exercises</th>
                </tr>
              </thead>
              <tbody>
                {history.map((w, i) => (
                  <tr key={i} className="border-t border-slate-700">
                    <td className="border-t border-slate-700 py-3 pr-3 text-slate-300">{w.workoutDate}</td>
                    <td className="border-t border-slate-700 py-3 pr-3 font-semibold text-slate-100">{w.workoutType}</td>
                    <td className="border-t border-slate-700 py-3 pr-3 text-slate-300">{w.durationMinutes} mins</td>
                    <td className="border-t border-slate-700 py-3 pr-3 text-slate-300">{w.caloriesBurned} kcal</td>
                    <td className="border-t border-slate-700 py-3 pr-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${PILL_CLASS[w.feeling] || 'border-sky-500/30 bg-sky-500/10 text-sky-300'}`}>
                        {w.feeling}
                      </span>
                    </td>
                    <td className="border-t border-slate-700 py-3 text-slate-400">{(w.exercises || []).length} exercises</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <WeeklySummaryCard summary={summary} loading={summaryStatus === 'loading'} />
        <AiHistoryCard entries={aiHistory || []} />
      </div>
    </div>
  );
}
