import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { fetchSummary } from '../../store/slices/workoutSlice';

const PAGE_TITLES = {
  overview: 'Overview',
  diet: 'Diet Plan',
  'workout-plan': 'Workout Plan',
  'log-workout': 'Log Workout',
  history: 'History',
  feedback: 'AI Feedback',
  profile: 'Settings',
};

export default function DashboardLayout() {
  const location = useLocation();
  const dispatch = useDispatch();
  const userId = useSelector((state) => state.auth.userId);

  const segment = location.pathname.split('/').pop();
  const title = PAGE_TITLES[segment] || 'Overview';

  useEffect(() => {
    dispatch(fetchSummary(userId));
  }, [dispatch, userId]);

  return (
    <div className="flex min-h-screen flex-col bg-[#050505] text-slate-100">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <Topbar title={title} />
        <div className="flex-1 p-6 max-md:p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
