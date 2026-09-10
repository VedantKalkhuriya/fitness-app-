import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCredentials } from '../../store/slices/authSlice';
import { setProfile } from '../../store/slices/profileSlice';
import { authApi } from '../../utils/api';

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  age: '',
  weight: '',
  height: '',
  goal: '',
  activity: '',
  diet: '',
};

export default function SignupForm({ onError }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    onError('');

    const { name, email, password, age, weight, height, goal, activity, diet } = form;
    if (!name || !email || !password || !age || !weight || !height || !goal || !activity || !diet) {
      onError('Please fill in all fields.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await authApi.signup({
        name,
        password,
        age: Number(age),
        weight: Number(weight),
        height: Number(height),
        goal,
        activityLevel: activity,
        dietPreference: diet,
      });

      dispatch(
        setCredentials({ token: data.token, userId: data.userId, userName: data.name || name })
      );
      dispatch(setProfile({ name, age, weight, height, goal, activity, diet }));
      navigate('/dashboard/overview');
    } catch (err) {
      onError(err.message || 'Unable to create the account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
          Full Name
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base opacity-70">👤</span>
          <input
            type="text"
            placeholder="John Doe"
            value={form.name}
            onChange={update('name')}
            className="w-full rounded-xl border border-slate-700 bg-slate-800/80 py-3 pl-11 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
          Email
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base opacity-70">✉️</span>
          <input
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={update('email')}
            className="w-full rounded-xl border border-slate-700 bg-slate-800/80 py-3 pl-11 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
          Password
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base opacity-70">🔒</span>
          <input
            type="password"
            placeholder="Min 8 characters"
            value={form.password}
            onChange={update('password')}
            className="w-full rounded-xl border border-slate-700 bg-slate-800/80 py-3 pl-11 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
            Age
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base opacity-70">🎂</span>
            <input
              type="number"
              placeholder="25"
              value={form.age}
              onChange={update('age')}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 py-3 pl-11 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
            Weight (kg)
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base opacity-70">⚖️</span>
            <input
              type="number"
              placeholder="70"
              value={form.weight}
              onChange={update('weight')}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 py-3 pl-11 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
            Height (cm)
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base opacity-70">📏</span>
            <input
              type="number"
              placeholder="175"
              value={form.height}
              onChange={update('height')}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 py-3 pl-11 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
            Goal
          </label>
          <div className="relative">
            <select
              value={form.goal}
              onChange={update('goal')}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 py-3 px-4 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
            >
              <option value="">Select goal</option>
              <option value="lose weight">Lose Weight</option>
              <option value="build muscle">Build Muscle</option>
              <option value="stay fit">Stay Fit</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
            Activity Level
          </label>
          <div className="relative">
            <select
              value={form.activity}
              onChange={update('activity')}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 py-3 px-4 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
            >
              <option value="">Select</option>
              <option value="sedentary">Sedentary</option>
              <option value="active">Active</option>
              <option value="very active">Very Active</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
            Diet Preference
          </label>
          <div className="relative">
            <select
              value={form.diet}
              onChange={update('diet')}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 py-3 px-4 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
            >
              <option value="">Select</option>
              <option value="veg">Vegetarian</option>
              <option value="non-veg">Non-Veg</option>
              <option value="vegan">Vegan</option>
            </select>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 w-full rounded-xl bg-emerald-400 px-4 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? 'Creating account...' : 'Create Account →'}
      </button>
    </form>
  );
}
