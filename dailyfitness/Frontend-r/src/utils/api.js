// Central place for every backend call. Point this at your real API.
export const API_BASE = 'http://localhost:8080';

function authHeaders() {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

// Generic fetch helper: tries the real API, and if it's unreachable
// (e.g. no backend running yet) resolves with `fallback` instead of
// throwing, so the UI always has something to show while you wire up
// a real server.
async function request(path, { method = 'GET', body, fallback } = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: authHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Request failed: ${res.status}`);
    }

    const contentType = res.headers.get('content-type') || '';
    return contentType.includes('application/json') ? res.json() : res.text();
  } catch (err) {
    const isNetworkFailure = err instanceof TypeError || err?.message?.includes('Failed to fetch');
    if (fallback !== undefined && isNetworkFailure) return fallback;
    throw err;
  }
}

export const authApi = {
  login: (name, password) =>
    request('/user/login/user', { method: 'POST', body: { name, password } }),
  signup: (payload) =>
    request('/user/signup/user', { method: 'POST', body: payload }),
};

export const fitnessApi = {
  getSummary: (userId) =>
    request(`/fitness/workout-tracker/summary/${userId}`, {
      fallback: {
        totalWorkoutsAllTime: 12,
        workoutsThisWeek: 4,
        totalCaloriesThisWeek: 1840,
        totalMinutesThisWeek: 220,
        currentStreak: 4,
        aiWeeklyAnalysis:
          '🔥 Great week! You hit 4 sessions and trained consistently. Focus on legs next week as that was missed. Keep the streak going!',
      },
    }),

  getHistory: (userId, range) =>
    request(
      range
        ? `/fitness/workout-tracker/history/${userId}/range?start=${range.start}&end=${range.end}`
        : `/fitness/workout-tracker/history/${userId}`,
      {
        fallback: [
          { workoutDate: '2024-03-29', workoutType: 'Chest', durationMinutes: 60, caloriesBurned: 450, feeling: 'Great', exercises: [{ exerciseName: 'Bench Press', sets: 4, reps: 10, weightKg: 60 }] },
          { workoutDate: '2024-03-28', workoutType: 'Legs', durationMinutes: 50, caloriesBurned: 380, feeling: 'Average', exercises: [{ exerciseName: 'Squats', sets: 4, reps: 12, weightKg: 80 }] },
          { workoutDate: '2024-03-27', workoutType: 'Back', durationMinutes: 55, caloriesBurned: 420, feeling: 'Great', exercises: [{ exerciseName: 'Deadlift', sets: 4, reps: 8, weightKg: 100 }] },
          { workoutDate: '2024-03-26', workoutType: 'Cardio', durationMinutes: 30, caloriesBurned: 280, feeling: 'Tired', exercises: [] },
        ],
      }
    ),

  logWorkout: (userId, payload) =>
    request(`/fitness/workout-tracker/log/${userId}`, {
      method: 'POST',
      body: payload,
      fallback: {
        aiFeedback: `Great ${payload.workoutType} session! You trained for ${payload.durationMinutes} minutes and burned ${payload.caloriesBurned} calories. You felt ${payload.feeling.toLowerCase()} — that's what counts! Make sure to get enough protein and sleep tonight for recovery.`,
      },
    }),

  generateDietPlan: (userId, notes) =>
    request(`/fitness/diet/${userId}`, {
      method: 'POST',
      body: { notes },
      fallback: {
        summary: 'A balanced plan focused on steady energy and protein at every meal.',
        totalDailyCalories: 2400,
        hydrationTip: 'Drink 3-4 litres of water daily.',
        weekPlan: [
          { day: 'Monday', breakfast: 'Oats with banana and peanut butter', lunch: 'Grilled chicken, brown rice, salad', dinner: 'Paneer curry with 2 rotis', snack: 'Greek yoghurt with nuts', calories: 2400 },
          { day: 'Tuesday', breakfast: 'Eggs with whole wheat toast', lunch: 'Dal rice with vegetables', dinner: 'Grilled fish with salad', snack: 'Fruit bowl', calories: 2400 },
        ],
      },
    }),

  generateWorkoutPlan: (userId) =>
    request(`/fitness/workout/${userId}`, {
      method: 'POST',
      fallback:
        '💪 Your 7-Day Workout Plan\n\n📅 Day 1 - Monday (Chest & Triceps)\n• Bench Press: 4 sets × 10 reps @ 60kg — Rest: 90s\n• Incline Dumbbell Press: 3 × 12 — Rest: 60s\n• Cable Fly: 3 × 15 — Rest: 60s\n• Tricep Dips: 3 × 12 — Rest: 60s\n\n📅 Day 2 - Tuesday (Back & Biceps)\n• Deadlift: 4 × 8 @ 80kg — Rest: 120s\n• Pull-ups: 4 × 8 — Rest: 90s\n• Barbell Row: 3 × 10 — Rest: 90s\n• Bicep Curls: 3 × 12 — Rest: 60s\n\n📅 Day 3 - Wednesday (REST)\n• Active recovery: 20 min walk or light stretching\n\n💡 Tip: Always warm up for 5 mins before starting.',
    }),

  getFeedback: (userId, log) =>
    request(`/fitness/feedback/${userId}`, {
      method: 'POST',
      body: log,
      fallback:
        "🤖 AI Coach Feedback\n\n✅ What you're doing well:\n• Great consistency — 4 workouts in a week shows real commitment\n• You're tracking your progress, which is half the battle\n• Energy levels seem to be improving based on your notes\n\n⚠️ What needs improvement:\n• Weekend diet needs attention — this can undo weekday progress\n• Consider adding more vegetables to your meals\n• Sleep 7–8 hours for optimal recovery\n\n💡 Tips for next week:\n• Prep your weekend meals in advance to avoid poor food choices\n• Add one extra cardio session (even 20 mins walk counts)\n• Stay hydrated — aim for 3 litres daily\n\nKeep pushing — you're on the right track! 💪",
    }),

  getAiHistory: (userId) =>
    request(`/fitness/history/${userId}`, { fallback: [] }),
};
