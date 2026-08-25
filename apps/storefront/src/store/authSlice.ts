import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { UserPublic } from "@dhanvantari/shared-types";

interface AuthState {
  user: UserPublic | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // true on init — waiting for auth check
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<UserPublic | null>) {
      state.user = action.payload;
      state.isAuthenticated = action.payload !== null;
      state.isLoading = false;
    },
    setAuthLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },
  },
});

export const { setUser, setAuthLoading, logout } = authSlice.actions;
export default authSlice.reducer;
