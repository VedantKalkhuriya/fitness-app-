import { useSelector } from 'react-redux';
import { useCallback, useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { fitnessApi } from '../utils/api';

const MUSCLE_GROUPS = [
  { icon: '🫁', label: 'Chest' },
  { icon: '🦵', label: 'Legs' },
  { icon: '💪', label: 'Arms' },
  { icon: '🔙', label: 'Back' },
  { icon: '🏃', label: 'Cardio' },
  { icon: '🧘', label: 'Core' },
];

export default function WorkoutPlan() {
  const userId = useSelector((state) => state.auth.userId);
  const [focus, setFocus] = useState('');
  const [equipment, setEquipment] = useState('gym');

  const generate = useCallback(() => fitnessApi.generateWorkoutPlan(userId), [userId]);
  const { run, data: plan, loading } = useAsyncAction(generate);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="GENERATE WORKOUT PLAN" badge="AI Powered">
          <p className="mb-5 text-sm text-slate-400">
            Get a personalised 7-day workout plan based on your profile and goals.
          </p>

          <div className="mb-4">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              Focus area (optional)
            </label>
            <input
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
              placeholder="e.g. more chest and shoulders, home workout only..."
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              Available equipment
            </label>
            <select
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
            >
              <option value="gym">Full Gym</option>
              <option value="dumbbells">Dumbbells Only</option>
              <option value="home">No Equipment (Bodyweight)</option>
              <option value="resistance bands">Resistance Bands</option>
            </select>
          </div>

          <Button full onClick={() => run()} disabled={loading}>
            💪 {loading ? 'Creating...' : 'Generate My Workout Plan'}
          </Button>
        </Card>

        <Card title="MUSCLE GROUPS">
          <div className="grid grid-cols-2 gap-3">
            {MUSCLE_GROUPS.map((m) => (
              <div
                key={m.label}
                className="rounded-xl border border-slate-700 bg-slate-800/80 p-4 text-center"
              >
                <div className="mb-2 text-2xl">{m.icon}</div>
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-200">{m.label}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="YOUR WORKOUT PLAN">
        {loading && <LoadingSpinner text="Creating your personalised workout plan..." />}
        {!loading && plan && <div className="mt-4 whitespace-pre-wrap rounded-2xl border border-emerald-500/20 bg-slate-800/80 p-5 text-sm leading-7 text-slate-200">{plan}</div>}
        {!loading && !plan && (
          <div className="px-4 py-8 text-center text-sm text-slate-400">
            Click "Generate My Workout Plan" to get started 👆
          </div>
        )}
      </Card>
    </div>
  );
}
