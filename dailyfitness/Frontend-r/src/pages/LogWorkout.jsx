import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { logWorkout, resetWorkoutLog } from '../store/slices/workoutSlice';
import ExerciseRow from './logworkout/ExerciseRow';

const CATALOG = [
  'Bench press', 'Incline dumbbell press', 'Push-up', 'Chest fly', 'Overhead press',
  'Lateral raise', 'Bicep curl', 'Triceps pressdown', 'Pull-up', 'Lat pulldown',
  'Seated cable row', 'Dumbbell row', 'Deadlift', 'Romanian deadlift', 'Back squat',
  'Goblet squat', 'Lunge', 'Leg press', 'Hamstring curl', 'Calf raise', 'Plank',
  'Crunch', 'Treadmill run', 'Cycling', 'Rowing machine', 'Jump rope',
];
const FEELINGS = [
  { value: 'Great', label: 'Strong', symbol: '↗' },
  { value: 'Average', label: 'Steady', symbol: '·' },
  { value: 'Tired', label: 'Tough', symbol: '◷' },
];
let idCounter = 0;
const uniqueId = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `fitai-${Date.now()}-${++idCounter}`;
const localToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
const makeSet = (number = 1, values = {}) => ({ id: uniqueId(), setNumber: number, weightKg: values.weightKg ?? '', reps: values.reps ?? '10', completed: values.completed ?? false, notes: values.notes || '' });
const makeExercise = (name = '', values = {}) => ({ id: uniqueId(), exerciseName: name, notes: values.notes || '', restSeconds: values.restSeconds || 0, setRows: values.setRows || [makeSet()] });
const createSubmissionId = uniqueId;
const draftKey = (userId) => `fitai-active-workout-${userId}`;

function fromPlan(planWorkout) {
  return (planWorkout?.exercises || []).map((exercise) => {
    const reps = Number.parseInt(exercise.repetitions, 10) || 10;
    const restSeconds = Number(exercise.restSeconds) || 0;
    const extraNotes = [exercise.repetitions && /\D/.test(exercise.repetitions) ? `Plan target: ${exercise.repetitions} reps` : '', exercise.equipment, exercise.instructions].filter(Boolean).join(' · ');
    return makeExercise(exercise.name || '', {
      notes: extraNotes,
      restSeconds,
      setRows: Array.from({ length: Math.max(1, Number(exercise.sets) || 1) }, (_, index) => makeSet(index + 1, { reps })),
    });
  });
}

function elapsedLabel(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return [hours, minutes, rest].map((value) => String(value).padStart(2, '0')).join(':');
}

