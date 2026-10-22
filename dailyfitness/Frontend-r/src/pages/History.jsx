import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { fetchHistory } from '../store/slices/workoutSlice';

const PAGE_SIZE = 8;
const dateKey = (value) => {
  if (!value) return '';
  const key = String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(key) ? key : '';
};
const localDayKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const shiftDay = (date, amount) => { const next = new Date(date.getFullYear(), date.getMonth(), date.getDate()); next.setDate(next.getDate() + amount); return next; };
const showDate = (key, options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-IN', options);
};
const durationLabel = (minutes) => {
  const value = Math.max(0, Number(minutes) || 0);
  return value >= 60 ? `${Math.floor(value / 60)}h ${value % 60}m` : `${value} min`;
};

function Panel({ eyebrow, title, action, children, className = '' }) {
  return <section className={`hist-panel ${className}`}><div className="hist-panel-head"><div>{eyebrow && <span className="hist-eyebrow">{eyebrow}</span>}<h2>{title}</h2></div>{action}</div>{children}</section>;
}

function ActivityChart({ workouts, period, customStart, customEnd }) {
  const [metric, setMetric] = useState('sessions');
  const buckets = useMemo(() => {
    const customStartDate = customStart ? new Date(Number(customStart.slice(0, 4)), Number(customStart.slice(5, 7)) - 1, Number(customStart.slice(8, 10))) : null;
    const customEndDate = customEnd ? new Date(Number(customEnd.slice(0, 4)), Number(customEnd.slice(5, 7)) - 1, Number(customEnd.slice(8, 10))) : null;
    const customDays = customStartDate && customEndDate ? Math.floor((Date.UTC(customEndDate.getFullYear(), customEndDate.getMonth(), customEndDate.getDate()) - Date.UTC(customStartDate.getFullYear(), customStartDate.getMonth(), customStartDate.getDate())) / 86400000) + 1 : 30;
    const monthGrouped = period === 'all' || (period === 'custom' && customDays > 90);
    if (monthGrouped) {
      const months = new Map();
      workouts.forEach((record) => {
        const key = dateKey(record.workoutDate).slice(0, 7);
        if (!key) return;
        const current = months.get(key) || { key, sessions: 0, minutes: 0 };
        current.sessions += 1;
        current.minutes += Number(record.durationMinutes) || 0;
        months.set(key, current);
      });
      return [...months.values()].sort((a, b) => a.key.localeCompare(b.key)).slice(-12).map((item) => ({ ...item, label: new Date(Number(item.key.slice(0, 4)), Number(item.key.slice(5)) - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }), fullLabel: new Date(Number(item.key.slice(0, 4)), Number(item.key.slice(5)) - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) }));
    }
    const days = period === 'custom' ? customDays : Number(period);
    const today = period === 'custom' && customEndDate ? customEndDate : new Date();
    const first = period === 'custom' && customStartDate ? customStartDate : shiftDay(today, -(days - 1));
    const byDay = new Map();
    workouts.forEach((record) => {
      const key = dateKey(record.workoutDate);
      if (!key) return;
      const current = byDay.get(key) || { key, sessions: 0, minutes: 0 };
      current.sessions += 1;
      current.minutes += Number(record.durationMinutes) || 0;
      byDay.set(key, current);
    });
    return Array.from({ length: days }, (_, index) => {
      const date = shiftDay(first, index);
      const key = localDayKey(date);
      return { key, label: days === 7 ? date.toLocaleDateString('en-IN', { weekday: 'short' }) : index % (days <= 30 ? 5 : 15) === 0 || index === days - 1 ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '', fullLabel: showDate(key, { weekday: 'long', day: 'numeric', month: 'long' }), ...(byDay.get(key) || { sessions: 0, minutes: 0 }) };
    });
  }, [workouts, period, customStart, customEnd]);
  const values = buckets.map((bucket) => metric === 'sessions' ? bucket.sessions : bucket.minutes);
  const max = Math.max(1, ...values);
  const total = values.reduce((sum, value) => sum + value, 0);
  const chartWidth = 720;
  const chartHeight = 174;
  const gap = buckets.length > 60 ? 2 : buckets.length > 24 ? 3 : buckets.length > 12 ? 6 : 12;
  const barWidth = Math.max(3, (chartWidth - gap * Math.max(0, buckets.length - 1)) / Math.max(1, buckets.length));
  const labelEvery = buckets.length > 24 ? 5 : 1;
  return <Panel eyebrow="YOUR TRAINING TREND" title="Activity over time" action={<div className="hist-toggle" role="group" aria-label="Activity chart metric"><button className={metric === 'sessions' ? 'active' : ''} onClick={() => setMetric('sessions')}>Sessions</button><button className={metric === 'minutes' ? 'active' : ''} onClick={() => setMetric('minutes')}>Duration</button></div>}>
    <div className="hist-chart-summary"><strong>{total.toLocaleString()} <small>{metric === 'sessions' ? 'sessions' : 'min'}</small></strong><span>{period === 'all' ? 'recent 12 active months' : period === 'custom' ? 'in the selected date range' : `in the last ${period} days`}</span></div>
    {!workouts.length ? <div className="hist-chart-empty">No completed workouts in this time period yet.</div> : <div className="hist-chart-scroll"><div className="hist-chart-wrap"><div className="hist-gridlines"><i/><i/><i/></div><svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" role="img" aria-label={`${metric === 'sessions' ? 'Completed workout sessions' : 'Training duration in minutes'} over time`}>
      {buckets.map((bucket, index) => { const value = metric === 'sessions' ? bucket.sessions : bucket.minutes; const height = value ? Math.max(5, (value / max) * 146) : 2; const x = index * (barWidth + gap); return <rect key={bucket.key} className={value ? 'hist-bar' : 'hist-bar-zero'} x={x} y={chartHeight - height} width={barWidth} height={height} rx={Math.min(7, barWidth / 2)}><title>{bucket.fullLabel}: {metric === 'sessions' ? `${value} ${value === 1 ? 'workout' : 'workouts'}` : `${value} minutes`}</title></rect>; })}
    </svg><div className="hist-chart-labels">{buckets.map((bucket, index) => <span key={bucket.key}>{index % labelEvery === 0 ? bucket.label : ''}</span>)}</div></div></div>}
  </Panel>;
}

