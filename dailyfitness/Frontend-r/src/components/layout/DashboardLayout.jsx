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
  profile: 'My Profile',
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
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <main className="ml-60 flex-1">
        <Topbar title={title} />
        <div className="flex-1 p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