export default function LogWorkout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const planWorkout = location.state?.planWorkout;
  const userId = useSelector((state) => state.auth.userId);
  const { logStatus, logError, lastFeedback, lastWorkout } = useSelector((state) => state.workout);
  const [workoutType, setWorkoutType] = useState(() => planWorkout?.focus || planWorkout?.day || '');
  const [date, setDate] = useState(localToday());
  const [duration, setDuration] = useState(() => String(planWorkout?.estimatedDurationMinutes || 45));
  const [notes, setNotes] = useState('');
  const [feeling, setFeeling] = useState('Average');
  const [exercises, setExercises] = useState(() => fromPlan(planWorkout));
  const [search, setSearch] = useState('');
  const [fromPlanMode, setFromPlanMode] = useState(Boolean(planWorkout));
  const [active, setActive] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [elapsedBeforeResume, setElapsedBeforeResume] = useState(0);
  const [restUntil, setRestUntil] = useState(null);
  const [clock, setClock] = useState(Date.now());
  const [formError, setFormError] = useState('');
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(Boolean(planWorkout));
  const [resumeChecked, setResumeChecked] = useState(false);
  const [submissionId, setSubmissionId] = useState(createSubmissionId);
  const submitting = useRef(false);
  const restoreHandled = useRef(false);
  const loading = logStatus === 'loading';
  const storageKey = userId ? draftKey(userId) : null;

  useEffect(() => { dispatch(resetWorkoutLog()); }, [dispatch]);

  useEffect(() => {
    if (!userId || restoreHandled.current) return;
    restoreHandled.current = true;
    if (!planWorkout) {
      try {
        const stored = localStorage.getItem(draftKey(userId));
        if (stored) {
          const draft = JSON.parse(stored);
          if (window.confirm('You have an unfinished workout. Resume where you left off?')) {
            setWorkoutType(draft.workoutType || ''); setDate(draft.date || localToday());
            setDuration(String(draft.duration || 45)); setNotes(draft.notes || '');
            setFeeling(draft.feeling || 'Average'); setExercises(draft.exercises || []);
            setFromPlanMode(Boolean(draft.fromPlanMode)); setActive(Boolean(draft.active));
            setStartedAt(draft.startedAt || null); setRestUntil(draft.restUntil || null);
            setElapsedBeforeResume(Number(draft.elapsedBeforeResume) || 0);
            setSubmissionId(draft.submissionId || createSubmissionId()); setDirty(true);
          } else localStorage.removeItem(draftKey(userId));
        }
      } catch {
        localStorage.removeItem(draftKey(userId));
      }
    }
    setResumeChecked(true);
  }, [userId, planWorkout]);

  useEffect(() => {
    if (!active && !restUntil) return undefined;
    const interval = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [active, restUntil]);

  useEffect(() => {
    if (!resumeChecked || !storageKey || saved) return;
    if (!dirty) return;
    const draft = { workoutType, date, duration, notes, feeling, exercises, fromPlanMode, active, startedAt, elapsedBeforeResume, restUntil, submissionId };
    localStorage.setItem(storageKey, JSON.stringify(draft));
  }, [resumeChecked, storageKey, saved, dirty, workoutType, date, duration, notes, feeling, exercises, fromPlanMode, active, startedAt, elapsedBeforeResume, restUntil, submissionId]);

  const filteredCatalog = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return CATALOG.filter((name) => name.toLowerCase().includes(query) && !exercises.some((item) => item.exerciseName.toLowerCase() === name.toLowerCase())).slice(0, 6);
  }, [search, exercises]);
  const completedSetCount = exercises.reduce((total, exercise) => total + exercise.setRows.filter((set) => set.completed).length, 0);
  const totalSetCount = exercises.reduce((total, exercise) => total + exercise.setRows.length, 0);
  const elapsedSeconds = elapsedBeforeResume + (active && startedAt ? Math.max(0, Math.floor((clock - new Date(startedAt).getTime()) / 1000)) : 0);
  const restRemaining = restUntil ? Math.max(0, Math.ceil((new Date(restUntil).getTime() - clock) / 1000)) : 0;

  function markDirty() { setDirty(true); setFormError(''); }
  function addExercise(name) {
    const cleaned = name.trim();
    if (!cleaned) return;
    setExercises((current) => [...current, makeExercise(cleaned)]);
    setSearch(''); markDirty();
  }
  function updateExercise(id, field, value) {
    setExercises((current) => current.map((exercise) => exercise.id === id ? { ...exercise, [field]: value } : exercise));
    markDirty();
  }
  function updateSet(exerciseId, setId, field, value) {
    setExercises((current) => current.map((exercise) => exercise.id !== exerciseId ? exercise : ({
      ...exercise,
      setRows: exercise.setRows.map((set) => set.id === setId ? { ...set, [field]: value } : set),
    })));
    markDirty();
  }
  function addSet(exerciseId) {
    setExercises((current) => current.map((exercise) => {
      if (exercise.id !== exerciseId) return exercise;
      const previous = exercise.setRows[exercise.setRows.length - 1];
      return { ...exercise, setRows: [...exercise.setRows, makeSet(exercise.setRows.length + 1, { reps: previous?.reps || '10', weightKg: previous?.weightKg || '' })] };
    }));
    markDirty();
  }
  function removeSet(exerciseId, setId) {
    setExercises((current) => current.map((exercise) => exercise.id !== exerciseId ? exercise : ({
      ...exercise,
      setRows: exercise.setRows.filter((set) => set.id !== setId).map((set, index) => ({ ...set, setNumber: index + 1 })),
    })));
    markDirty();
  }
  function removeExercise(id) {
    setExercises((current) => current.filter((exercise) => exercise.id !== id));
    markDirty();
  }
  function startRestTimer(seconds) {
    setRestUntil(new Date(Date.now() + seconds * 1000).toISOString());
    markDirty();
  }
  function toggleSession() {
    if (active) {
      setElapsedBeforeResume(elapsedSeconds); setActive(false); setStartedAt(null);
    } else {
      setActive(true); setStartedAt(new Date().toISOString());
    }
    markDirty();
  }
  function saveForLater() {
    if (storageKey && dirty) {
      localStorage.setItem(storageKey, JSON.stringify({ workoutType, date, duration, notes, feeling, exercises, fromPlanMode, active, startedAt, elapsedBeforeResume, restUntil, submissionId }));
    }
    navigate(fromPlanMode ? '/dashboard/workout-plan' : '/dashboard/overview');
  }
  function discardWorkout() {
    if (!window.confirm('Discard this workout and all its set entries?')) return;
    if (storageKey) localStorage.removeItem(storageKey);
    navigate(fromPlanMode ? '/dashboard/workout-plan' : '/dashboard/overview');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting.current || loading || saved) return;
    const workoutName = workoutType.trim();
    const workoutDuration = Number(duration);
    if (!workoutName) return setFormError('Add a name for this workout.');
    if (!date || Number.isNaN(Date.parse(`${date}T00:00:00`)) || date > localToday()) return setFormError('Choose a valid workout date that is not in the future.');
    if (!Number.isInteger(workoutDuration) || workoutDuration < 1 || workoutDuration > 600) return setFormError('Duration must be between 1 and 600 minutes.');
    if (notes.length > 1000) return setFormError('Workout notes must be 1,000 characters or fewer.');
    if (!exercises.length) return setFormError('Add at least one exercise before saving.');
    if (exercises.some((exercise) => !exercise.exerciseName.trim() || !exercise.setRows.length)) return setFormError('Every exercise needs a name and at least one set.');
    const malformedSet = exercises.some((exercise) => exercise.setRows.some((set) => {
      const reps = Number(set.reps); const weight = set.weightKg === '' ? 0 : Number(set.weightKg);
      return !Number.isInteger(reps) || reps < 1 || reps > 1000 || !Number.isFinite(weight) || weight < 0 || weight > 2000;
    }));
    if (malformedSet) return setFormError('Sets need valid repetitions and a weight of 0 kg or more.');
    if (!completedSetCount) return setFormError('Mark at least one set as completed before saving.');

    const payload = {
      submissionId,
      workoutType: workoutName,
      workoutDate: date,
      durationMinutes: workoutDuration,
      caloriesBurned: 0,
      feeling,
      notes: notes.trim(),
      exercises: exercises.map((exercise) => {
        const details = exercise.setRows.map((set, index) => ({ setNumber: index + 1, reps: Number(set.reps), weightKg: set.weightKg === '' ? 0 : Number(set.weightKg), completed: Boolean(set.completed), notes: set.notes || '' }));
        const representative = details.find((set) => set.completed) || details[0];
        return { exerciseName: exercise.exerciseName.trim(), sets: details.length, reps: representative.reps, weightKg: representative.weightKg, notes: exercise.notes || '', setDetails: details };
      }),
    };
    submitting.current = true; setFormError('');
    try {
      const response = await dispatch(logWorkout({ userId, payload })).unwrap();
      setSaved(true); setActive(false); setStartedAt(null);
      if (storageKey) localStorage.removeItem(storageKey);
      if (!response.result?.id) setFormError('Workout was submitted, but the server did not return its saved record ID.');
    } catch (error) {
      setFormError(error?.message || logError || 'Your workout could not be saved. Your draft is still available to retry.');
    } finally {
      submitting.current = false;
    }
  }

  function startAnother() {
    dispatch(resetWorkoutLog());
    setWorkoutType(''); setDate(localToday()); setDuration('45'); setNotes(''); setFeeling('Average'); setExercises([]);
    setFromPlanMode(false); setActive(false); setStartedAt(null); setElapsedBeforeResume(0); setRestUntil(null); setSearch(''); setSaved(false); setDirty(false); setFormError(''); setSubmissionId(createSubmissionId());
  }

  const inputClass = 'lw-input';
  const activeTitle = planWorkout?.planName ? `${planWorkout.planName} · ${planWorkout.focus || planWorkout.day}` : planWorkout?.focus || planWorkout?.day;

  return <div className="lw-page">
    <header className="lw-header"><div><div className="lw-kicker"><i/> TRAINING LOG</div><h1>{saved ? <>Workout <span>saved</span></> : <>Log a <span>workout</span></>}</h1><p>{saved ? 'Your session is recorded and your training history is up to date.' : 'Capture the work you put in. Your progress starts with the details.'}</p></div><div className={`lw-session-clock ${active ? 'running' : ''}`}><span className="lw-clock-dot"/><div><small>{active ? 'SESSION IN PROGRESS' : 'SESSION TIMER'}</small><strong>{elapsedLabel(elapsedSeconds)}</strong></div></div></header>

    {saved ? <Card className="lw-success-card"><div className="lw-success-mark">✓</div><div className="lw-success-copy"><div className="lw-kicker">SESSION RECORDED</div><h2>{lastWorkout?.workoutType || workoutType}</h2><p>{duration} min · {exercises.length} exercises · {completedSetCount} completed sets</p><div className="lw-ai-feedback">{lastFeedback}</div></div><div className="lw-success-actions"><Button onClick={() => navigate('/dashboard/history')}>Review workout history ↗</Button><Button variant="secondary" onClick={startAnother}>Log another workout</Button></div></Card> : <>
      {formError && <div className="lw-alert" role="alert"><span>!</span><p>{formError}</p><button type="button" onClick={() => setFormError('')} aria-label="Dismiss error">×</button></div>}
      {logStatus === 'failed' && !formError && <div className="lw-alert" role="alert"><span>!</span><p>{logError || 'Your workout could not be saved. Your draft is still available.'}</p><button onClick={() => setFormError(logError || 'Please check your connection and retry.')}>Review</button></div>}
      <form onSubmit={handleSubmit} noValidate>
        <div className="lw-mode-row"><div className="lw-mode-switch" role="group" aria-label="Workout entry mode"><button type="button" className={fromPlanMode ? 'selected' : ''} onClick={() => { if (planWorkout) { setFromPlanMode(true); } else navigate('/dashboard/workout-plan'); }}>✳ <span>Follow a plan</span></button><button type="button" className={!fromPlanMode ? 'selected' : ''} onClick={() => { setFromPlanMode(false); markDirty(); }}>＋ <span>Independent workout</span></button></div>{fromPlanMode && planWorkout && <div className="lw-plan-context"><span>PLAN SESSION</span><strong>{activeTitle}</strong><button type="button" onClick={() => navigate('/dashboard/workout-plan')}>Change plan</button></div>}{!fromPlanMode && <button type="button" className="lw-plan-link" onClick={() => navigate('/dashboard/workout-plan')}>Choose a saved plan ↗</button>}</div>

        <div className="lw-layout">
          <div className="lw-main-column">
            <Card title="SESSION DETAILS" badge={new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}>
              <div className="lw-detail-grid">
                <label className="lw-field lw-workout-name"><span>Workout name or focus <b>*</b></span><input className={inputClass} value={workoutType} onChange={(event) => { setWorkoutType(event.target.value); markDirty(); }} placeholder="e.g. Upper body strength" list="fitai-workout-types" maxLength={100} required/><datalist id="fitai-workout-types"><option value="Chest"/><option value="Back"/><option value="Legs"/><option value="Shoulders"/><option value="Arms"/><option value="Full Body"/><option value="Cardio"/><option value="Core"/></datalist></label>
                <label className="lw-field"><span>Workout date <b>*</b></span><input className={inputClass} type="date" max={localToday()} value={date} onChange={(event) => { setDate(event.target.value); markDirty(); }} required/></label>
                <label className="lw-field"><span>Duration <b>*</b></span><div className="lw-input-unit"><input className={inputClass} type="number" inputMode="numeric" min="1" max="600" value={duration} onChange={(event) => { setDuration(event.target.value); markDirty(); }} required/><span>min</span></div></label>
              </div>
              <label className="lw-field lw-notes-field"><span>Session notes <small>Optional · {notes.length}/1000</small></span><textarea className={inputClass} value={notes} maxLength={1000} rows={3} placeholder="How did the session go? Any highlights to remember?" onChange={(event) => { setNotes(event.target.value); markDirty(); }}/></label>
              <div className="lw-effort"><div><strong>How did it feel?</strong><span>Pick the effort that best describes today.</span></div><div className="lw-feelings" role="group" aria-label="Workout perceived effort">{FEELINGS.map((option) => <button type="button" key={option.value} className={feeling === option.value ? 'selected' : ''} onClick={() => { setFeeling(option.value); markDirty(); }}><i>{option.symbol}</i>{option.label}</button>)}</div></div>
            </Card>

            <Card title="EXERCISES & SETS" badge={`${exercises.length} exercises`} action={<span className="lw-completion-count">{completedSetCount}/{totalSetCount} sets done</span>}>
              <div className="lw-exercise-search"><div><label htmlFor="lw-exercise-search">Add an exercise</label><span>Search the movement list or add your own name.</span></div><div className="lw-search-controls"><input id="lw-exercise-search" className={inputClass} value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && search.trim()) { event.preventDefault(); addExercise(filteredCatalog[0] || search); } }} placeholder="Search exercises…" autoComplete="off"/><Button type="button" variant="secondary" onClick={() => addExercise(filteredCatalog[0] || search)} disabled={!search.trim()}>Add</Button></div></div>
              {filteredCatalog.length > 0 && <div className="lw-suggestions" role="listbox" aria-label="Exercise suggestions">{filteredCatalog.map((name) => <button key={name} type="button" role="option" aria-selected="false" onClick={() => addExercise(name)}><span>＋</span>{name}<i>Add</i></button>)}</div>}
              <datalist id="fitai-exercise-catalog">{CATALOG.map((name) => <option key={name} value={name}/>)}</datalist>
              {exercises.length === 0 ? <div className="lw-empty-exercises"><span>＋</span><strong>Your exercise list is ready.</strong><p>Search above to add movements, then record your sets as you go.</p></div> : <div className="lw-exercise-list">{exercises.map((exercise, index) => <div key={exercise.id}><ExerciseRow exercise={exercise} index={index} onUpdate={(field, value) => updateExercise(exercise.id, field, value)} onSetChange={(setId, field, value) => updateSet(exercise.id, setId, field, value)} onAddSet={() => addSet(exercise.id)} onRemoveSet={(setId) => removeSet(exercise.id, setId)} onRemove={() => removeExercise(exercise.id)} onStartRest={startRestTimer} restSeconds={exercise.restSeconds}/>{exercise.notes && <p className="lw-plan-note">Plan note · {exercise.notes}</p>}</div>)}</div>}
            </Card>
          </div>

          <aside className="lw-side-column">
            <Card title={active ? 'WORKOUT IN PROGRESS' : 'SESSION CONTROLS'} badge={active ? 'LIVE' : 'READY'}>
              <div className="lw-active-session"><div className="lw-active-emblem">{active ? 'Ⅱ' : '▶'}</div><strong>{active ? 'You’re in the zone.' : 'Ready when you are.'}</strong><p>{active ? 'Your session timer is running. Set entries are saved on this device as you go.' : 'Start a session timer or record your workout when you’re finished.'}</p><Button full type="button" variant={active ? 'secondary' : 'primary'} onClick={toggleSession}>{active ? 'End timer & keep draft' : 'Start workout session'}</Button><button className="lw-safe-exit" type="button" onClick={saveForLater}>Save for later & exit</button><button className="lw-discard" type="button" onClick={discardWorkout}>Discard workout</button></div>
              {restRemaining > 0 && <div className="lw-rest-timer"><div><span>REST TIMER</span><strong>{elapsedLabel(restRemaining)}</strong></div><button type="button" onClick={() => setRestUntil(null)}>Stop</button></div>}
            </Card>

            <Card title="SESSION SUMMARY"><div className="lw-summary"><div className="lw-summary-main"><span>{workoutType || 'Workout name'}</span><strong>{duration || 0}<small> min</small></strong></div><div className="lw-summary-row"><span>Date</span><strong>{date ? new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</strong></div><div className="lw-summary-row"><span>Exercises</span><strong>{exercises.length}</strong></div><div className="lw-summary-row"><span>Completed sets</span><strong>{completedSetCount} / {totalSetCount}</strong></div><div className="lw-summary-exercises">{exercises.slice(0, 5).map((exercise) => <div key={exercise.id}><i>{exercise.setRows.filter((set) => set.completed).length ? '✓' : '·'}</i><span>{exercise.exerciseName || 'Unnamed exercise'}</span><small>{exercise.setRows.filter((set) => set.completed).length} sets</small></div>)}</div></div></Card>

            <div className="lw-save-panel"><div><span className="lw-kicker">READY TO WRAP UP?</span><p>Your session will be saved to History and update your dashboard stats.</p></div><Button full type="submit" disabled={loading || saved || !resumeChecked}>{loading ? 'Saving workout…' : 'Save completed workout'} <span>↗</span></Button>{loading && <div className="lw-saving-line"><i/>Saving your workout and refreshing your training history…</div>}</div>
          </aside>
        </div>
      </form>
    </>}
    <style>{styles}</style>
  </div>;
}