function WorkoutDetails({ workout, onClose }) {
  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);
  const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];
  return <div className="hist-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="hist-modal" role="dialog" aria-modal="true" aria-labelledby="hist-detail-title"><header><div><span className="hist-eyebrow">COMPLETED SESSION · {showDate(dateKey(workout.workoutDate))}</span><h2 id="hist-detail-title">{workout.workoutType || 'Workout'}</h2></div><button className="hist-close" onClick={onClose} aria-label="Close workout details">×</button></header><div className="hist-detail-stats"><div><small>DURATION</small><strong>{durationLabel(workout.durationMinutes)}</strong></div><div><small>EXERCISES</small><strong>{exercises.length}</strong></div><div><small>FEELING</small><strong>{workout.feeling || '—'}</strong></div></div>{workout.notes && <div className="hist-workout-notes"><span>SESSION NOTES</span><p>{workout.notes}</p></div>}<div className="hist-exercise-details">{exercises.length ? exercises.map((exercise, index) => <article className="hist-exercise-detail" key={exercise.id ?? `${exercise.exerciseName}-${index}`}><div className="hist-exercise-title"><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{exercise.exerciseName || 'Exercise'}</strong>{exercise.notes && <small>{exercise.notes}</small>}</div><b>{exercise.sets || exercise.setDetails?.length || 0} sets</b></div>{exercise.setDetails?.length ? <div className="hist-set-list"><div className="hist-set-header"><span>SET</span><span>WEIGHT</span><span>REPS</span><span>STATUS</span></div>{exercise.setDetails.map((set, setIndex) => <div className="hist-set-row" key={set.id ?? setIndex}><span>Set {set.setNumber || setIndex + 1}</span><span>{Number(set.weightKg) || 0} kg</span><span>{set.reps || '—'}</span><span className={set.completed ? 'is-complete' : ''}>{set.completed ? 'Completed' : 'Not completed'}</span></div>)}</div> : <div className="hist-legacy-sets">{exercise.sets || 0} sets <span>·</span> {exercise.reps || 0} reps <span>·</span> {Number(exercise.weightKg) || 0} kg</div>}</article>) : <p className="hist-no-exercises">No exercise details were saved for this workout.</p>}</div>{workout.aiFeedback && <div className="hist-workout-notes"><span>COACH FEEDBACK</span><p>{workout.aiFeedback}</p></div>}<footer><span>Details shown are from this saved workout record.</span><Button small onClick={onClose}>Done</Button></footer></section></div>;
}

