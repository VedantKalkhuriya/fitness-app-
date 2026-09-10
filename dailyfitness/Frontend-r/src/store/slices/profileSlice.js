import { createSlice } from '@reduxjs/toolkit';
import { loadFromStorage, saveToStorage } from '../../utils/storage';

const defaultProfile = {
  name: '',
  age: '',
  weight: '',
  height: '',
  goal: 'lose weight',
  activity: 'sedentary',
  diet: 'veg',
};

const initialState = loadFromStorage('userProfile', defaultProfile);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfile: (state, action) => {
      const updated = { ...state, ...action.payload };
      saveToStorage('userProfile', updated);
      return updated;
    },
  },
});

export const { setProfile } = profileSlice.actions;
export default profileSlice.reducer;
