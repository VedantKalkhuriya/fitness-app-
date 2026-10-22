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
  getSummary: (userId) => request(`/fitness/workout-tracker/summary/${userId}`),

  getHistory: (userId, range) => request(
    range
      ? `/fitness/workout-tracker/history/${userId}/range?start=${range.start}&end=${range.end}`
      : `/fitness/workout-tracker/history/${userId}`
  ),

  logWorkout: (userId, payload) => request(`/fitness/workout-tracker/log/${userId}`, { method: 'POST', body: payload }),

  generateDietPlan: (userId, options) =>
    request(`/fitness/diet/${userId}`, { method: 'POST', body: options }),

  getDietPlans: (userId) => request(`/fitness/diet/${userId}`),

  updateDietPlan: (userId, planId, plan) =>
    request(`/fitness/diet/${userId}/${planId}`, { method: 'PUT', body: plan }),

  substituteDietMeal: (userId, requestBody) =>
    request(`/fitness/diet/${userId}/substitute`, { method: 'POST', body: requestBody }),

  getWorkoutPlans: (userId) => request(`/fitness/workout-plans/${userId}`),

  generateWorkoutPlan: (userId, config) =>
    request(`/fitness/workout-plans/${userId}/generate`, { method: 'POST', body: config }),

  updateWorkoutPlan: (userId, planId, plan) =>
    request(`/fitness/workout-plans/${userId}/${planId}`, { method: 'PUT', body: plan }),

  activateWorkoutPlan: (userId, planId) =>
    request(`/fitness/workout-plans/${userId}/${planId}/active`, { method: 'PUT' }),

  getCoachingFeedback: (userId, prompt) =>
    request(`/fitness/feedback/${userId}`, { method: 'POST', body: { prompt } }),

  getFeedbackHistory: (userId) => request(`/fitness/history/${userId}/FEEDBACK`),

  getAiHistory: (userId) =>
    request(`/fitness/history/${userId}`, { fallback: [] }),
};