export default function History() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userId = useSelector((state) => state.auth.userId);
  const { history = [], historyStatus } = useSelector((state) => state.workout);
  const [reloadKey, setReloadKey] = useState(0);
  const [range, setRange] = useState('30');
  const [start, setStart] = useState(() => localDayKey(shiftDay(new Date(), -29)));
  const [end, setEnd] = useState(() => localDayKey(new Date()));
  const [type, setType] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [selectedWorkout, setSelectedWorkout] = useState(null);

  useEffect(() => { if (userId) dispatch(fetchHistory({ userId })); }, [dispatch, userId, reloadKey]);

  const normalized = useMemo(() => (Array.isArray(history) ? history : []).map((workout) => ({ ...workout, _dateKey: dateKey(workout.workoutDate) })).filter((workout) => workout._dateKey).sort((a, b) => b._dateKey.localeCompare(a._dateKey) || Number(b.id || 0) - Number(a.id || 0)), [history]);
  const types = useMemo(() => [...new Set(normalized.map((workout) => workout.workoutType).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [normalized]);

  const rangeBounds = useMemo(() => {
    if (range === 'all') return { start: normalized.at(-1)?._dateKey || '', end: localDayKey(new Date()) };
    if (range === 'custom') return { start, end };
    const days = Number(range);
    return { start: localDayKey(shiftDay(new Date(), -(days - 1))), end: localDayKey(new Date()) };
  }, [range, start, end, normalized]);

  const periodWorkouts = useMemo(() => normalized.filter((workout) => (!rangeBounds.start || workout._dateKey >= rangeBounds.start) && (!rangeBounds.end || workout._dateKey <= rangeBounds.end) && (type === 'all' || workout.workoutType === type)), [normalized, rangeBounds, type]);
  const visibleWorkouts = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return [...periodWorkouts].filter((workout) => !needle || [workout.workoutType, workout.notes, ...(workout.exercises || []).map((exercise) => exercise.exerciseName)].some((value) => String(value || '').toLocaleLowerCase().includes(needle))).sort((a, b) => {
      if (sort === 'oldest') return a._dateKey.localeCompare(b._dateKey) || Number(a.id || 0) - Number(b.id || 0);
      if (sort === 'duration-long') return Number(b.durationMinutes || 0) - Number(a.durationMinutes || 0) || b._dateKey.localeCompare(a._dateKey);
      if (sort === 'duration-short') return Number(a.durationMinutes || 0) - Number(b.durationMinutes || 0) || b._dateKey.localeCompare(a._dateKey);
      return b._dateKey.localeCompare(a._dateKey) || Number(b.id || 0) - Number(a.id || 0);
    });
  }, [periodWorkouts, query, sort]);

  useEffect(() => { setPage(1); }, [range, start, end, type, query, sort]);
  const pageCount = Math.max(1, Math.ceil(visibleWorkouts.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageWorkouts = visibleWorkouts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const minutes = periodWorkouts.reduce((sum, workout) => sum + (Number(workout.durationMinutes) || 0), 0);
  const exerciseCount = periodWorkouts.reduce((sum, workout) => sum + (workout.exercises || []).length, 0);
  const averageDuration = periodWorkouts.length ? Math.round(minutes / periodWorkouts.length) : 0;
  const loadError = historyStatus === 'failed';
  const loading = historyStatus === 'loading';
  const periodLabel = range === 'all' ? 'all time' : range === 'custom' ? 'selected dates' : `last ${range} days`;

  return <main className="hist-page"><div className="hist-shell">
    <header className="hist-welcome"><div><span className="hist-eyebrow"><i/> TRAINING ARCHIVE</span><h1>Your work, <em>over time.</em></h1><p>A clear view of your completed sessions and the consistency behind them.</p></div><Button onClick={() => navigate('/dashboard/log-workout')}>＋ Log a workout</Button></header>
    {loadError && <div className="hist-error" role="alert"><span>We couldn’t load your workout history.</span><button onClick={() => setReloadKey((value) => value + 1)}>Try again ↻</button></div>}

    <div className="hist-toolbar"><div className="hist-range-control" role="group" aria-label="History time range">{[['7','7 days'],['30','30 days'],['90','90 days'],['all','All time']].map(([value, label]) => <button key={value} className={range === value ? 'active' : ''} onClick={() => setRange(value)}>{label}</button>)}<button className={range === 'custom' ? 'active' : ''} onClick={() => setRange('custom')}>Custom</button></div><span className="hist-period-label">Showing {periodLabel}</span></div>
    {range === 'custom' && <div className="hist-custom-range"><label>From<input aria-label="Start date" type="date" value={start} max={end || localDayKey(new Date())} onChange={(event) => setStart(event.target.value)}/></label><span>to</span><label>Through<input aria-label="End date" type="date" value={end} min={start} max={localDayKey(new Date())} onChange={(event) => setEnd(event.target.value)}/></label></div>}

    {loadError ? <div className="hist-metrics-unavailable">History metrics are unavailable until your records load.</div> : loading && !normalized.length ? <div className="hist-skeleton-grid" aria-label="Loading workout history"><i/><i/><i/><i/></div> : <div className="hist-metrics"><article className="hist-metric"><span>COMPLETED WORKOUTS</span><strong>{periodWorkouts.length}</strong><small>{periodLabel}</small><i>↗</i></article><article className="hist-metric"><span>TRAINING TIME</span><strong>{durationLabel(minutes)}</strong><small>total recorded duration</small><i>◷</i></article><article className="hist-metric"><span>AVERAGE SESSION</span><strong>{periodWorkouts.length ? durationLabel(averageDuration) : '—'}</strong><small>{periodWorkouts.length ? 'per completed workout' : 'no sessions in this range'}</small><i>⌁</i></article><article className="hist-metric"><span>EXERCISES LOGGED</span><strong>{exerciseCount}</strong><small>across completed sessions</small><i>✳</i></article></div>}

    {loading && !normalized.length ? <div className="hist-panel hist-chart-skeleton"><i/><i/><i/></div> : !loadError && normalized.length > 0 && <ActivityChart workouts={periodWorkouts} period={range} customStart={rangeBounds.start} customEnd={rangeBounds.end}/>}

    <Panel eyebrow="SESSION ARCHIVE" title="Workout history" action={<span className="hist-record-count">{visibleWorkouts.length} {visibleWorkouts.length === 1 ? 'session' : 'sessions'}</span>}>
      <div className="hist-filters"><label className="hist-search"><span>⌕</span><input aria-label="Search workouts" placeholder="Search workouts or exercises" value={query} onChange={(event) => setQuery(event.target.value)}/></label><label className="hist-select-label"><span>Workout type</span><select value={type} onChange={(event) => setType(event.target.value)}><option value="all">All types</option>{types.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label className="hist-select-label"><span>Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="duration-long">Longest duration</option><option value="duration-short">Shortest duration</option></select></label></div>
      {loading && <div className="hist-list-skeleton"><i/><i/><i/></div>}
      {!loading && !loadError && normalized.length === 0 && <div className="hist-empty"><div className="hist-empty-icon">◷</div><span className="hist-eyebrow">A FRESH START</span><h3>Your training history begins with one session.</h3><p>Log a workout to start seeing your progress and activity trends here.</p><Button onClick={() => navigate('/dashboard/log-workout')}>Log your first workout ↗</Button></div>}
      {!loading && !loadError && normalized.length > 0 && visibleWorkouts.length === 0 && <div className="hist-no-results"><strong>No sessions match those filters.</strong><span>Try another date range, workout type, or search term.</span><button onClick={() => { setRange('all'); setType('all'); setQuery(''); setStart(''); setEnd(localDayKey(new Date())); }}>Clear filters</button></div>}
      {!loading && pageWorkouts.length > 0 && <div className="hist-workout-list">{pageWorkouts.map((workout, index) => <button type="button" className="hist-workout-row" key={workout.id ?? `${workout._dateKey}-${workout.workoutType}-${index}`} onClick={() => setSelectedWorkout(workout)}><span className="hist-workout-mark">{String(workout.workoutType || 'W').slice(0, 1).toUpperCase()}</span><span className="hist-workout-main"><strong>{workout.workoutType || 'Workout'}</strong><small>{showDate(workout._dateKey)}{workout.feeling ? ` · Felt ${workout.feeling.toLowerCase()}` : ''}</small></span><span className="hist-workout-stat"><strong>{durationLabel(workout.durationMinutes)}</strong><small>duration</small></span><span className="hist-workout-stat hist-exercise-count"><strong>{(workout.exercises || []).length}</strong><small>exercises</small></span><span className="hist-row-arrow">↗</span></button>)}</div>}
      {!loading && visibleWorkouts.length > 0 && <div className="hist-pagination"><span>Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, visibleWorkouts.length)} of {visibleWorkouts.length}</span><div><button disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>← Previous</button><strong>{currentPage} / {pageCount}</strong><button disabled={currentPage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next →</button></div></div>}
    </Panel>
    {selectedWorkout && <WorkoutDetails workout={selectedWorkout} onClose={() => setSelectedWorkout(null)}/>}
  </div></main>;
}
