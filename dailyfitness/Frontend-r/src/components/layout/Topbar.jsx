import { useSelector } from 'react-redux';

export default function Topbar({ title }) {
  const streak = useSelector((state) => state.workout.summary?.currentStreak ?? 0);

  return (
    <div className="fitai-pagebar">
      <div>{title}</div>
      <div className="fitai-pagebar-streak"><span>?</span><span>{streak} day streak</span></div>
      <style>{`.fitai-pagebar{display:flex;justify-content:space-between;align-items:center;padding:15px 30px 0;color:#f0f3f0;font-size:12px;font-weight:650;letter-spacing:.015em}.fitai-pagebar-streak{display:flex;align-items:center;gap:7px;color:#c7ed8a;font-size:10px;font-weight:550}.fitai-pagebar-streak span:first-child{font-size:13px}@media(max-width:760px){.fitai-pagebar{padding:12px 16px 0}}`}</style>
    </div>
  );
}
