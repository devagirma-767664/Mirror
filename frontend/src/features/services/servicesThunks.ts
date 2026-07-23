// src/features/services/servicesThunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axios";

// Fetch all services
export const fetchServices = createAsyncThunk(
  "services/fetchServices",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/services"); // ✅ matches backend
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || "Failed to fetch services");
    }
  }
);

// Add new service
export const addService = createAsyncThunk(
  "services/addService",
  async (
    { name, price, duration }: { name: string; price: number; duration: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post("/services", { name, price, duration });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || "Failed to add service");
    }
  }
);

// Update service
export const updateService = createAsyncThunk(
  "services/updateService",
  async (
    { id, name, price, duration }: { id: string; name: string; price: number; duration: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.put(`/services/${id}`, { name, price, duration });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || "Failed to update service");
    }
  }
);

// Delete service
export const deleteService = createAsyncThunk(
  "services/deleteService",
  async (id: string, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/services/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || "Failed to delete service");
    }
  }
);
