import { useSelector } from 'react-redux';
import { useCallback } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { fitnessApi } from '../utils/api';
import DietPlanResult from './DietPlanResult';

const TIPS = [
  { icon: '💧', title: 'Stay Hydrated', text: 'Drink at least 8 glasses of water daily.' },
  { icon: '⏰', title: 'Meal Timing', text: 'Eat every 3–4 hours to keep metabolism active.' },
  { icon: '🥩', title: 'Protein First', text: 'Prioritize protein in every meal for muscle recovery.' },
];

export default function DietPlan() {
  const userId = useSelector((state) => state.auth.userId);
  const [notes, setNotes] = useLocalStorage('diet-notes', '');

  const generate = useCallback((n) => fitnessApi.generateDietPlan(userId, n), [userId]);
  const { run, data: plan, loading } = useAsyncAction(generate);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="GENERATE DIET PLAN" badge="AI Powered">
          <p className="mb-5 text-sm text-slate-400">
            Your profile info is used automatically. Click generate to get a personalised 7-day meal plan.
          </p>

          <div className="mb-4">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              Any specific requirements?
            </label>
            <textarea
              className="min-h-[110px] w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
              placeholder="e.g. I have a nut allergy, prefer Indian food, low carb..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button full onClick={() => run(notes)} disabled={loading}>
            🥗 {loading ? 'Generating...' : 'Generate My Diet Plan'}
          </Button>
        </Card>

        <Card title="TIPS">
          <div className="flex flex-col gap-4">
            {TIPS.map((t) => (
              <div key={t.title} className="flex items-start gap-3">
                <span className="text-xl">{t.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-slate-100">{t.title}</div>
                  <div className="mt-1 text-xs text-slate-400">{t.text}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="YOUR DIET PLAN">
        {loading && <LoadingSpinner text="Generating your personalised diet plan..." />}
        {!loading && plan && <DietPlanResult plan={plan} />}
        {!loading && !plan && (
          <div className="px-4 py-8 text-center text-sm text-slate-400">
            Click "Generate My Diet Plan" to get started 👆
          </div>
        )}
      </Card>
    </div>
  );
}
