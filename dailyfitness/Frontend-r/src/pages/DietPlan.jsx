import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { fitnessApi } from '../utils/api';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { calculateDailyCalories } from '../utils/calculations';
import { recalculatePlanAfterMealEdit } from '../utils/dietPlanUtils';
import DietPlanResult from './DietPlanResult';

const preferenceOf = (value) => {
  if (!value) return '';
  const normalized = String(value || '').toLowerCase();
  if (normalized.includes('vegan')) return 'Vegan';
  if (normalized.includes('non')) return 'Non-vegetarian';
  return 'Vegetarian';
};

function validatePlan(plan) {
  if (!plan || typeof plan.summary !== 'string' || !plan.summary.trim() || !Array.isArray(plan.weekPlan) || plan.weekPlan.length !== 7) return 'This response did not contain a complete seven-day meal plan.';
  if (plan.weekPlan.some((day) => !day?.day || !Array.isArray(day.meals) || day.meals.length < 3 || day.meals.length > 6 || day.meals.some((meal) => !meal?.name || !meal?.mealType || (meal.ingredients || []).some((ingredient) => !ingredient?.name?.trim())))) return 'Some days are missing structured meal details. Try generating the plan again.';
  return '';
}

export default function DietPlan() {
  const userId = useSelector((state) => state.auth.userId);
  const profile = useSelector((state) => state.profile);
  const [savedRestrictions, setSavedRestrictions] = useLocalStorage('diet-notes', '');
  const [form, setForm] = useState(() => ({
    dietaryPreference: preferenceOf(profile?.dietPreference || profile?.diet),
    restrictions: savedRestrictions,
    budget: '',
    availableIngredients: '',
    mealsPerDay: 4,
    fitnessGoal: profile?.goal || 'stay fit',
  }));
  const [plans, setPlans] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [plan, setPlan] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [substitution, setSubstitution] = useState(null);
  const [substitutionError, setSubstitutionError] = useState('');
  const [substitutionLoading, setSubstitutionLoading] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  const activeSavedProfile = typeof localStorage !== 'undefined' && Boolean(localStorage.getItem('userProfile'));
  const profileCalorieEstimate = useMemo(() => activeSavedProfile ? calculateDailyCalories(profile) : null, [profile, activeSavedProfile]);
  const selectedRecord = plans.find((item) => String(item.id) === String(selectedId)) || null;

  const loadPlans = useCallback(async () => {
    if (!userId) return;
    setStatus('loading'); setError('');
    try {
      const saved = await fitnessApi.getDietPlans(userId);
      const allSaved = Array.isArray(saved) ? saved : [];
      const valid = allSaved.filter((item) => !validatePlan(item?.plan));
      setPlans(allSaved);
      const chosen = valid.find((item) => String(item.id) === String(selectedIdRef.current)) || valid[0] || null;
      setSelectedId(String(chosen?.id || ''));
      setPlan(chosen?.plan || null); setDirty(false); setEditing(false);
      setStatus('succeeded');
    } catch (loadError) {
      setStatus('failed'); setError(loadError?.message || 'Saved meal plans could not be loaded.');
    }
  }, [userId]);

  useEffect(() => { loadPlans(); }, [loadPlans, retryKey]);
  useEffect(() => { setForm((current) => ({ ...current, dietaryPreference: preferenceOf(profile?.dietPreference || profile?.diet), fitnessGoal: profile?.goal || current.fitnessGoal })); }, [profile]);
  useEffect(() => { setSavedRestrictions(form.restrictions); }, [form.restrictions, setSavedRestrictions]);

  function canLeaveEdits() {
    return !dirty || window.confirm('Discard your unsaved meal plan edits?');
  }
  function choosePlan(id) {
    if (String(id) === String(selectedId)) return;
    if (!canLeaveEdits()) return;
    const record = plans.find((item) => String(item.id) === String(id));
    if (!record?.plan) { setError('This older saved version does not contain structured meal data. Generate a new plan to use the meal tools.'); return; }
    setSelectedId(String(id)); setPlan(record.plan); setEditing(false); setDirty(false); setError(''); setMessage('');
  }

  async function generatePlan(event) {
    event.preventDefault();
    if (generating || saving) return;
    if (form.restrictions.length > 1000 || form.availableIngredients.length > 600 || form.budget.length > 100) {
      setError('Please shorten the restrictions, ingredient list, or budget note to fit the limits shown.'); return;
    }
    if (!canLeaveEdits()) return;
    setError(''); setMessage(''); setGenerating(true);
    try {
      const generated = await fitnessApi.generateDietPlan(userId, { ...form, mealsPerDay: Number(form.mealsPerDay) });
      const validation = validatePlan(generated?.plan);
      if (validation || !generated?.id) throw new Error(validation || 'The server did not return the saved plan record.');
      setPlans((current) => [generated, ...current.filter((item) => String(item.id) !== String(generated.id))]);
      setSelectedId(String(generated.id)); setPlan(generated.plan); setEditing(false); setDirty(false);
      setMessage('Your structured meal plan has been generated and saved. Previous versions are preserved.');
    } catch (generateError) {
      setError(generateError?.message || 'Meal plan generation failed. Please retry.');
    } finally { setGenerating(false); }
  }

  async function savePlan() {
    if (!selectedRecord || !plan || saving || generating) return;
    const validation = validatePlan(plan);
    if (validation) { setError(validation); return; }
    setError(''); setMessage(''); setSaving(true);
    try {
      const updated = await fitnessApi.updateDietPlan(userId, selectedRecord.id, plan);
      setPlans((current) => current.map((item) => String(item.id) === String(updated.id) ? updated : item));
      setPlan(updated.plan); setDirty(false); setEditing(false); setMessage('Your meal plan changes are saved.');
    } catch (saveError) {
      setError(saveError?.message || 'Your edits could not be saved. They are still on this screen; try again.');
    } finally { setSaving(false); }
  }

  function updatePlan(next) { setPlan(next); setDirty(true); setMessage(''); }

  async function replaceMeal() {
    if (!substitution || substitutionLoading) return;
    const currentMeal = plan?.weekPlan?.[substitution.dayIndex]?.meals?.[substitution.mealIndex];
    if (!currentMeal) return;
    setSubstitutionError(''); setSubstitutionLoading(true);
    try {
      const replacement = await fitnessApi.substituteDietMeal(userId, {
        dietaryPreference: form.dietaryPreference,
        restrictions: form.restrictions,
        mealType: currentMeal.mealType,
        currentMealName: currentMeal.name,
        currentMeal,
        ingredientToReplace: substitution.ingredient || '',
      });
      if (!replacement?.name || !replacement?.mealType) throw new Error('The substitution response was incomplete. Retry to get another option.');
      const updatedDays = plan.weekPlan.map((day, dayIndex) => dayIndex !== substitution.dayIndex ? day : ({ ...day, meals: day.meals.map((meal, mealIndex) => mealIndex === substitution.mealIndex ? replacement : meal) }));
      updatePlan(recalculatePlanAfterMealEdit({ ...plan, weekPlan: updatedDays }));
      setSubstitution(null); setMessage(substitution.ingredient ? `${substitution.ingredient} was replaced. Save your plan to keep the change.` : `${currentMeal.mealType} was replaced. Save your plan to keep the change.`);
    } catch (replaceError) {
      setSubstitutionError(replaceError?.message || 'The meal substitution failed. Try again.');
    } finally { setSubstitutionLoading(false); }
  }

  function beginGenerate() {
    document.getElementById('diet-generation-form')?.requestSubmit();
  }

  return <main className="diet-page"><div className="diet-shell">
    <header className="diet-welcome"><div><span className="diet-eyebrow"><i/> PERSONAL MEAL PLANNING</span><h1>Eat with <em>intention.</em></h1><p>Practical meals shaped around your goal, preferences, and what you have on hand.</p></div><div className="diet-profile-badges"><span><small>FITNESS GOAL</small><strong>{profile?.goal || 'Not set'}</strong></span><span><small>DIET PREFERENCE</small><strong>{preferenceOf(profile?.dietPreference || profile?.diet) || 'Not set'}</strong></span></div></header>
    {profileCalorieEstimate && <div className="diet-target-note"><span>◌</span><div><strong>Profile calorie estimate · {profileCalorieEstimate.toLocaleString()} kcal/day</strong><small>Calculated from your saved profile using the app’s estimate. It is not a prescribed target.</small></div></div>}
    {error && <div className="diet-error" role="alert"><span>{error}</span><button onClick={() => setError('')}>Dismiss</button></div>}
    {message && <div className="diet-success" role="status"><span>✓</span>{message}<button onClick={() => setMessage('')} aria-label="Dismiss confirmation">×</button></div>}

    <div className="diet-layout"><aside className="diet-sidebar">
      <Card title="BUILD A MEAL PLAN" badge="AI Powered" className="diet-form-card"><p className="diet-form-copy">Tell FITAI what matters. Plans are saved as versions, so a regeneration never erases an earlier plan.</p><form id="diet-generation-form" onSubmit={generatePlan}>
        <label className="diet-field"><span>Fitness goal</span><select value={form.fitnessGoal} onChange={(event) => setForm((current) => ({ ...current, fitnessGoal: event.target.value }))}><option value="lose weight">Lose weight</option><option value="build muscle">Build muscle</option><option value="stay fit">Stay fit</option></select><small>Prefilled from your saved profile; change it for this plan if needed.</small></label>
        <label className="diet-field"><span>Dietary preference <b>*</b></span><select required value={form.dietaryPreference} onChange={(event) => setForm((current) => ({ ...current, dietaryPreference: event.target.value }))}><option value="">Choose preference</option><option>Vegetarian</option><option>Non-vegetarian</option><option>Vegan</option></select></label>
        <label className="diet-field"><span>Meals per day</span><select value={form.mealsPerDay} onChange={(event) => setForm((current) => ({ ...current, mealsPerDay: Number(event.target.value) }))}><option value={3}>3 meals</option><option value={4}>3 meals + snack</option><option value={5}>3 meals + 2 snacks</option><option value={6}>6 smaller meals</option></select></label>
        <label className="diet-field"><span>Restrictions, allergies, dislikes</span><textarea maxLength={1000} rows={3} value={form.restrictions} onChange={(event) => setForm((current) => ({ ...current, restrictions: event.target.value }))} placeholder="List allergies and foods to avoid"/><small>Allergies are passed as strict constraints. Always verify labels yourself.</small></label>
        <label className="diet-field"><span>Budget guidance <small>(optional)</small></span><input maxLength={100} value={form.budget} onChange={(event) => setForm((current) => ({ ...current, budget: event.target.value }))} placeholder="e.g. budget-friendly, under $60/week"/></label>
        <label className="diet-field"><span>Ingredients you already have <small>(optional)</small></span><textarea maxLength={600} rows={2} value={form.availableIngredients} onChange={(event) => setForm((current) => ({ ...current, availableIngredients: event.target.value }))} placeholder="e.g. lentils, rice, spinach"/></label>
        <Button full type="submit" disabled={generating || saving}>{generating ? <><i className="diet-spinner"/>Creating your plan…</> : 'Generate & save a new plan ↗'}</Button>
      </form></Card>

      <Card title="SAVED PLANS" action={status === 'loading' && <span className="diet-muted">Loading…</span>} className="diet-saved-card">{status === 'failed' && <div className="diet-inline-error">{error || 'Could not load saved plans.'}<button onClick={() => setRetryKey((value) => value + 1)}>Retry ↻</button></div>}{status === 'succeeded' && plans.length > 0 ? <label className="diet-field"><span>Choose a saved version</span><select value={selectedId} onChange={(event) => choosePlan(event.target.value)}>{plans.map((item) => <option value={item.id} key={item.id} disabled={!item.plan}>{new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {item.plan?.summary?.slice(0, 55) || 'Older plan · structured details unavailable'}</option>)}</select></label> : status === 'succeeded' && <p className="diet-muted">No saved meal plans yet. Generate one to get started.</p>}{selectedRecord?.plan && <div className="diet-plan-version"><span>SELECTED PLAN</span><strong>{selectedRecord.plan.summary?.slice(0, 90)}</strong><small>Saved {new Date(selectedRecord.createdAt).toLocaleString('en-IN')}</small></div>}</Card>
      <div className="diet-ai-note"><span>✳</span><div><strong>AI meal ideas, thoughtfully framed</strong><p>Nutrition values are approximate. The coach does not diagnose or prescribe nutrition treatment.</p></div></div>
    </aside>

    <section className="diet-content"><div className="diet-content-header"><div><span className="diet-eyebrow">YOUR MEAL PLAN</span><h2>{plan?.summary ? 'A plan you can work with.' : 'Your table is ready.'}</h2></div>{plan && <div className="diet-plan-actions">{editing ? <Button small variant="secondary" onClick={() => { if (canLeaveEdits()) { setEditing(false); if (selectedRecord) setPlan(selectedRecord.plan); setDirty(false); } }}>Cancel edits</Button> : <Button small variant="secondary" onClick={() => setEditing(true)}>Edit plan</Button>}<Button small disabled={!dirty || saving || generating} onClick={savePlan}>{saving ? 'Saving…' : 'Save changes'}</Button><Button small variant="secondary" disabled={generating || saving} onClick={beginGenerate}>Regenerate</Button></div>}</div>
      {status === 'loading' && !plan ? <div className="diet-skeleton"><i/><i/><i/><i/><div><i/><i/></div></div> : plan ? <DietPlanResult plan={plan} onChange={updatePlan} editable={editing} onSubstitute={(dayIndex, mealIndex, ingredient) => { setSubstitution({ dayIndex, mealIndex, ingredient }); setSubstitutionError(''); }} substitutingMeal={substitutionLoading}/> : <div className="diet-empty"><span>◌</span><h3>Start with a plan that fits real life.</h3><p>Choose your dietary preference, note any restrictions, and tell us what’s already in your kitchen. Your first plan will appear here and be saved to your account.</p><button onClick={() => document.getElementById('diet-generation-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Set up your plan ↑</button></div>}
    </section></div>

    {substitution && plan && <div className="diet-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !substitutionLoading) setSubstitution(null); }}><section className="diet-modal" role="dialog" aria-modal="true" aria-labelledby="diet-sub-title"><header><div><span className="diet-eyebrow">MEAL SUBSTITUTION</span><h2 id="diet-sub-title">Find an alternative</h2></div><button type="button" disabled={substitutionLoading} onClick={() => setSubstitution(null)} aria-label="Close substitution dialog">×</button></header><p>FITAI will suggest an alternative that follows the selected {form.dietaryPreference.toLowerCase()} preference and the restrictions in your plan.</p><div className="diet-sub-current"><span>{plan.weekPlan[substitution.dayIndex]?.day} · {plan.weekPlan[substitution.dayIndex]?.meals[substitution.mealIndex]?.mealType}</span><strong>{plan.weekPlan[substitution.dayIndex]?.meals[substitution.mealIndex]?.name}</strong>{substitution.ingredient && <small>Replace ingredient: {substitution.ingredient}</small>}</div>{substitutionError && <div className="diet-inline-error" role="alert">{substitutionError}</div>}<div className="diet-modal-actions"><Button variant="secondary" disabled={substitutionLoading} onClick={() => setSubstitution(null)}>Keep current meal</Button><Button disabled={substitutionLoading} onClick={replaceMeal}>{substitutionLoading ? <><i className="diet-spinner"/>Finding alternative…</> : 'Generate alternative ↗'}</Button></div></section></div>}
  </div></main>;
}
