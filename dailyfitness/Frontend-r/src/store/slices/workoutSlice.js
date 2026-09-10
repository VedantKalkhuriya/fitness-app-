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
  return { payload, result };
});

const initialState = {
  summary: null,
  history: [],
  summaryStatus: 'idle', // idle | loading | succeeded | failed
  historyStatus: 'idle',
  logStatus: 'idle',
  lastFeedback: '',
};

const workoutSlice = createSlice({
  name: 'workout',
  initialState,
  reducers: {},
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

      .addCase(logWorkout.pending, (state) => { state.logStatus = 'loading'; })
      .addCase(logWorkout.fulfilled, (state, action) => {
        state.logStatus = 'succeeded';
        state.lastFeedback = action.payload.result?.aiFeedback || 'Great session! Keep it up!';
        state.history = [action.payload.payload, ...state.history];
      })
      .addCase(logWorkout.rejected, (state) => { state.logStatus = 'failed'; });
  },
});

export default workoutSlice.reducer;
