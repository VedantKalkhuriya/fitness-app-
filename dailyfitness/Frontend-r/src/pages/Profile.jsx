import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { setProfile } from '../store/slices/profileSlice';
import { updateUserName } from '../store/slices/authSlice';
import { calculateBMI, calculateDailyCalories } from '../utils/calculations';

const GOALS = [
  { value: 'lose weight', label: 'Lose weight', detail: 'Build sustainable activity and nutrition habits.' },
  { value: 'build muscle', label: 'Build muscle', detail: 'Prioritize strength work and consistent recovery.' },
  { value: 'stay fit', label: 'Stay fit', detail: 'Maintain a balanced, active routine.' },
];

export default function Profile() {
  const dispatch = useDispatch();
  const savedProfile = useSelector((state) => state.profile);
  const summary = useSelector((state) => state.workout.summary);
  const [form, setForm] = useState(savedProfile);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm(savedProfile), [savedProfile]);
  useEffect(() => {
    if (!saved) return undefined;
    const timer = window.setTimeout(() => setSaved(false), 2800);
    return () => window.clearTimeout(timer);
  }, [saved]);

  const bmi = useMemo(() => calculateBMI(form.weight, form.height), [form.weight, form.height]);
  const dailyCalories = useMemo(() => calculateDailyCalories(form), [form]);
  const goal = GOALS.find((item) => item.value === form.goal) || GOALS[2];
  const initials = String(form.name || 'F').trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const changed = JSON.stringify(form) !== JSON.stringify(savedProfile);

  function update(field) {
    return (event) => {
      setSaved(false);
      setError('');
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };
  }

  function handleSave(event) {
    event.preventDefault();
    if (saving) return;
    const name = String(form.name || '').trim();
    const age = Number(form.age);
    const weight = Number(form.weight);
    const height = Number(form.height);
    if (!name) return setError('Enter your name to save your profile.');
    if (!Number.isFinite(age) || age < 13 || age > 120) return setError('Enter an age between 13 and 120.');
    if (!Number.isFinite(weight) || weight < 25 || weight > 350) return setError('Enter a weight between 25 and 350 kg.');
    if (!Number.isFinite(height) || height < 100 || height > 250) return setError('Enter a height between 100 and 250 cm.');

    setSaving(true);
    const nextProfile = { ...form, name, age: String(age), weight: String(weight), height: String(height) };
    dispatch(setProfile(nextProfile));
    dispatch(updateUserName(name));
    setForm(nextProfile);
    setSaved(true);
    setSaving(false);
  }

  return <main className="settings-page"><div className="settings-shell">
    <header className="settings-welcome">
      <div><span className="settings-eyebrow"><i/> YOUR SPACE, YOUR PACE</span><h1>Settings &amp; <em>profile.</em></h1><p>Keep your details current so FITAI can shape a more personal fitness experience.</p></div>
      <div className="settings-identity"><span>{initials || 'F'}</span><div><strong>{form.name || 'Your profile'}</strong><small>FITAI MEMBER</small></div></div>
    </header>

    {saved && <div className="settings-notice settings-notice-success" role="status"><span>✓</span><div><strong>Profile saved</strong><small>Your updated details are now used across your FITAI experience.</small></div><button type="button" onClick={() => setSaved(false)} aria-label="Dismiss saved message">×</button></div>}
    {error && <div className="settings-notice settings-notice-error" role="alert"><span>!</span><div><strong>Check your details</strong><small>{error}</small></div><button type="button" onClick={() => setError('')} aria-label="Dismiss error">×</button></div>}

    <div className="settings-layout">
      <section className="settings-main-column">
        <form onSubmit={handleSave} noValidate>
          <Card title="PERSONAL DETAILS" badge="PROFILE" className="settings-card">
            <p className="settings-card-copy">Your details help personalize goals, estimates, and recommendations. Update them whenever your circumstances change.</p>
            <div className="settings-form-grid">
              <label className="settings-field settings-field-wide"><span>Full name <b>*</b></span><input autoComplete="name" value={form.name || ''} onChange={update('name')} placeholder="Your name" maxLength={80}/></label>
              <label className="settings-field"><span>Age <b>*</b></span><div className="settings-input-unit"><input type="number" inputMode="numeric" min="13" max="120" value={form.age ?? ''} onChange={update('age')} placeholder="28"/><i>years</i></div></label>
              <label className="settings-field"><span>Weight <b>*</b></span><div className="settings-input-unit"><input type="number" inputMode="decimal" min="25" max="350" step="0.1" value={form.weight ?? ''} onChange={update('weight')} placeholder="70"/><i>kg</i></div></label>
              <label className="settings-field"><span>Height <b>*</b></span><div className="settings-input-unit"><input type="number" inputMode="decimal" min="100" max="250" step="0.1" value={form.height ?? ''} onChange={update('height')} placeholder="170"/><i>cm</i></div></label>
            </div>
          </Card>

          <Card title="FITNESS PREFERENCES" badge="PERSONALIZE" className="settings-card settings-preference-card">
            <p className="settings-card-copy">Set the direction for your training and food recommendations. You can change these at any time.</p>
            <div className="settings-goal-options" role="radiogroup" aria-label="Fitness goal">
              {GOALS.map((item, index) => <label className={`settings-goal-option ${form.goal === item.value ? 'is-selected' : ''}`} key={item.value}>
                <input type="radio" name="goal" value={item.value} checked={form.goal === item.value} onChange={update('goal')}/><span className="settings-goal-mark">{index === 0 ? '↘' : index === 1 ? '↗' : '◌'}</span><span><strong>{item.label}</strong><small>{item.detail}</small></span><i aria-hidden="true">{form.goal === item.value ? '✓' : ''}</i>
              </label>)}
            </div>
            <div className="settings-form-grid settings-preference-fields">
              <label className="settings-field"><span>Activity level</span><select value={form.activity || 'sedentary'} onChange={update('activity')}><option value="sedentary">Mostly seated</option><option value="active">Active</option><option value="very active">Very active</option></select><small>Used to estimate daily energy needs.</small></label>
              <label className="settings-field"><span>Diet preference</span><select value={form.diet || 'veg'} onChange={update('diet')}><option value="veg">Vegetarian</option><option value="non-veg">Non-vegetarian</option><option value="vegan">Vegan</option></select><small>Used when personalizing meal ideas.</small></label>
            </div>
            <div className="settings-form-actions"><span>{changed ? 'You have unsaved changes.' : 'Your profile is up to date.'}</span><Button type="submit" disabled={!changed || saving}>{saving ? 'Saving…' : 'Save changes'}</Button></div>
          </Card>
        </form>
      </section>

      <aside className="settings-side-column">
        <Card title="YOUR SNAPSHOT" badge="BASED ON PROFILE" className="settings-card settings-snapshot">
          <div className="settings-snapshot-intro"><span>✦</span><div><strong>{goal.label}</strong><small>{goal.detail}</small></div></div>
          <div className="settings-stat-list">
            <SettingStat label="BMI estimate" value={bmi ? `${bmi}` : '—'} note="A simple height and weight calculation"/>
            <SettingStat label="Daily energy estimate" value={dailyCalories ? `${dailyCalories.toLocaleString()} kcal` : '—'} note="General estimate, not a prescribed target"/>
            <SettingStat label="Workouts logged" value={summary?.totalWorkoutsAllTime ?? '—'} note="Completed sessions in your history"/>
            <SettingStat label="Current streak" value={summary?.currentStreak != null ? `${summary.currentStreak} days` : '—'} note="Based on your completed workout records"/>
          </div>
          <p className="settings-disclaimer">These values are informational estimates, not medical advice. Keep your profile accurate for more relevant app guidance.</p>
        </Card>
        <div className="settings-security-note"><span>⌑</span><div><strong>Your information stays yours</strong><p>Profile preferences are saved in FITAI and help tailor your dashboard, workout, and meal experiences.</p></div></div>
      </aside>
    </div>
  </div></main>;
}

function SettingStat({ label, value, note }) {
  return <div className="settings-stat"><div><span>{label}</span><small>{note}</small></div><strong>{value}</strong></div>;
}