const styles = `
.lw-page{--lw-line:rgba(190,220,202,.11);--lw-muted:#8b9a91;--lw-green:#76dfa0;--lw-lime:#c5f36c;color:#edf3ee;max-width:1440px;margin:0 auto;display:flex;flex-direction:column;gap:18px}.lw-page *{box-sizing:border-box}.lw-header{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:7px 2px}.lw-kicker{font-size:9px;letter-spacing:.15em;color:#86a092;font-weight:700}.lw-kicker i{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--lw-green);margin-right:8px;box-shadow:0 0 12px #76dfa080}.lw-header h1{font-size:clamp(28px,3vw,37px);font-weight:620;letter-spacing:-1.2px;margin:9px 0 4px}.lw-header h1 span{color:var(--lw-green)}.lw-header p{font-size:11px;color:var(--lw-muted);margin:0}.lw-session-clock{display:flex;align-items:center;gap:10px;padding:10px 14px;border:1px solid var(--lw-line);border-radius:13px;background:linear-gradient(145deg,#111b17,#0c1411);min-width:156px}.lw-clock-dot{width:8px;height:8px;border-radius:50%;background:#748078}.lw-session-clock.running .lw-clock-dot{background:#76dfa0;box-shadow:0 0 12px #76dfa0;animation:lw-blink 1.3s infinite}.lw-session-clock>div{display:flex;flex-direction:column;gap:3px}.lw-session-clock small{font-size:7px;letter-spacing:.12em;color:#85948b}.lw-session-clock strong{font-size:19px;font-variant-numeric:tabular-nums;letter-spacing:.04em}.lw-alert{display:flex;align-items:center;gap:10px;border:1px solid #dd876344;background:#351f1a;border-radius:11px;color:#efb29a;padding:11px 13px;font-size:11px}.lw-alert>span{width:19px;height:19px;border-radius:50%;display:grid;place-items:center;background:#dd876322;font-weight:700}.lw-alert p{margin:0;flex:1}.lw-alert button{border:0;background:transparent;color:inherit;cursor:pointer}.lw-mode-row{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:13px}.lw-mode-switch{display:inline-flex;gap:4px;border:1px solid var(--lw-line);border-radius:11px;background:#0d1512;padding:4px}.lw-mode-switch button{border:0;border-radius:8px;background:transparent;color:#8d9a92;padding:8px 12px;font-size:10px;cursor:pointer}.lw-mode-switch button.selected{background:#193023;color:#c4f3cb}.lw-plan-context{display:flex;align-items:center;gap:9px;color:#a6e5b2;font-size:9px}.lw-plan-context>span{font-size:7px;letter-spacing:.12em;color:#82978a}.lw-plan-context strong{font-size:10px;font-weight:550}.lw-plan-context button,.lw-plan-link{border:0;background:none;color:#a8e5b3;text-decoration:underline;text-underline-offset:3px;font-size:9px;cursor:pointer}.lw-layout{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(270px,.8fr);gap:15px;align-items:start}.lw-main-column,.lw-side-column{display:flex;flex-direction:column;gap:13px;min-width:0}.lw-page .rounded-2xl.border{border-color:var(--lw-line);background:linear-gradient(150deg,#101a17,#0a1210);box-shadow:0 13px 38px #0002}.lw-detail-grid{display:grid;grid-template-columns:1.45fr 1fr .75fr;gap:12px}.lw-field{display:flex;flex-direction:column;gap:6px;min-width:0}.lw-field>span{font-size:9px;font-weight:650;color:#a8b3ab}.lw-field>span>b{color:#83e3a1}.lw-field>span small{font-weight:400;color:#728078;margin-left:5px}.lw-input{width:100%;min-width:0;border:1px solid #2a3931;border-radius:9px;background:#0c1411;color:#eaf0eb;padding:10px 11px;font-size:11px;outline:none;transition:border-color .18s,box-shadow .18s}.lw-input::placeholder{color:#66746b}.lw-input:focus{border-color:#76dfa078;box-shadow:0 0 0 3px #76dfa014}.lw-input-unit{position:relative}.lw-input-unit input{padding-right:38px}.lw-input-unit>span{position:absolute;right:11px;top:50%;transform:translateY(-50%);font-size:9px;color:#7d8b82}.lw-notes-field{margin-top:13px}.lw-notes-field textarea{resize:vertical;line-height:1.5}.lw-effort{display:flex;align-items:center;justify-content:space-between;gap:14px;padding-top:15px;margin-top:14px;border-top:1px solid var(--lw-line)}.lw-effort>div:first-child{display:flex;flex-direction:column;gap:4px}.lw-effort strong{font-size:10px}.lw-effort>div:first-child span{font-size:9px;color:#84938a}.lw-feelings{display:flex;gap:6px}.lw-feelings button{display:flex;align-items:center;gap:6px;border:1px solid #ffffff0b;border-radius:9px;background:#111a16;color:#9ba89f;padding:7px 9px;font-size:9px;cursor:pointer}.lw-feelings button i{width:19px;height:19px;border-radius:50%;display:grid;place-items:center;font-style:normal;background:#242c27;color:#c6d0c8}.lw-feelings button.selected{border-color:#75dfa040;background:#183022;color:#c4eaca}.lw-feelings button.selected i{background:#c5f36c;color:#17200f}.lw-completion-count{font-size:9px;color:#9ce3aa}.lw-exercise-search{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:1px 0 13px;border-bottom:1px solid var(--lw-line)}.lw-exercise-search>div:first-child{display:flex;flex-direction:column;gap:4px}.lw-exercise-search label{font-size:10px;font-weight:650}.lw-exercise-search>div:first-child span{font-size:8px;color:#7f8c84}.lw-search-controls{display:flex;gap:6px;width:min(55%,330px)}.lw-search-controls .lw-input{font-size:10px}.lw-search-controls button{white-space:nowrap;font-size:9px;padding:7px 11px}.lw-suggestions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;padding:9px 0;border-bottom:1px solid var(--lw-line)}.lw-suggestions button{display:flex;align-items:center;gap:7px;border:1px solid #ffffff08;border-radius:8px;background:#111a16;color:#c7d0c9;padding:8px;font-size:9px;text-align:left;cursor:pointer}.lw-suggestions button:hover{border-color:#75dfa044;color:#d9f1dd}.lw-suggestions button>span{color:#8fe2a3}.lw-suggestions button>i{font-style:normal;margin-left:auto;color:#728078;font-size:8px}.lw-exercise-list{display:flex;flex-direction:column;gap:10px;padding-top:12px}.lw-exercise-card{border:1px solid #ffffff0b;border-radius:12px;background:#101916;padding:12px}.lw-exercise-heading{display:flex;align-items:center;gap:8px;margin-bottom:10px}.lw-exercise-index{width:26px;height:26px;display:grid;place-items:center;border-radius:8px;background:#1a3022;color:#9de6ad;font-size:9px;font-weight:700}.lw-exercise-name{min-width:0;flex:1}.lw-exercise-name input{width:100%;border:0;background:transparent;color:#ebf1ec;font-size:11px;font-weight:650;outline:none}.lw-exercise-name input:focus{border-bottom:1px solid #76dfa0}.lw-set-count{font-size:8px;color:#89978e;white-space:nowrap}.lw-remove-exercise,.lw-remove-set{border:0;background:transparent;color:#76847b;font-size:16px;cursor:pointer}.lw-remove-exercise:hover,.lw-remove-set:hover{color:#f1a18a}.lw-set-head,.lw-set-row{display:grid;grid-template-columns:38px minmax(80px,1fr) minmax(70px,.8fr) 65px 25px;align-items:center;gap:8px}.lw-set-head{padding:0 5px 6px;color:#718077;font-size:7px;letter-spacing:.08em}.lw-set-row{padding:5px;border-top:1px solid #ffffff07}.lw-set-row.complete{background:#14302055;border-radius:8px}.lw-set-number{font-size:9px;color:#8f9d93;text-align:center}.lw-set-row label input:not([type=checkbox]){width:100%;border:1px solid #28372f;border-radius:7px;background:#0b1310;color:#ebf1ec;padding:8px;font-size:10px;outline:none}.lw-set-row label input:focus{border-color:#76dfa077}.lw-complete-control{height:31px;display:grid;place-items:center;position:relative}.lw-complete-control input{width:17px;height:17px;position:absolute;opacity:0;cursor:pointer}.lw-checkmark{width:18px;height:18px;border:1px solid #425149;border-radius:6px;display:grid;place-items:center;color:transparent;font-size:11px;cursor:pointer}.lw-complete-control input:checked+.lw-checkmark{background:#b8ed70;border-color:#b8ed70;color:#17200f}.lw-complete-control input:focus-visible+.lw-checkmark{outline:2px solid #75dfa0;outline-offset:2px}.lw-remove-set:disabled{opacity:.25;cursor:not-allowed}.lw-exercise-footer{display:flex;gap:15px;padding-top:9px}.lw-text-action{border:0;background:transparent;color:#9de2ab;font-size:8px;cursor:pointer}.lw-text-action:hover{text-decoration:underline}.lw-mobile-label{display:none}.lw-plan-note{font-size:8px;color:#84968b;margin:5px 0 0 37px;line-height:1.5}.lw-empty-exercises{display:flex;flex-direction:column;align-items:center;text-align:center;padding:26px 8px 12px}.lw-empty-exercises>span{width:31px;height:31px;display:grid;place-items:center;border-radius:10px;background:#1b3022;color:#a9e8b1;font-size:16px}.lw-empty-exercises strong{font-size:10px;margin-top:9px}.lw-empty-exercises p{font-size:9px;color:#7e8d83;margin:5px 0}.lw-active-session{text-align:center;display:flex;flex-direction:column;align-items:center}.lw-active-emblem{width:49px;height:49px;display:grid;place-items:center;border-radius:15px;background:#1b3022;color:#c4f36c;font-size:19px}.lw-active-session>strong{font-size:11px;margin-top:10px}.lw-active-session>p{font-size:9px;line-height:1.6;color:#86948b;margin:6px 0 12px}.lw-active-session button:first-of-type{font-size:9px;padding:9px}.lw-safe-exit,.lw-discard{margin-top:9px;border:0;background:transparent;color:#91dca2;font-size:8px;cursor:pointer}.lw-discard{color:#9c8178}.lw-rest-timer{display:flex;justify-content:space-between;align-items:center;margin-top:13px;padding:10px;border:1px solid #d9a75b24;border-radius:9px;background:#34271966}.lw-rest-timer>div{display:flex;flex-direction:column;gap:4px}.lw-rest-timer span{font-size:7px;letter-spacing:.12em;color:#d2ae79}.lw-rest-timer strong{font-size:17px;font-variant-numeric:tabular-nums}.lw-rest-timer button{border:1px solid #d9a75b30;border-radius:7px;padding:6px 8px;background:transparent;color:#d7b988;font-size:8px;cursor:pointer}.lw-summary-main{display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid var(--lw-line);gap:10px}.lw-summary-main>span{font-size:11px;font-weight:600}.lw-summary-main>strong{font-size:22px}.lw-summary-main small{font-size:9px;color:#87958c;font-weight:400}.lw-summary-row{display:flex;justify-content:space-between;gap:8px;padding:9px 0;border-bottom:1px solid #ffffff08;color:#85938a;font-size:9px}.lw-summary-row strong{font-size:9px;color:#dbe4dc;font-weight:550}.lw-summary-exercises{padding-top:8px}.lw-summary-exercises>div{display:flex;align-items:center;gap:7px;padding:5px 0}.lw-summary-exercises i{font-style:normal;color:#a8e7af;font-size:9px}.lw-summary-exercises span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#adb8af;font-size:8px}.lw-summary-exercises small{font-size:8px;color:#78877e}.lw-save-panel{padding:15px;border:1px solid #75dfa02b;border-radius:13px;background:linear-gradient(145deg,#12271b,#0d1a12)}.lw-save-panel>div:first-child p{font-size:9px;line-height:1.55;color:#95a398;margin:6px 0 11px}.lw-save-panel button{font-size:10px;padding:10px}.lw-saving-line{display:flex;align-items:center;gap:7px;color:#9aa89f;font-size:8px;margin-top:9px}.lw-saving-line i{width:11px;height:11px;border:2px solid #304439;border-top-color:#76dfa0;border-radius:50%;animation:lw-spin .7s linear infinite}@keyframes lw-spin{to{transform:rotate(360deg)}}@keyframes lw-blink{50%{opacity:.45}}.lw-success-card{display:grid;grid-template-columns:auto 1fr auto;align-items:start;gap:17px}.lw-success-mark{width:42px;height:42px;display:grid;place-items:center;border-radius:14px;background:#bdf272;color:#15200f;font-size:21px}.lw-success-copy h2{font-size:20px;margin:6px 0}.lw-success-copy>p{color:#84938a;font-size:10px;margin:0 0 11px}.lw-ai-feedback{white-space:pre-wrap;font-size:10px;line-height:1.6;color:#c5d1c7;border:1px solid #ffffff09;background:#101916;border-radius:9px;padding:11px}.lw-success-actions{display:flex;flex-direction:column;gap:7px}.lw-success-actions button{white-space:nowrap;font-size:9px;padding:8px 11px}.lw-visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
@media(max-width:1050px){.lw-layout{grid-template-columns:minmax(0,1.3fr) minmax(250px,.8fr);gap:11px}.lw-detail-grid{grid-template-columns:1fr 1fr}.lw-workout-name{grid-column:1/-1}}
@media(max-width:760px){.lw-layout{grid-template-columns:1fr}.lw-side-column{display:grid;grid-template-columns:1fr 1fr;align-items:start}.lw-save-panel{grid-column:1/-1}.lw-success-card{grid-template-columns:auto 1fr}.lw-success-actions{grid-column:1/-1;flex-direction:row;flex-wrap:wrap}.lw-success-actions button{flex:1}.lw-header h1{font-size:30px}}
@media(max-width:520px){.lw-page .rounded-2xl.border{padding:15px}.lw-header{align-items:flex-start}.lw-header h1{font-size:27px}.lw-header p{max-width:230px;line-height:1.5}.lw-session-clock{min-width:auto;padding:8px 9px;gap:6px}.lw-session-clock small{font-size:6px}.lw-session-clock strong{font-size:16px}.lw-mode-row{align-items:flex-start;flex-direction:column}.lw-mode-switch{width:100%}.lw-mode-switch button{flex:1;font-size:9px;padding:8px 6px}.lw-plan-context{flex-wrap:wrap}.lw-detail-grid{grid-template-columns:1fr 1fr}.lw-effort{align-items:flex-start;flex-direction:column}.lw-feelings{width:100%}.lw-feelings button{flex:1;justify-content:center}.lw-exercise-search{align-items:stretch;flex-direction:column}.lw-search-controls{width:100%}.lw-suggestions{grid-template-columns:1fr}.lw-set-head{display:none}.lw-set-row{grid-template-columns:25px minmax(70px,1fr) minmax(58px,.8fr) 65px 20px;gap:5px}.lw-mobile-label{display:block;position:absolute;top:-6px;left:7px;padding:0 3px;background:#101916;color:#76857c;font-size:6px;line-height:1}.lw-set-row label{position:relative;padding-top:7px}.lw-set-row label input:not([type=checkbox]){padding:8px 6px}.lw-complete-control{padding-top:7px}.lw-complete-control .lw-mobile-label{top:0;left:0;right:0;text-align:center;background:transparent}.lw-exercise-card{padding:9px}.lw-side-column{grid-template-columns:1fr}.lw-save-panel{grid-column:auto}.lw-plan-context strong{max-width:200px}.lw-success-card{padding:17px}.lw-success-actions{flex-direction:column}.lw-success-actions button{width:100%}}
`;
