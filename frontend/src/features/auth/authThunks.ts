// src/features/auth/authThunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axios";

// Login
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (
    credentials: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post("/auth/login", credentials);

      // Normalize role casing
      const normalizedUser = {
        ...response.data.user,
        role: response.data.user.role?.toLowerCase(),
      };

      // ✅ Save token + user to localStorage
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(normalizedUser));

      return { ...response.data, user: normalizedUser };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || "Login failed");
    }
  }
);

// Register
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (
    userData: {
      name: string;
      email: string;
      password: string;
      role?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post("/auth/register", userData);

      const normalizedUser = {
        ...response.data.user,
        role: response.data.user.role?.toLowerCase(),
      };

      // ✅ Save user after registration too
      localStorage.setItem("user", JSON.stringify(normalizedUser));

      return { ...response.data, user: normalizedUser };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || "Registration failed");
    }
  }
);

// Logout
export const logoutUser = createAsyncThunk("auth/logoutUser", async () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user"); // ✅ clear user too
  return true;
});
