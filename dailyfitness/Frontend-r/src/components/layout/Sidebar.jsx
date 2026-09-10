import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';

const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard/overview', icon: '🏠', label: 'Overview' },
      { to: '/dashboard/diet', icon: '🥗', label: 'Diet Plan' },
      { to: '/dashboard/workout-plan', icon: '💪', label: 'Workout Plan' },
    ],
  },
  {
    label: 'Tracking',
    items: [
      { to: '/dashboard/log-workout', icon: '📝', label: 'Log Workout' },
      { to: '/dashboard/history', icon: '📅', label: 'History' },
    ],
  },
  {
    label: 'AI Coach',
    items: [
      { to: '/dashboard/feedback', icon: '🤖', label: 'AI Feedback' },
      { to: '/dashboard/profile', icon: '👤', label: 'My Profile' },
    ],
  },
];

export default function Sidebar() {
  const userName = useSelector((state) => state.auth.userName) || 'Athlete';
  const dispatch = useDispatch();
  const navigate = useNavigate();

  function handleLogout() {
    if (window.confirm('Sign out?')) {
      dispatch(logout());
      navigate('/login');
    }
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-60 border-r border-slate-700 bg-slate-900/90">
      <div className="border-b border-slate-700 px-6 py-7">
        <div className="text-3xl font-black uppercase tracking-[0.2em] text-emerald-400">
          FIT<span className="text-slate-100">AI</span>
        </div>
      </div>

      <div className="flex items-center gap-3 border-b border-slate-700 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-base">
          💪
        </div>
        <div>
          <div className="max-w-[140px] truncate text-sm font-semibold text-slate-100">{userName}</div>
          <div className="text-[11px] font-medium text-emerald-300">Pro Member</div>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {section.label}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                    }`
                  }
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-700 px-3 py-4">
        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-sm text-slate-300 transition hover:border-rose-400 hover:text-rose-300"
          onClick={handleLogout}
        >
          <span>🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
