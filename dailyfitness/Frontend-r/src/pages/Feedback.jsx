import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { fitnessApi } from '../utils/api';

const PROMPTS = [
  { icon: '◷', title: 'Review my weekly progress', prompt: 'Review my recent training progress using my completed workout records from the last 14 days. Point out what the records show, what they cannot tell us, and one practical next step.' },
  { icon: '↗', title: 'Help me improve consistency', prompt: 'Help me improve consistency based on my recent completed workout history. Suggest a realistic next step that fits my active plan, if I have one.' },
  { icon: '⌁', title: 'Review my workout plan', prompt: 'Review my active saved workout plan and recent completed sessions. Highlight any clear alignment or gaps, and suggest one safe adjustment if the data supports it.' },
  { icon: '✳', title: 'Suggest meals for my preferences', prompt: 'Suggest a few general meal ideas that respect my saved diet preference. If no preference is available, ask me what I prefer. Avoid calorie prescriptions or medical nutrition advice.' },
];

const dateKey = (value) => {
  const key = String(value || '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(key) ? key : '';
};
const dateFromKey = (key) => {
  if (!key) return null;
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
};
const prettyDate = (key) => dateFromKey(key)?.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) || 'Date not recorded';
const preferenceLabel = (value) => ({ veg: 'Vegetarian', vegetarian: 'Vegetarian', vegan: 'Vegan', nonveg: 'Non-vegetarian', 'non-veg': 'Non-vegetarian', 'non vegetarian': 'Non-vegetarian' }[String(value || '').toLowerCase()] || value || 'Not set');

