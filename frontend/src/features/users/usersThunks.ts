// src/features/users/usersThunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axios";

// Fetch all users (admin)
export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/admin/users");
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || "Failed to fetch users");
    }
  }
);

// Fetch single user by ID
export const fetchUserById = createAsyncThunk(
  "users/fetchUserById",
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/admin/users/${userId}`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || "Failed to fetch user");
    }
  }
);

// Add user (admin)
export const addUser = createAsyncThunk(
  "users/addUser",
  async (
    formData: FormData, // <-- accept FormData instead of plain object
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post("/admin/users", formData, {
        headers: {
          "Content-Type": "multipart/form-data", // <-- important
        },
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || "Failed to add user");
    }
  }
);


// Update user (admin)
export const updateUser = createAsyncThunk(
  "users/updateUser",
  async (
    { userId, updates }: { userId: string; updates: any },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.put(`/admin/users/${userId}`, updates);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || "Failed to update user");
    }
  }
);

// Delete user (admin)
export const deleteUser = createAsyncThunk(
  "users/deleteUser",
  async (userId: string, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/admin/users/${userId}`);
      return userId;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || "Failed to delete user");
    }
  }
);
