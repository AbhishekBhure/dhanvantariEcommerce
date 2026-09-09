import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { UserPublic } from "@dhanvantari/shared-types";
import api, { ApiError } from "@/lib/api";

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

type Credentials = { email: string; password: string };
type RegisterInput = { name: string; email: string; password: string; phone?: string };
type UserResponse = { data: { user: UserPublic } };
const getMessage = (error: unknown, fallback: string) => error instanceof ApiError ? error.message : fallback;
const sessionHeaders = () => {
  if (typeof window === "undefined") return undefined;
  const sessionId = window.localStorage.getItem("dhanvantari-session-id")?.trim();
  return sessionId ? { "x-session-id": sessionId } : undefined;
};

export const loadCurrentUser = createAsyncThunk("auth/loadCurrentUser", async (_, { rejectWithValue }) => {
  try { return (await api.get<UserResponse>("/auth/me")).data.user; }
  catch (error) { return rejectWithValue(getMessage(error, "Not authenticated")); }
});
export const loginUser = createAsyncThunk("auth/loginUser", async (credentials: Credentials, { rejectWithValue }) => {
  try { return (await api.post<UserResponse>("/auth/login", credentials, { headers: sessionHeaders() })).data.user; }
  catch (error) { return rejectWithValue(getMessage(error, "Unable to sign in.")); }
});
export const registerUser = createAsyncThunk("auth/registerUser", async (input: RegisterInput, { rejectWithValue }) => {
  try { return (await api.post<UserResponse>("/auth/register", input, { headers: sessionHeaders() })).data.user; }
  catch (error) { return rejectWithValue(getMessage(error, "Unable to create account.")); }
});
export const logoutUser = createAsyncThunk("auth/logoutUser", async () => { await api.post("/auth/logout"); });

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
  extraReducers: (builder) => {
    builder.addCase(loadCurrentUser.pending, (state) => { state.isLoading = true; });
    builder.addCase(loadCurrentUser.fulfilled, (state, action) => { state.user = action.payload; state.isAuthenticated = true; state.isLoading = false; });
    builder.addCase(loadCurrentUser.rejected, (state) => { state.user = null; state.isAuthenticated = false; state.isLoading = false; });
    builder.addCase(loginUser.fulfilled, (state, action) => { state.user = action.payload; state.isAuthenticated = true; state.isLoading = false; });
    builder.addCase(registerUser.fulfilled, (state, action) => { state.user = action.payload; state.isAuthenticated = true; state.isLoading = false; });
    builder.addCase(logoutUser.fulfilled, (state) => { state.user = null; state.isAuthenticated = false; state.isLoading = false; });
  },
});

export const { setUser, setAuthLoading, logout } = authSlice.actions;
export default authSlice.reducer;
