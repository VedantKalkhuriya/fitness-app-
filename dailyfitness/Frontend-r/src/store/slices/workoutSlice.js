import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fitnessApi } from '../../utils/api';

export const fetchSummary = createAsyncThunk('workout/fetchSummary', (userId) =>
  fitnessApi.getSummary(userId)
);

export const fetchHistory = createAsyncThunk('workout/fetchHistory', ({ userId, range }) =>
  fitnessApi.getHistory(userId, range)
);

export const logWorkout = createAsyncThunk('workout/logWorkout', async ({ userId, payload }) => {
  const result = await fitnessApi.logWorkout(userId, payload);
  const [summary, history] = await Promise.all([
    fitnessApi.getSummary(userId).catch(() => null),
    fitnessApi.getHistory(userId).catch(() => null),
  ]);
  return { payload, result, summary, history };
});

const initialState = {
  summary: null,
  history: [],
  summaryStatus: 'idle', // idle | loading | succeeded | failed
  historyStatus: 'idle',
  logStatus: 'idle',
  logError: '',
  lastWorkout: null,
  lastFeedback: '',
};

const workoutSlice = createSlice({
  name: 'workout',
  initialState,
  reducers: {
    resetWorkoutLog: (state) => {
      state.logStatus = 'idle';
      state.logError = '';
      state.lastWorkout = null;
      state.lastFeedback = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSummary.pending, (state) => { state.summaryStatus = 'loading'; })
      .addCase(fetchSummary.fulfilled, (state, action) => {
        state.summaryStatus = 'succeeded';
        state.summary = action.payload;
      })
      .addCase(fetchSummary.rejected, (state) => { state.summaryStatus = 'failed'; })

      .addCase(fetchHistory.pending, (state) => { state.historyStatus = 'loading'; })
      .addCase(fetchHistory.fulfilled, (state, action) => {
        state.historyStatus = 'succeeded';
        state.history = action.payload;
      })
      .addCase(fetchHistory.rejected, (state) => { state.historyStatus = 'failed'; })

      .addCase(logWorkout.pending, (state) => { state.logStatus = 'loading'; state.logError = ''; })
      .addCase(logWorkout.fulfilled, (state, action) => {
        state.logStatus = 'succeeded';
        state.lastFeedback = action.payload.result?.aiFeedback || 'Great session! Keep it up!';
        state.lastWorkout = action.payload.result;
        if (action.payload.summary) state.summary = action.payload.summary;
        if (action.payload.history) state.history = action.payload.history;
      })
      .addCase(logWorkout.rejected, (state, action) => {
        state.logStatus = 'failed';
        state.logError = action.error?.message || 'Could not save the workout.';
      });
  },
});

export const { resetWorkoutLog } = workoutSlice.actions;
export default workoutSlice.reducer;
