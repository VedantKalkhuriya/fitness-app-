# FitAI — React Version

A React conversion of the FitAI login + dashboard pages, using functional components, hooks, Redux Toolkit, and localStorage persistence.

## Setup

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`). You'll land on `/login`.

To try it without a backend: just click **Sign In** with any email/password (or fill the signup form). There's no real server required — every API call in `src/utils/api.js` has a demo-data fallback, so the app works standalone and you can swap in your real backend later by editing `API_BASE` in that file.

## Project structure

```
src/
  store/                Redux Toolkit
    store.js
    slices/
      authSlice.js       token/userId/userName, synced to localStorage
      profileSlice.js     profile form fields, synced to localStorage
      workoutSlice.js     summary/history/log-workout async thunks
  hooks/
    useLocalStorage.js    generic "useState that persists"
    useAsyncAction.js     wraps an async call with loading/error state
  utils/
    storage.js            localStorage get/set/remove helpers
    calculations.js       BMI + daily calorie formulas
    api.js                all backend calls + demo-data fallbacks
  components/
    auth/                 LoginPage, LoginForm, SignupForm
    layout/                Sidebar, Topbar, DashboardLayout, ProtectedRoute
    common/                 Card, Button, LoadingSpinner, EmptyState
  pages/
    Overview.jsx  + overview/ (StatsRow, WeeklyGoalCard, QuickActionsCard, RecentWorkoutsCard)
    DietPlan.jsx  + DietPlanResult.jsx
    WorkoutPlan.jsx
    LogWorkout.jsx + logworkout/ExerciseRow.jsx
    History.jsx   + history/ (WeeklySummaryCard, AiHistoryCard)
    Feedback.jsx
    Profile.jsx
  App.jsx           route definitions
  main.jsx          entry point (Redux Provider + Router)
  index.css         all styling (same dark/green FitAI theme as the originals)
```

## Notes

- **Every page is its own file**, and any page with multiple visual sections has those sections split into their own small components (e.g. Overview is 4 components, History is 3).
- **Redux Toolkit** holds cross-page state (auth, profile, workout data) since those are needed in the sidebar, topbar, and multiple pages at once. Page-local state (form inputs, AI results) just uses `useState`/`useEffect` — no need to put everything in the store.
- **localStorage** is used in two ways: directly for auth/profile (via the Redux slices) and through the `useLocalStorage` hook for smaller per-page values like the diet notes textarea.
- Connect to your real backend by changing `API_BASE` in `src/utils/api.js`.
