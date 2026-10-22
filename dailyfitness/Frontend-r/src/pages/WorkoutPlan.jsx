import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { fitnessApi } from '../utils/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const EQUIPMENT = ['Full gym', 'Dumbbells', 'Resistance bands', 'Bodyweight'];
const fieldClass = 'wp-field';

function todayName() {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
}

export default function WorkoutPlan() {
  const userId = useSelector((state) => state.auth.userId);
  const profile = useSelector((state) => state.profile);
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [selectedDay, setSelectedDay] = useState(todayName());
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [form, setForm] = useState({
    goal: profile?.goal || 'build muscle',
    experienceLevel: 'beginner',
    equipment: ['Full gym'],
    trainingDaysPerWeek: 4,
    sessionDurationMinutes: 45,
    limitations: '',
  });

  const loadPlans = useCallback(async () => {
    if (!userId) return;
    setStatus('loading');
    setError('');
    try {
      const result = await fitnessApi.getWorkoutPlans(userId);
      const savedPlans = Array.isArray(result) ? result : [];
      setPlans(savedPlans);
      setSelectedId((current) => savedPlans.some((plan) => String(plan.id) === String(current))
        ? current
        : String(savedPlans.find((plan) => plan.active)?.id || savedPlans[0]?.id || ''));
      setStatus('succeeded');
    } catch (err) {
      setStatus('failed');
      setError(err.message || 'Could not load saved plans.');
    }
  }, [userId]);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  const selectedPlan = plans.find((item) => String(item.id) === String(selectedId)) || null;
  const activePlan = plans.find((item) => item.active) || null;
  const visiblePlan = editing && draft && selectedPlan ? { ...selectedPlan, plan: draft } : selectedPlan;
  const selectedDayPlan = useMemo(() => visiblePlan?.plan?.weekPlan?.find((day) => day.day?.toLowerCase() === selectedDay.toLowerCase()) || null, [visiblePlan, selectedDay]);
  const selectedDayIndex = draft?.weekPlan?.findIndex((day) => day.day?.toLowerCase() === selectedDay.toLowerCase()) ?? -1;

  function toggleEquipment(item) {
    setForm((current) => ({
      ...current,
      equipment: current.equipment.includes(item)
        ? current.equipment.filter((value) => value !== item)
        : [...current.equipment, item],
    }));
  }

  function canDiscardEdits() {
    return !editing || window.confirm('Discard your unsaved plan edits?');
  }

  async function generatePlan(event) {
    event.preventDefault();
    if (!form.equipment.length) {
      setError('Choose at least one available equipment option.');
      return;
    }
    if (editing && !window.confirm('Discard your unsaved edits and generate a new plan?')) return;
    setError(''); setMessage(''); setGenerating(true); setEditing(false); setDraft(null);
    try {
      const generated = await fitnessApi.generateWorkoutPlan(userId, form);
      await loadPlans();
      setSelectedId(String(generated.id));
      setSelectedDay('Monday');
      setMessage(generated.active ? 'Plan generated, saved, and set as your active plan.' : 'Plan generated and saved. Your current active plan is unchanged.');
    } catch (err) {
      setError(err.message || 'Plan generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  async function activatePlan(planId) {
    if (activePlan && String(activePlan.id) !== String(planId) &&
        !window.confirm('Make this plan active? Your current active plan will remain saved, but this plan will become your active schedule.')) return;
    setError(''); setMessage('');
    try {
      const updated = await fitnessApi.activateWorkoutPlan(userId, planId);
      setPlans((current) => current.map((item) => ({ ...item, active: String(item.id) === String(updated.id) })));
      setSelectedId(String(updated.id));
      setEditing(false); setDraft(null);
      setMessage(`${updated.plan.planName} is now your active plan.`);
    } catch (err) {
      setError(err.message || 'Could not activate this plan.');
    }
  }

  function startWorkout() {
    if (!selectedPlan || !selectedDayPlan || selectedDayPlan.restDay) return;
    navigate('/dashboard/log-workout', { state: { planWorkout: { ...selectedDayPlan, planName: selectedPlan.plan.planName } } });
  }

  function beginEditing() {
    if (!selectedPlan) return;
    setDraft(structuredClone(selectedPlan.plan));
    setEditing(true); setMessage(''); setError('');
  }

  function updateExercise(dayIndex, exerciseIndex, field, value) {
    setDraft((current) => ({
      ...current,
      weekPlan: current.weekPlan.map((day, d) => d !== dayIndex ? day : ({
        ...day,
        exercises: day.exercises.map((exercise, e) => e !== exerciseIndex ? exercise : ({ ...exercise, [field]: value })),
      })),
    }));
  }

  async function saveEdits() {
    if (!selectedPlan || !draft) return;
    setSaving(true); setError(''); setMessage('');
    try {
      const updated = await fitnessApi.updateWorkoutPlan(userId, selectedPlan.id, draft);
      setPlans((current) => current.map((item) => item.id === updated.id ? updated : item));
      setEditing(false); setDraft(null); setMessage('Plan changes saved.');
    } catch (err) {
      setError(err.message || 'Could not save plan changes.');
    } finally {
      setSaving(false);
    }
  }

  const formField = (label, name, control) => <label className="wp-form-field"><span>{label}</span>{control}</label>;

  return <div className="wp-page">
    <header className="wp-heading"><div><div className="wp-kicker"><i/> YOUR TRAINING, YOUR WAY</div><h1>Workout <span>Plan</span></h1><p>Build a routine that fits your goals, your schedule, and your equipment.</p></div><div className="wp-heading-icon">✳</div></header>

    {error && <div className="wp-alert error" role="alert"><span>{error}</span><button onClick={() => { setError(''); if (status === 'failed') loadPlans(); }}>Dismiss</button></div>}
    {message && <div className="wp-alert success" role="status"><span>✓</span>{message}<button onClick={() => setMessage('')} aria-label="Dismiss message">×</button></div>}

    <div className="wp-layout">
      <div className="wp-main-column">
        {status === 'loading' ? <Card title="YOUR ACTIVE PLAN"><div className="wp-loading"><i/><i/><i/></div></Card> : status === 'failed' ? <Card title="YOUR WORKOUT PLANS"><div className="wp-empty"><span>!</span><strong>We couldn’t load your plans.</strong><p>{error || 'Check your connection and try again.'}</p><Button small onClick={loadPlans}>Retry</Button></div></Card> : plans.length === 0 ? <Card title="YOUR WORKOUT PLAN"><div className="wp-empty"><span>✳</span><strong>Your first plan starts here.</strong><p>Choose your goal, equipment, and weekly schedule. FITAI will build a structured plan you can save and use in your workout log.</p><button className="wp-inline-link" onClick={() => document.getElementById('wp-generator')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>Create your first plan ↓</button></div></Card> : <>
          <Card title={selectedPlan?.active ? 'ACTIVE PLAN' : 'SAVED PLAN'} badge={selectedPlan?.active ? 'ACTIVE' : 'SAVED'} action={<div className="wp-plan-controls"><select aria-label="Choose a saved workout plan" value={selectedId} onChange={(event) => { if (!canDiscardEdits()) return; setSelectedId(event.target.value); setEditing(false); setDraft(null); setSelectedDay('Monday'); }}><option value="" disabled>Choose a plan</option>{plans.map((item) => <option key={item.id} value={item.id}>{item.plan.planName}{item.active ? ' · Active' : ''}</option>)}</select><button className="wp-icon-button" onClick={loadPlans} title="Refresh plans" aria-label="Refresh plans">↻</button></div>}>
            {visiblePlan && <>
              <div className="wp-overview"><div className="wp-plan-title"><div><div className="wp-kicker">{visiblePlan.active ? 'CURRENT ROUTINE' : 'SAVED ROUTINE'}</div>{editing ? <input className={fieldClass} value={draft.planName} onChange={(event) => setDraft((current) => ({ ...current, planName: event.target.value }))} aria-label="Plan name"/> : <h2>{visiblePlan.plan.planName}</h2>}<p>{visiblePlan.plan.goal} · {visiblePlan.plan.experienceLevel}</p></div><div className="wp-overview-actions">{editing ? <><Button small onClick={saveEdits} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button><Button small variant="secondary" onClick={() => { setEditing(false); setDraft(null); }}>Cancel</Button></> : <><Button small variant="secondary" onClick={beginEditing}>Edit plan</Button>{!visiblePlan.active && <Button small onClick={() => activatePlan(visiblePlan.id)}>Set active</Button>}</>}</div></div>
                <div className="wp-metrics"><div><strong>{visiblePlan.plan.trainingDaysPerWeek}</strong><span>training days / week</span></div><div><strong>{editing ? <input className={`${fieldClass} wp-duration-input`} type="number" min="15" max="180" value={draft.estimatedSessionMinutes} onChange={(event) => setDraft((current) => ({ ...current, estimatedSessionMinutes: Number(event.target.value) }))}/> : visiblePlan.plan.estimatedSessionMinutes}</strong><span>minutes / session</span></div><div><strong>{visiblePlan.plan.targetMuscleGroups?.length || '—'}</strong><span>focus areas</span></div></div>
                <div className="wp-muscles"><span>FOCUS AREAS</span>{visiblePlan.plan.targetMuscleGroups?.length ? visiblePlan.plan.targetMuscleGroups.map((muscle) => <i key={muscle}>{muscle}</i>) : <small>Not specified in this plan</small>}</div>
              </div>
              <div className="wp-week-header"><div><div className="wp-kicker">YOUR WEEK AT A GLANCE</div><h3>Weekly schedule</h3></div><span>Monday — Sunday</span></div>
              <div className="wp-week-strip">{DAYS.map((day) => { const entry = visiblePlan.plan.weekPlan?.find((item) => item.day?.toLowerCase() === day.toLowerCase()); const isSelected = selectedDay === day; return <button key={day} className={`wp-day ${isSelected ? 'selected' : ''} ${entry?.restDay ? 'rest' : ''}`} onClick={() => setSelectedDay(day)}><span>{day.slice(0, 3)}</span><i>{entry?.restDay ? 'Rest' : entry ? (entry.focus || 'Train') : '—'}</i><b>{isSelected ? '●' : entry?.restDay ? '·' : entry ? '✳' : '—'}</b></button>; })}</div>
              <div className="wp-selected-day"><div className="wp-selected-day-head"><div><span className="wp-kicker">{selectedDay.toUpperCase()}</span><h3>{selectedDayPlan?.restDay ? 'Recovery day' : selectedDayPlan?.focus || 'Workout session'}</h3></div>{selectedDayPlan && !selectedDayPlan.restDay && !editing && <Button onClick={startWorkout}>Start workout <span>↗</span></Button>}</div>
                {!selectedDayPlan ? <div className="wp-day-empty">This day has no workout details in the saved plan.</div> : selectedDayPlan.restDay ? <div className="wp-rest-state"><span>◌</span><div><strong>Take time to recover.</strong><p>{selectedDayPlan.focus || 'Rest day scheduled in your plan.'}</p></div></div> : <div className="wp-exercises">{(selectedDayPlan.exercises || []).map((exercise, index) => <article className="wp-exercise" key={`${exercise.name}-${index}`}><div className="wp-exercise-number">{String(index + 1).padStart(2, '0')}</div><div className="wp-exercise-body"><div className="wp-exercise-top"><h4>{exercise.name}</h4>{exercise.targetMuscles?.length > 0 && <span>{exercise.targetMuscles.join(' · ')}</span>}</div>{editing && <div className="wp-edit-fields"><label>Sets<input type="number" min="1" value={exercise.sets} onChange={(event) => updateExercise(selectedDayIndex, index, 'sets', Number(event.target.value))}/></label><label>Reps<input value={exercise.repetitions} onChange={(event) => updateExercise(selectedDayIndex, index, 'repetitions', event.target.value)}/></label><label>Rest (sec)<input type="number" min="0" value={exercise.restSeconds || 0} onChange={(event) => updateExercise(selectedDayIndex, index, 'restSeconds', Number(event.target.value))}/></label></div>}<div className="wp-exercise-meta"><span>{exercise.sets} sets × {exercise.repetitions} reps</span>{exercise.restSeconds > 0 && <span>{exercise.restSeconds}s rest</span>}{exercise.equipment && <span>{exercise.equipment}</span>}</div>{exercise.instructions && <p className="wp-exercise-instructions">{exercise.instructions}</p>}</div></article>)}</div>}
                {selectedDayPlan?.estimatedDurationMinutes > 0 && <div className="wp-session-duration">◷ <span>Estimated session</span><strong>{selectedDayPlan.estimatedDurationMinutes} min</strong></div>}
              </div>
              {visiblePlan.plan.generalTip && <div className="wp-tip"><span>✦</span><p>{visiblePlan.plan.generalTip}</p></div>}
            </>}
          </Card>
        </>}
      </div>

      <aside className="wp-side-column">
        <Card title="CREATE A PLAN" badge="AI COACH" className="wp-generator-card"><form id="wp-generator" onSubmit={generatePlan}>
          <p className="wp-form-intro">A few details help tailor your weekly plan to you.</p>
          {formField('Fitness goal', 'goal', <select className={fieldClass} value={form.goal} onChange={(event) => setForm({ ...form, goal: event.target.value })}><option value="build muscle">Build muscle</option><option value="lose weight">Lose weight</option><option value="stay fit">Stay fit</option><option value="improve endurance">Improve endurance</option><option value="general fitness">General fitness</option></select>)}
          {formField('Experience level', 'experienceLevel', <select className={fieldClass} value={form.experienceLevel} onChange={(event) => setForm({ ...form, experienceLevel: event.target.value })}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select>)}
          {formField('Training days per week', 'trainingDaysPerWeek', <select className={fieldClass} value={form.trainingDaysPerWeek} onChange={(event) => setForm({ ...form, trainingDaysPerWeek: Number(event.target.value) })}>{[2, 3, 4, 5, 6, 7].map((days) => <option key={days} value={days}>{days} days</option>)}</select>)}
          {formField('Session duration', 'sessionDurationMinutes', <select className={fieldClass} value={form.sessionDurationMinutes} onChange={(event) => setForm({ ...form, sessionDurationMinutes: Number(event.target.value) })}>{[30, 45, 60, 75, 90].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}</select>)}
          <fieldset className="wp-equipment"><legend>Available equipment</legend>{EQUIPMENT.map((item) => <label key={item}><input type="checkbox" checked={form.equipment.includes(item)} onChange={() => toggleEquipment(item)}/><span>{item}</span></label>)}</fieldset>
          {formField('Limitations or preferences', 'limitations', <textarea className={fieldClass} rows="3" maxLength="500" placeholder="Anything you’d like your coach to account for?" value={form.limitations} onChange={(event) => setForm({ ...form, limitations: event.target.value })}/>)}
          <Button full type="submit" disabled={generating || !form.equipment.length}>{generating ? 'Building your plan…' : plans.length ? 'Generate new plan' : 'Generate my plan'} <span>✦</span></Button>
          {generating && <div className="wp-generating-note"><span className="wp-spinner"/>Creating a structured seven-day plan…</div>}
        </form></Card>
        <Card title="SAVED PLANS" badge={`${plans.length}`}><div className="wp-saved-plans">{status === 'loading' ? <div className="wp-list-skeleton"><i/><i/></div> : plans.length ? plans.map((item) => <button key={item.id} className={`wp-saved-plan ${String(item.id) === String(selectedId) ? 'chosen' : ''}`} onClick={() => { if (!canDiscardEdits()) return; setSelectedId(String(item.id)); setEditing(false); setDraft(null); setSelectedDay('Monday'); }}><span className="wp-plan-dot">{item.active ? '✓' : '✳'}</span><span><strong>{item.plan.planName}</strong><small>{item.plan.trainingDaysPerWeek} days · {item.plan.goal}</small></span><i>{item.active ? 'ACTIVE' : 'VIEW'}</i></button>) : <div className="wp-no-saved">Generated plans are saved here for easy access.</div>}</div></Card>
      </aside>
    </div>
    <style>{styles}</style>
  </div>;
}

const styles = `
.wp-page{--wp-line:rgba(190,220,202,.11);--wp-muted:#8c9b92;--wp-text:#edf3ee;--wp-green:#75dfa0;--wp-lime:#c5f36c;max-width:1440px;margin:0 auto;color:var(--wp-text);display:flex;flex-direction:column;gap:20px}.wp-page *{box-sizing:border-box}.wp-heading{display:flex;align-items:center;justify-content:space-between;padding:8px 2px}.wp-heading h1{font-size:clamp(28px,3vw,38px);font-weight:620;letter-spacing:-1.3px;margin:10px 0 5px}.wp-heading h1 span{color:var(--wp-green)}.wp-heading p{font-size:12px;color:var(--wp-muted);margin:0}.wp-kicker{font-size:9px;color:#86a092;font-weight:700;letter-spacing:.16em}.wp-kicker i{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--wp-green);margin-right:8px;box-shadow:0 0 12px #75dfa080}.wp-heading-icon{width:48px;height:48px;border-radius:15px;display:grid;place-items:center;background:#17281e;border:1px solid #75dfa033;color:var(--wp-lime);font-size:24px}.wp-alert{border:1px solid var(--wp-line);border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:10px;font-size:12px}.wp-alert button{margin-left:auto;border:0;background:none;color:inherit;cursor:pointer}.wp-alert.error{border-color:#dc8d7040;background:#3b241c;color:#efb195}.wp-alert.success{border-color:#75dfa033;background:#14251b;color:#a7e9b7}.wp-layout{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(290px,.9fr);gap:16px;align-items:start}.wp-main-column,.wp-side-column{display:flex;flex-direction:column;gap:14px;min-width:0}.wp-page .rounded-2xl.border{border-color:var(--wp-line);background:linear-gradient(150deg,#101a17,#0a1210);box-shadow:0 14px 40px #0002}.wp-plan-controls{display:flex;align-items:center;gap:7px}.wp-plan-controls select,.wp-field{width:100%;min-width:0;border:1px solid #304039;border-radius:9px;background:#111c18;color:#e7eee8;padding:10px 11px;font-size:11px;outline:none}.wp-plan-controls select{width:auto;max-width:190px;padding:8px 10px}.wp-plan-controls select:focus,.wp-field:focus{border-color:#75dfa080}.wp-icon-button{width:33px;height:33px;border:1px solid #304039;border-radius:9px;background:#111c18;color:#a8e6b5;font-size:17px;cursor:pointer}.wp-overview{padding:3px 0 16px;border-bottom:1px solid var(--wp-line)}.wp-plan-title{display:flex;justify-content:space-between;align-items:center;gap:14px}.wp-plan-title h2{font-size:23px;letter-spacing:-.6px;font-weight:600;margin:6px 0 4px}.wp-plan-title p{font-size:11px;color:#9ba89f;text-transform:capitalize;margin:0}.wp-overview-actions{display:flex;gap:7px;flex-wrap:wrap}.wp-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:18px}.wp-metrics>div{min-height:70px;padding:12px;border:1px solid #ffffff09;border-radius:11px;background:#131e19;display:flex;flex-direction:column;justify-content:center}.wp-metrics strong{font-size:21px;line-height:1.1;color:#eaf2eb}.wp-metrics span{font-size:9px;color:#87968c;margin-top:6px}.wp-duration-input{width:65px;padding:3px 5px;font-size:16px}.wp-muscles{display:flex;align-items:center;flex-wrap:wrap;gap:7px;margin-top:15px}.wp-muscles>span{font-size:8px;font-weight:700;letter-spacing:.1em;color:#84958a;margin-right:3px}.wp-muscles i{font-style:normal;font-size:9px;color:#a9e7b5;border:1px solid #75dfa02b;background:#14251b;padding:5px 8px;border-radius:99px}.wp-muscles small{font-size:10px;color:#78877e}.wp-week-header{display:flex;align-items:flex-end;justify-content:space-between;margin:20px 0 12px}.wp-week-header h3,.wp-selected-day-head h3{font-size:15px;font-weight:600;margin:4px 0 0}.wp-week-header>span{font-size:9px;color:#839188}.wp-week-strip{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:7px}.wp-day{min-width:0;min-height:70px;border:1px solid #ffffff0a;border-radius:11px;background:#121b17;color:#e5ece6;padding:9px 6px;display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;transition:border .18s,background .18s,transform .18s}.wp-day:hover{border-color:#75dfa04a;transform:translateY(-2px)}.wp-day.selected{border-color:#75dfa06b;background:#193023;box-shadow:inset 0 0 0 1px #75dfa012}.wp-day>span{font-size:10px;font-weight:650}.wp-day i{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-style:normal;font-size:8px;color:#a1b0a6}.wp-day.rest i{color:#78877e}.wp-day>b{font-size:8px;font-weight:400;color:#90e2a5}.wp-selected-day{margin-top:16px;padding-top:15px;border-top:1px solid var(--wp-line)}.wp-selected-day-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}.wp-selected-day-head .wp-kicker{font-size:8px}.wp-selected-day-head button{white-space:nowrap}.wp-exercises{display:flex;flex-direction:column;gap:8px}.wp-exercise{display:flex;gap:11px;padding:12px;border:1px solid #ffffff0a;border-radius:12px;background:#111a16}.wp-exercise-number{flex:none;width:28px;height:28px;border-radius:9px;display:grid;place-items:center;color:#a9e7b5;background:#1a3022;font-size:9px;font-weight:700}.wp-exercise-body{min-width:0;flex:1}.wp-exercise-top{display:flex;justify-content:space-between;gap:8px;align-items:baseline}.wp-exercise-top h4{font-size:12px;margin:2px 0 8px;font-weight:620}.wp-exercise-top>span{font-size:9px;color:#9acda5;text-align:right}.wp-exercise-meta{display:flex;flex-wrap:wrap;gap:6px}.wp-exercise-meta span{font-size:8px;color:#a7b1aa;padding:5px 7px;border-radius:6px;background:#1a2420}.wp-exercise-instructions{font-size:10px;line-height:1.6;color:#839188;margin:8px 0 0}.wp-edit-fields{display:flex;gap:8px;margin:6px 0 9px}.wp-edit-fields label{display:flex;flex-direction:column;gap:4px;color:#84958a;font-size:8px}.wp-edit-fields input{width:70px;border:1px solid #304039;border-radius:7px;background:#0d1512;color:#edf3ee;padding:7px;font-size:10px}.wp-session-duration{display:flex;align-items:center;gap:7px;border-top:1px solid var(--wp-line);padding-top:11px;margin-top:12px;color:#91a197;font-size:10px}.wp-session-duration strong{margin-left:auto;color:#e5ede6}.wp-rest-state{display:flex;align-items:center;gap:12px;padding:17px;border:1px solid #ffffff08;border-radius:11px;background:#111a16}.wp-rest-state>span{font-size:19px;color:#95dba5}.wp-rest-state strong{font-size:11px}.wp-rest-state p{font-size:10px;color:#87958c;margin:4px 0 0}.wp-day-empty{padding:18px;text-align:center;color:#829088;font-size:11px}.wp-tip{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border:1px solid #75dfa01c;border-radius:11px;background:#122019}.wp-tip>span{color:#c5f36c}.wp-tip p{font-size:10px;line-height:1.55;color:#b6c2b9;margin:0}.wp-empty{padding:32px 12px;display:flex;flex-direction:column;align-items:center;text-align:center}.wp-empty>span{width:43px;height:43px;border-radius:14px;background:#173022;color:#b4ed9b;display:grid;place-items:center;font-size:20px}.wp-empty strong{font-size:14px;margin-top:13px}.wp-empty p{max-width:380px;font-size:11px;line-height:1.7;color:#84938a;margin:7px auto 13px}.wp-inline-link{border:0;background:transparent;color:#9be5ad;font-size:10px;cursor:pointer}.wp-form-intro{font-size:10px;color:#89988e;line-height:1.6;margin:-4px 0 14px}.wp-form-field{display:flex;flex-direction:column;gap:6px;margin-bottom:12px}.wp-form-field>span,.wp-equipment legend{font-size:9px;font-weight:650;color:#a7b2aa}.wp-field{resize:vertical}.wp-equipment{border:0;padding:0;margin:0 0 14px;display:grid;grid-template-columns:1fr 1fr;gap:7px}.wp-equipment legend{margin-bottom:7px}.wp-equipment label{display:flex;align-items:center;gap:7px;padding:8px;border:1px solid #ffffff0b;border-radius:8px;background:#111a16;color:#b6c0b8;font-size:9px;cursor:pointer}.wp-equipment input{accent-color:#76dfa0}.wp-generator-card button[type=submit]{font-size:11px}.wp-generating-note{display:flex;align-items:center;gap:8px;color:#94a399;font-size:9px;margin-top:11px}.wp-spinner{width:13px;height:13px;border:2px solid #34473a;border-top-color:#80dfa0;border-radius:50%;animation:wp-spin .8s linear infinite}@keyframes wp-spin{to{transform:rotate(360deg)}}.wp-saved-plans{display:flex;flex-direction:column;gap:7px}.wp-saved-plan{display:flex;align-items:center;gap:9px;width:100%;padding:10px;border:1px solid transparent;border-radius:10px;background:#111a16;color:#e5ece6;text-align:left;cursor:pointer}.wp-saved-plan:hover,.wp-saved-plan.chosen{border-color:#75dfa033;background:#15251b}.wp-plan-dot{width:27px;height:27px;flex:none;border-radius:8px;display:grid;place-items:center;background:#1b2b21;color:#9be5ac;font-size:11px}.wp-saved-plan>span:nth-child(2){display:flex;flex-direction:column;gap:4px;min-width:0;flex:1}.wp-saved-plan strong{font-size:10px;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}.wp-saved-plan small{font-size:8px;color:#839087;text-transform:capitalize}.wp-saved-plan>i{font-style:normal;font-size:7px;color:#9ee6ae;letter-spacing:.06em}.wp-no-saved{font-size:10px;line-height:1.6;color:#809087;padding:4px 1px}.wp-loading i,.wp-list-skeleton i{display:block;height:45px;border-radius:9px;background:#1b2721;margin:8px 0;animation:wp-pulse 1.1s infinite alternate}@keyframes wp-pulse{to{opacity:.45}}.wp-page .wp-generator-card{border-color:#75dfa024;background:linear-gradient(155deg,#102019,#0a1310)}@media(max-width:1050px){.wp-layout{grid-template-columns:minmax(0,1.35fr) minmax(270px,.9fr);gap:12px}.wp-page .rounded-2xl.border{padding:20px}.wp-week-strip{gap:5px}.wp-day{padding-inline:3px}}@media(max-width:760px){.wp-layout{grid-template-columns:1fr}.wp-side-column{display:grid;grid-template-columns:1fr 1fr;align-items:start}.wp-plan-title{align-items:flex-start;flex-direction:column}.wp-week-strip{gap:5px}.wp-day{min-height:64px}.wp-exercise-top{align-items:flex-start;flex-direction:column;gap:0}.wp-exercise-top>span{text-align:left}.wp-heading h1{font-size:30px}}@media(max-width:520px){.wp-side-column{grid-template-columns:1fr}.wp-page .rounded-2xl.border{padding:16px}.wp-plan-controls select{max-width:155px}.wp-metrics{gap:6px}.wp-metrics>div{padding:9px;min-height:65px}.wp-metrics strong{font-size:18px}.wp-metrics span{font-size:8px}.wp-day{min-height:58px;gap:4px}.wp-day>span{font-size:9px}.wp-day i{font-size:7px}.wp-week-header>span{font-size:8px}.wp-selected-day-head{align-items:flex-start;flex-direction:column}.wp-overview-actions{width:100%}.wp-overview-actions button{flex:1}.wp-edit-fields{flex-wrap:wrap}}
`;
