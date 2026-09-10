import { createSlice } from '@reduxjs/toolkit';
import { loadFromStorage, saveToStorage, clearStorage } from '../../utils/storage';

const initialState = {
  token: loadFromStorage('token', null),
  userId: loadFromStorage('userId', null),
  userName: loadFromStorage('userName', null),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { token, userId, userName } = action.payload;
      state.token = token;
      state.userId = userId;
      state.userName = userName;
      saveToStorage('token', token);
      saveToStorage('userId', userId);
      saveToStorage('userName', userName);
    },
    updateUserName: (state, action) => {
      state.userName = action.payload;
      saveToStorage('userName', action.payload);
    },
    logout: (state) => {
      state.token = null;
      state.userId = null;
      state.userName = null;
      clearStorage();
    },
  },
});

export const { setCredentials, updateUserName, logout } = authSlice.actions;
export const selectIsAuthenticated = (state) => Boolean(state.auth.token);
export default authSlice.reducer;
