import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';

const NAV_ITEMS = [
  { to: '/dashboard/overview', label: 'Overview' },
  { to: '/dashboard/workout-plan', label: 'Workouts' },
  { to: '/dashboard/diet', label: 'Nutrition' },
  { to: '/dashboard/history', label: 'Progress' },
  { to: '/dashboard/feedback', label: 'AI Coach' },
  { to: '/dashboard/log-workout', label: 'Log Workout' },
  { to: '/dashboard/profile', label: 'Settings' },
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
    <header className="fitai-topnav">
      <NavLink className="fitai-wordmark" to="/dashboard/overview" aria-label="FITAI home">
        <span className="fitai-mark" aria-hidden="true">?</span>
        <span>FIT<span>AI</span></span>
      </NavLink>
      <nav className="fitai-nav" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `fitai-nav-link${isActive ? ' active' : ''}`}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="fitai-nav-tools">
        <button className="fitai-nav-user" onClick={() => navigate('/dashboard/profile')} aria-label={`Open ${userName}'s profile`} title={userName}>
          <span>{userName.trim().charAt(0).toUpperCase()}</span>
          <span className="fitai-user-name">{userName}</span>
        </button>
        <button className="fitai-nav-signout" onClick={handleLogout} aria-label="Sign out" title="Sign out">?</button>
      </div>
      <style>{` .fitai-topnav{position:sticky;top:0;z-index:50;min-height:76px;width:100%;display:grid;grid-template-columns:minmax(140px,1fr) auto minmax(140px,1fr);align-items:center;gap:20px;padding:12px 30px;background:rgba(15,18,17,.92);border-bottom:1px solid rgba(209,224,215,.09);backdrop-filter:blur(18px)}.fitai-wordmark{display:inline-flex;align-items:center;gap:9px;width:max-content;color:#eff3ef;text-decoration:none;font-size:18px;font-weight:750;letter-spacing:-.65px}.fitai-wordmark>span:last-child>span{color:#c5f36c}.fitai-mark{display:grid;place-items:center;width:27px;height:27px;border-radius:9px;background:#c5f36c;color:#17200e;font-size:16px}.fitai-nav{justify-self:center;display:flex;align-items:center;gap:3px;padding:5px;border:1px solid #ffffff08;border-radius:999px;background:#252827}.fitai-nav-link{white-space:nowrap;text-decoration:none;color:#9da39f;font-size:11px;padding:9px 11px;border-radius:999px;transition:background .18s,color .18s}.fitai-nav-link:hover{color:#eff4ef}.fitai-nav-link.active{background:#353938;color:#f5f7f4;box-shadow:0 2px 8px #0003}.fitai-nav-tools{justify-self:end;display:flex;align-items:center;gap:9px}.fitai-nav-user,.fitai-nav-signout{height:39px;border:1px solid #ffffff08;border-radius:999px;background:#252827;color:#e8ece8;cursor:pointer;transition:background .18s,border-color .18s}.fitai-nav-user{display:flex;align-items:center;gap:9px;padding:4px 12px 4px 5px;font-size:11px}.fitai-nav-user>span:first-child{display:grid;place-items:center;width:29px;height:29px;border-radius:50%;background:#3a403c;color:#cbf77b;font-weight:700}.fitai-nav-user:hover,.fitai-nav-signout:hover{background:#303633;border-color:#c5f36c35}.fitai-nav-signout{width:39px;font-size:16px}.fitai-topnav a:focus-visible,.fitai-topnav button:focus-visible{outline:2px solid #c5f36c;outline-offset:2px}@media(max-width:900px){.fitai-topnav{grid-template-columns:auto 1fr auto;gap:12px;padding:11px 18px}.fitai-nav-link{padding:9px 11px;font-size:11px}}@media(max-width:680px){.fitai-topnav{min-height:65px;grid-template-columns:auto 1fr auto;gap:9px;padding:9px 12px}.fitai-wordmark{font-size:16px;gap:6px}.fitai-mark{width:25px;height:25px}.fitai-nav{justify-self:stretch;overflow-x:auto;scrollbar-width:none;justify-content:flex-start;padding:4px}.fitai-nav::-webkit-scrollbar{display:none}.fitai-nav-link{font-size:10px;padding:8px 11px}.fitai-nav-tools{gap:5px}.fitai-nav-user{width:36px;height:36px;justify-content:center;padding:3px}.fitai-nav-user>span:first-child{width:28px;height:28px}.fitai-user-name{display:none}.fitai-nav-signout{width:34px;height:36px}}@media(max-width:440px){.fitai-topnav{grid-template-columns:auto 1fr auto;gap:6px;padding-inline:9px}.fitai-nav{max-width:calc(100vw - 148px)}.fitai-nav-link{font-size:9px;padding:8px 9px}.fitai-wordmark{font-size:14px}}`}</style>
    </header>
  );
}
