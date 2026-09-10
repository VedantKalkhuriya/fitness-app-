import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { logWorkout } from '../store/slices/workoutSlice';
import ExerciseRow from './logworkout/ExerciseRow';

const WORKOUT_TYPES = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Full Body', 'Cardio', 'Core'];
const FEELINGS = [
  { value: 'Great', label: '😄 Great' },
  { value: 'Average', label: '😐 Average' },
  { value: 'Tired', label: '😴 Tired' },
];

let exerciseIdCounter = 0;
function newExercise() {
  exerciseIdCounter += 1;
  return { id: exerciseIdCounter, exerciseName: '', sets: 3, reps: 10, weightKg: 0, notes: '' };
}

export default function LogWorkout() {
  const dispatch = useDispatch();
  const userId = useSelector((state) => state.auth.userId);
  const { logStatus, lastFeedback } = useSelector((state) => state.workout);

  const [workoutType, setWorkoutType] = useState('Chest');
  const [duration, setDuration] = useState(45);
  const [calories, setCalories] = useState(350);
  const [feeling, setFeeling] = useState('Average');
  const [exercises, setExercises] = useState([newExercise(), newExercise()]);

  const loading = logStatus === 'loading';
  const todayLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

  function updateExercise(id, updated) {
    setExercises((rows) => rows.map((r) => (r.id === id ? updated : r)));
  }

  function removeExercise(id) {
    setExercises((rows) => rows.filter((r) => r.id !== id));
  }

  async function handleSubmit() {
    const payload = {
      workoutType,
      durationMinutes: Number(duration) || 45,
      caloriesBurned: Number(calories) || 350,
      feeling,
      workoutDate: new Date().toISOString().split('T')[0],
      exercises: exercises
        .filter((ex) => ex.exerciseName.trim())
        .map(({ exerciseName, sets, reps, weightKg, notes }) => ({
          exerciseName,
          sets: Number(sets) || 3,
          reps: Number(reps) || 10,
          weightKg: Number(weightKg) || 0,
          notes,
        })),
    };
    await dispatch(logWorkout({ userId, payload }));
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="LOG WORKOUT" badge={todayLabel}>
          <div className="mb-4">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              Workout Type
            </label>
            <select
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
              value={workoutType}
              onChange={(e) => setWorkoutType(e.target.value)}
            >
              {WORKOUT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Duration (mins)
              </label>
              <input
                type="number"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Calories Burned
              </label>
              <input
                type="number"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              How did you feel?
            </label>
            <div className="flex flex-wrap gap-2">
              {FEELINGS.map((f) => (
                <Button
                  key={f.value}
                  variant={feeling === f.value ? 'primary' : 'secondary'}
                  onClick={() => setFeeling(f.value)}
                  type="button"
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        <Card
          title="EXERCISES"
          action={
            <Button variant="secondary" small onClick={() => setExercises((r) => [...r, newExercise()])}>
              + Add Exercise
            </Button>
          }
        >
          <div className="mb-2 grid grid-cols-[minmax(0,2fr)_80px_80px_80px_minmax(0,1.2fr)_36px] gap-2 px-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
            <span>Exercise</span>
            <span>Sets</span>
            <span>Reps</span>
            <span>Weight</span>
            <span>Notes</span>
            <span />
          </div>
          {exercises.map((ex) => (
            <ExerciseRow
              key={ex.id}
              exercise={ex}
              onChange={(updated) => updateExercise(ex.id, updated)}
              onRemove={() => removeExercise(ex.id)}
            />
          ))}
        </Card>
      </div>

      <Card>
        <Button full className="py-4 text-base" onClick={handleSubmit} disabled={loading}>
          ✅ {loading ? 'Saving...' : 'Save Workout & Get AI Feedback'}
        </Button>
        {loading && <LoadingSpinner text="Saving and getting AI feedback..." />}
        {!loading && logStatus === 'succeeded' && (
          <div className="mt-4 whitespace-pre-wrap rounded-2xl border border-emerald-500/20 bg-slate-800/80 p-5 text-sm leading-7 text-slate-200">
            ✅ Workout saved!{'\n\n'}🤖 AI Feedback:{'\n'}{lastFeedback}
          </div>
        )}
      </Card>
    </div>
  );
}
