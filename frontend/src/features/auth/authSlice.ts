// src/features/auth/authSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import { loginUser, registerUser, logoutUser } from "./authThunks";

interface AuthState {
  user: any | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const storedUser = localStorage.getItem("user");

const initialState: AuthState = {
  user: storedUser ? JSON.parse(storedUser) : null, // ✅ hydrate user
  token: localStorage.getItem("token"),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession(state,action) {
      state.user=action.payload.user;state.token=action.payload.token;state.error=null;
      localStorage.setItem('user',JSON.stringify(state.user));localStorage.setItem('token',state.token!);
    },
    refreshUser(state,action) {state.user=action.payload;localStorage.setItem('user',JSON.stringify(state.user));},
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;

      // ✅ persist user + token
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("user", JSON.stringify(action.payload.user));
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Register
    builder.addCase(registerUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;

      // ✅ persist user
      localStorage.setItem("user", JSON.stringify(action.payload.user));
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Logout
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.token = null;

      // ✅ clear storage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    });
  },
});

export default authSlice.reducer;
export const {setSession,refreshUser}=authSlice.actions;
