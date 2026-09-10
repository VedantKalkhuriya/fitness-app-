import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { fitnessApi } from '../utils/api';

const CHECKLIST = [
  { icon: '📊', title: 'Workout frequency', desc: 'How many days did you train?' },
  { icon: '⚖️', title: 'Weight changes', desc: 'Any changes in body weight?' },
  { icon: '🍽️', title: 'Diet adherence', desc: 'Did you follow the meal plan?' },
  { icon: '😴', title: 'Sleep and energy', desc: 'How was your recovery?' },
];

export default function Feedback() {
  const userId = useSelector((state) => state.auth.userId);
  const [log, setLog] = useState('');
  const [weight, setWeight] = useState('');
  const [validationError, setValidationError] = useState('');

  const askCoach = useCallback((text) => fitnessApi.getFeedback(userId, text), [userId]);
  const { run, data: feedback, loading } = useAsyncAction(askCoach);

  function handleSubmit() {
    if (!log.trim()) {
      setValidationError('Please describe your progress first.');
      return;
    }
    setValidationError('');
    run(log.trim());
  }

  return (
    <div>
      <div className="grid-2">
        <Card title="GET AI FEEDBACK" badge="AI Coach">
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
            Tell your AI coach about your progress and get personalised feedback.
          </p>
          <div className="form-group">
            <label className="form-label">Your progress this week</label>
            <textarea
              className="form-textarea"
              style={{ minHeight: 120 }}
              placeholder="e.g. Worked out 4 days this week, hit chest and back. Weight went from 75kg to 74.5kg. Feeling stronger but diet was bad on weekends..."
              value={log}
              onChange={(e) => setLog(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Current weight (kg)</label>
            <input type="number" className="form-input" placeholder="70" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
          {validationError && (
            <div style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 10 }}>{validationError}</div>
          )}
          <Button full onClick={handleSubmit} disabled={loading}>
            🤖 {loading ? 'Thinking...' : 'Get AI Feedback'}
          </Button>
        </Card>

        <Card title="WHAT TO INCLUDE">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {CHECKLIST.map((c) => (
              <div key={c.title} style={{ display: 'flex', gap: 12 }}>
                <span style={{ fontSize: 20 }}>{c.icon}</span>
                <div>
                  <strong style={{ fontSize: 13, display: 'block', marginBottom: 3 }}>{c.title}</strong>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{c.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="AI COACH FEEDBACK">
        {loading && <LoadingSpinner text="Your AI coach is analysing your progress..." />}
        {!loading && feedback && <div className="ai-result">{feedback}</div>}
        {!loading && !feedback && (
          <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: 32 }}>
            Submit your progress to get feedback 👆
          </div>
        )}
      </Card>
    </div>
  );
}
