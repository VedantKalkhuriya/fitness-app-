import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const ACTIONS = [
  { to: '/dashboard/log-workout', label: "📝 Log Today's Workout", variant: 'primary' },
  { to: '/dashboard/diet', label: '🥗 Generate Diet Plan', variant: 'secondary' },
  { to: '/dashboard/workout-plan', label: '💪 Get Workout Plan', variant: 'secondary' },
  { to: '/dashboard/feedback', label: '🤖 Get AI Feedback', variant: 'secondary' },
];

export default function QuickActionsCard() {
  const navigate = useNavigate();

  return (
    <Card title="QUICK ACTIONS">
      <div className="flex flex-col gap-3">
        {ACTIONS.map((a) => (
          <Button key={a.to} variant={a.variant} full onClick={() => navigate(a.to)}>
            {a.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}