function parseResponse(raw) {
  const content = typeof raw === 'string' ? raw : raw?.response || raw?.feedback || raw?.content;
  if (typeof content !== 'string' || !content.trim()) return null;
  const sections = [];
  let current = null;
  const headings = {
    'overall summary': 'Overall Summary',
    'what is going well': 'What Is Going Well',
    'strengths': 'What Is Going Well',
    'areas to improve': 'Areas to Improve',
    'what needs improvement': 'Areas to Improve',
    'recommended next steps': 'Recommended Next Steps',
    'next steps': 'Recommended Next Steps',
  };
  const intro = [];
  content.trim().split(/\r?\n/).forEach((line) => {
    const normalized = line.trim().replace(/^#{1,5}\s*/, '').replace(/^\*\*/, '').replace(/\*\*:?$/, '').replace(/:$/, '').trim().toLowerCase();
    const label = headings[normalized];
    if (label) {
      current = sections.find((section) => section.title === label);
      if (!current) { current = { title: label, body: [] }; sections.push(current); }
    } else if (current) current.body.push(line);
    else intro.push(line);
  });
  const usable = sections.map((section) => ({ ...section, body: section.body.join('\n').trim() })).filter((section) => section.body);
  if (!usable.length) return { intro: content.trim(), sections: [] };
  return { intro: intro.join('\n').trim(), sections: usable };
}

function Section({ eyebrow, title, action, children }) {
  return <section className="coach-panel"><header className="coach-panel-head"><div>{eyebrow && <span className="coach-eyebrow">{eyebrow}</span>}<h2>{title}</h2></div>{action}</header>{children}</section>;
}

export default function Feedback() {
  const userId = useSelector((state) => state.auth.userId);
  const userName = useSelector((state) => state.auth.userName);
  const profile = useSelector((state) => state.profile);
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [history, setHistory] = useState([]);
  const [contextStatus, setContextStatus] = useState('loading');
  const [contextError, setContextError] = useState('');
  const [historyError, setHistoryError] = useState('');
  const [composer, setComposer] = useState('');
  const [response, setResponse] = useState('');
  const [responsePrompt, setResponsePrompt] = useState('');
  const [responseDate, setResponseDate] = useState('');
  const [requestError, setRequestError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadKey, setLoadKey] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(true);
  const pending = useRef(false);
  const activePlan = plans.find((item) => item.active) || null;
  const plan = activePlan?.plan;
  const recent = useMemo(() => [...workouts].filter((workout) => dateKey(workout.workoutDate)).sort((a, b) => dateKey(b.workoutDate).localeCompare(dateKey(a.workoutDate))).slice(0, 4), [workouts]);
  const weekCount = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 6);
    return workouts.filter((workout) => { const date = dateFromKey(dateKey(workout.workoutDate)); return date && date >= weekAgo && date <= today; }).length;
  }, [workouts]);
  const parsedResponse = useMemo(() => response ? parseResponse(response) : null, [response]);
  const hasSavedProfile = typeof localStorage !== 'undefined' && Boolean(localStorage.getItem('userProfile'));
  const goal = hasSavedProfile && profile?.goal?.trim() ? profile.goal : 'Not set in your saved profile';
  const diet = hasSavedProfile ? preferenceLabel(profile?.dietPreference || profile?.diet) : 'Not set';

  const loadHistory = useCallback(async () => {
    if (!userId) return;
    setHistoryLoading(true); setHistoryError('');
    try {
      const entries = await fitnessApi.getFeedbackHistory(userId);
      setHistory(Array.isArray(entries) ? entries : []);
    } catch (error) {
      setHistoryError(error?.message || 'Could not load saved coaching responses.');
    } finally { setHistoryLoading(false); }
  }, [userId]);

  useEffect(() => {
    if (!userId) return undefined;
    let current = true;
    setContextStatus('loading'); setContextError('');
    Promise.allSettled([fitnessApi.getHistory(userId), fitnessApi.getWorkoutPlans(userId)]).then(([historyResult, plansResult]) => {
      if (!current) return;
      const failures = [];
      if (historyResult.status === 'fulfilled' && Array.isArray(historyResult.value)) setWorkouts(historyResult.value);
      else { setWorkouts([]); failures.push('recent workouts'); }
      if (plansResult.status === 'fulfilled' && Array.isArray(plansResult.value)) setPlans(plansResult.value);
      else { setPlans([]); failures.push('saved workout plans'); }
      setContextError(failures.length ? `Could not load ${failures.join(' and ')}.` : '');
      setContextStatus('ready');
    });
    return () => { current = false; };
  }, [userId, loadKey]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  async function submitPrompt(promptText) {
    const clean = String(promptText || '').trim();
    if (!userId) { setRequestError('Sign in again to request coaching.'); return; }
    if (!clean) { setRequestError('Enter a question or choose one of the coaching prompts.'); return; }
    if (clean.length > 2000) { setRequestError('Keep your coaching request to 2,000 characters or fewer.'); return; }
    if (pending.current) return;
    pending.current = true;
    setComposer(clean); setResponse(''); setRequestError(''); setResponsePrompt(clean); setResponseDate(''); setLoading(true);
    try {
      const result = await fitnessApi.getCoachingFeedback(userId, clean);
      const parsed = parseResponse(result);
      if (!parsed) throw new Error('The coach returned an empty or unreadable response. Please try again.');
      setResponse(typeof result === 'string' ? result : result.response || result.feedback || result.content);
      setResponseDate(new Date().toISOString());
      loadHistory();
    } catch (error) {
      setRequestError(error?.message || 'The coaching request failed. Check your connection and try again.');
    } finally { setLoading(false); pending.current = false; }
  }

  function showSavedResponse(entry) {
    if (!entry?.response) return;
    setResponse(entry.response); setResponsePrompt('Saved coaching response'); setResponseDate(entry.createdAt || ''); setRequestError('');
  }

  return <main className="coach-page"><div className="coach-shell">
    <header className="coach-welcome"><div><span className="coach-eyebrow"><i/> PERSONAL FITNESS COACH</span><h1>Better training, <em>clearer thinking.</em></h1><p>{userName ? `A coaching space shaped around ${userName.split(/\s+/)[0]}’s actual training data.` : 'A coaching space shaped around your actual training data.'}</p></div><div className="coach-badge"><span>✦</span><div><strong>FITAI COACH</strong><small>Evidence-led guidance</small></div></div></header>

    <section className="coach-context" aria-label="Personalized coaching context"><div className="coach-context-head"><div><span className="coach-eyebrow">YOUR CURRENT CONTEXT</span><h2>What your coach can use</h2></div>{contextStatus === 'loading' && <span className="coach-context-loading">Updating context…</span>}</div>
      <div className="coach-context-grid"><article><span className="coach-context-icon">◎</span><div><small>SAVED FITNESS GOAL</small><strong>{goal}</strong></div></article><article><span className="coach-context-icon">◷</span><div><small>RECORDED · LAST 7 DAYS</small><strong>{contextStatus === 'loading' ? '—' : `${weekCount} ${weekCount === 1 ? 'workout' : 'workouts'}`}</strong></div></article><article><span className="coach-context-icon">⌁</span><div><small>ACTIVE WORKOUT PLAN</small><strong>{plan?.planName || (contextStatus === 'loading' ? 'Loading plan…' : 'No active plan')}</strong></div></article><article><span className="coach-context-icon">✳</span><div><small>SAVED DIET PREFERENCE</small><strong>{diet}</strong></div></article></div>
      {recent.length > 0 && <div className="coach-recent-facts"><span>RECENT COMPLETED SESSIONS</span>{recent.slice(0, 3).map((workout, index) => <div key={workout.id ?? `${workout.workoutDate}-${index}`}><strong>{workout.workoutType || 'Workout'}</strong><small>{prettyDate(dateKey(workout.workoutDate))} · {Number(workout.durationMinutes) || 0} min · {(workout.exercises || []).length} exercises</small></div>)}</div>}
      {contextError && <div className="coach-context-error" role="status">Some context is unavailable ({contextError}); you can still ask a general question. <button onClick={() => setLoadKey((value) => value + 1)}>Retry</button></div>}
    </section>

    <div className="coach-main-grid"><div className="coach-main-column">
      <Section eyebrow="A GOOD PLACE TO START" title="Choose a coaching focus"><p className="coach-section-copy">Each prompt sends a real request to your coach, using your recent saved records where relevant.</p><div className="coach-prompt-grid">{PROMPTS.map((item) => <button type="button" key={item.title} disabled={loading} className="coach-prompt-card" onClick={() => submitPrompt(item.prompt)}><span>{item.icon}</span><strong>{item.title}</strong><i>↗</i></button>)}</div></Section>

      <Section eyebrow="ASK YOUR COACH" title="What would you like help with?"><form onSubmit={(event) => { event.preventDefault(); submitPrompt(composer); }}><label className="coach-composer-label" htmlFor="coach-composer">Your question</label><textarea id="coach-composer" className="coach-composer" rows="4" maxLength={2000} placeholder="Ask about your recent training, plan, consistency, or meal preferences…" value={composer} onChange={(event) => setComposer(event.target.value)} onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); submitPrompt(composer); } }}/><div className="coach-composer-footer"><span>{composer.length}/2,000 · Ctrl/⌘ + Enter to send</span><Button type="submit" disabled={loading || !composer.trim()}>{loading ? <><i className="coach-spinner"/>Thinking…</> : <>Ask FITAI <span>↗</span></>}</Button></div></form>{requestError && <div role="alert" className="coach-request-error">{requestError}<button onClick={() => submitPrompt(responsePrompt || composer)} disabled={loading}>Retry</button></div>}</Section>

      {loading && <Section eyebrow="COACHING RESPONSE" title="Reviewing your context…"><div className="coach-response-skeleton"><i/><i/><i/><i/></div><p className="coach-loading-copy" role="status">Checking the relevant saved records and preparing guidance.</p></Section>}
      {!loading && response && parsedResponse && <Section eyebrow={responsePrompt === 'Saved coaching response' ? 'SAVED AI RESPONSE' : 'AI-GENERATED INTERPRETATION'} title="Your coaching notes" action={responseDate && <time>{new Date(responseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</time>}><div className="coach-response-prompt">{responsePrompt}</div>{parsedResponse.intro && <p className="coach-response-intro">{parsedResponse.intro}</p>}{parsedResponse.sections.length ? <div className="coach-response-sections">{parsedResponse.sections.map((section) => <article key={section.title}><h3>{section.title}</h3><p>{section.body}</p></article>)}</div> : <div className="coach-plain-response">{parsedResponse.intro}</div>}<div className="coach-safety-note"><span>ⓘ</span>Guidance is based on the available records and is not a medical assessment. The AI may interpret patterns; verify important decisions with a qualified professional.</div><div className="coach-response-actions"><button onClick={() => navigate('/dashboard/workout-plan')}>Open Workout Plan ↗</button><button onClick={() => navigate('/dashboard/log-workout')}>Log a workout ↗</button><button onClick={() => navigate('/dashboard/diet')}>Open Diet Plan ↗</button><button onClick={() => navigate('/dashboard/history')}>View History ↗</button></div></Section>}
    </div>

    <aside className="coach-side-column"><Section eyebrow="RECORDED FACTS" title="Your training snapshot"><p className="coach-evidence-note">These are saved records, separate from the coach’s interpretation.</p>{contextStatus === 'loading' ? <div className="coach-facts-skeleton"><i/><i/><i/></div> : workouts.length ? <div className="coach-fact-list"><div><span>Completed sessions on record</span><strong>{workouts.length}</strong></div><div><span>Training time this week</span><strong>{workouts.filter((workout) => { const date = dateFromKey(dateKey(workout.workoutDate)); const today = new Date(); const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6); const end = new Date(today.getFullYear(), today.getMonth(), today.getDate()); return date && date >= start && date <= end; }).reduce((sum, workout) => sum + (Number(workout.durationMinutes) || 0), 0)} min</strong></div><div><span>Latest recorded session</span><strong>{recent[0] ? prettyDate(dateKey(recent[0].workoutDate)) : 'No date recorded'}</strong></div>{plan && <div><span>Plan cadence</span><strong>{plan.trainingDaysPerWeek || activePlan.trainingDaysPerWeek || '—'} days / week</strong></div>}</div> : <div className="coach-no-records"><span>◷</span><strong>{contextError ? 'Workout history unavailable' : 'No workouts recorded yet'}</strong><p>Log a session to give progress reviews more context. You can still ask general questions.</p><Button small variant="secondary" onClick={() => navigate('/dashboard/log-workout')}>Log a workout</Button></div>}{contextError && <button className="coach-retry-link" onClick={() => setLoadKey((value) => value + 1)}>Retry context load ↻</button>}</Section>

      <Section eyebrow="SAVED FOR YOU" title="Previous coaching"><p className="coach-evidence-note">Past AI feedback saved to your account.</p>{historyLoading ? <div className="coach-facts-skeleton"><i/><i/></div> : history.length ? <div className="coach-history-list">{history.slice(0, 5).map((entry, index) => <button type="button" key={entry.id ?? `${entry.createdAt}-${index}`} onClick={() => showSavedResponse(entry)}><span className="coach-history-dot">✦</span><span><strong>{entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Saved response'}</strong><small>{String(entry.response || '').replace(/\s+/g, ' ').slice(0, 76)}{String(entry.response || '').length > 76 ? '…' : ''}</small></span><i>↗</i></button>)}</div> : <div className="coach-history-empty">{historyError ? <><span>{historyError}</span><button onClick={loadHistory}>Retry history ↻</button></> : <span>Your saved coach responses will appear here after your first request.</span>}</div>}
      </Section>

      <div className="coach-action-card"><span className="coach-eyebrow">TURN INSIGHT INTO ACTION</span><strong>Ready for your next session?</strong><p>Keep your log and plan up to date so future feedback has better context.</p><Button full onClick={() => navigate('/dashboard/log-workout')}>Start a workout session ↗</Button><button onClick={() => navigate('/dashboard/workout-plan')}>Review your active plan</button></div>
    </aside></div>
  </div></main>;
}
