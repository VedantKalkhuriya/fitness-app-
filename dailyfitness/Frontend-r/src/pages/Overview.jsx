import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSummary, fetchHistory } from '../store/slices/workoutSlice';
import StatsRow from './overview/StatsRow';
import WeeklyGoalCard from './overview/WeeklyGoalCard';
import QuickActionsCard from './overview/QuickActionsCard';
import RecentWorkoutsCard from './overview/RecentWorkoutsCard';

export default function Overview() {
  const dispatch = useDispatch();
  const userId = useSelector((state) => state.auth.userId);
  const { summary, history } = useSelector((state) => state.workout);

  useEffect(() => {
    dispatch(fetchSummary(userId));
    dispatch(fetchHistory({ userId }));
  }, [dispatch, userId]);

  return (
    <div className="space-y-6">
      <StatsRow summary={summary} />

      <div className="grid gap-6 lg:grid-cols-2">
        <WeeklyGoalCard workoutsThisWeek={summary?.workoutsThisWeek ?? 0} />
        <QuickActionsCard />
      </div>

      <RecentWorkoutsCard workouts={history} />
    </div>
  );
}
