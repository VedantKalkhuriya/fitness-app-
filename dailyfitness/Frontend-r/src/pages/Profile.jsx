import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { setProfile } from '../store/slices/profileSlice';
import { updateUserName } from '../store/slices/authSlice';
import { calculateBMI, calculateDailyCalories } from '../utils/calculations';

export default function Profile() {
  const dispatch = useDispatch();
  const savedProfile = useSelector((state) => state.profile);
  const summary = useSelector((state) => state.workout.summary);

  const [form, setForm] = useState(savedProfile);
  const [saved, setSaved] = useState(false);

  useEffect(() => setForm(savedProfile), [savedProfile]);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function handleSave() {
    dispatch(setProfile(form));
    dispatch(updateUserName(form.name));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const bmi = calculateBMI(form.weight, form.height);
  const dailyCalories = calculateDailyCalories(form);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="MY PROFILE">
        <div className="mb-6 flex items-center gap-4 rounded-2xl border border-slate-700 bg-slate-800/80 p-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-2xl">
            💪
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-100">{form.name || '—'}</div>
            <div className="text-sm text-emerald-300">{form.goal || '—'}</div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">Full Name</label>
            <input className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none" value={form.name} onChange={update('name')} placeholder="Your name" />
          </div>
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">Age</label>
            <input type="number" className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none" value={form.age} onChange={update('age')} placeholder="25" />
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">Weight (kg)</label>
            <input type="number" className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none" value={form.weight} onChange={update('weight')} placeholder="70" />
          </div>
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">Height (cm)</label>
            <input type="number" className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none" value={form.height} onChange={update('height')} placeholder="175" />
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">Goal</label>
            <select className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none" value={form.goal} onChange={update('goal')}>
              <option value="lose weight">Lose Weight</option>
              <option value="build muscle">Build Muscle</option>
              <option value="stay fit">Stay Fit</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">Activity Level</label>
            <select className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none" value={form.activity} onChange={update('activity')}>
              <option value="sedentary">Sedentary</option>
              <option value="active">Active</option>
              <option value="very active">Very Active</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">Diet Preference</label>
          <select className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none" value={form.diet} onChange={update('diet')}>
            <option value="veg">Vegetarian</option>
            <option value="non-veg">Non-Veg</option>
            <option value="vegan">Vegan</option>
          </select>
        </div>

        <Button full className="mt-6" onClick={handleSave}>
          {saved ? '✅ Saved!' : '💾 Save Profile'}
        </Button>
      </Card>

      <Card title="YOUR STATS">
        <div className="flex flex-col gap-3">
          <StatRow label="BMI" value={bmi ?? '—'} color="text-emerald-400" />
          <StatRow label="Daily Calories Target" value={dailyCalories ? `${dailyCalories} kcal` : '—'} color="text-amber-300" />
          <StatRow label="Total Workouts" value={summary?.totalWorkoutsAllTime ?? '—'} color="text-sky-400" />
          <StatRow label="Current Streak" value={summary?.currentStreak ?? '—'} color="text-rose-400" />
        </div>
      </Card>
    </div>
  );
}

function StatRow({ label, value, color }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-3.5">
      <div className="text-sm text-slate-400">{label}</div>
      <div className={`text-lg font-semibold ${color}`}>{value}</div>
    </div>
  );
}
