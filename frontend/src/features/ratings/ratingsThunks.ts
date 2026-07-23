// src/features/ratings/ratingsThunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axios";

// Submit a rating for a barber
export const submitRating = createAsyncThunk(
  "ratings/submitRating",
  async (
    ratingData: { barberId: string; customerId: string; score: number; comment?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post("/ratings", ratingData);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || "Failed to submit rating");
    }
  }
);

// Fetch ratings for a barber
export const fetchBarberRatings = createAsyncThunk(
  "ratings/fetchBarberRatings",
  async (barberId: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/ratings/barber/${barberId}`);
      return { barberId, ratings: response.data };
    } catch (err: any) {
      return rejectWithValue(err.response?.data || "Failed to fetch ratings");
    }
  }
);

// Fetch average rating for a barber
export const fetchBarberAverageRating = createAsyncThunk(
  "ratings/fetchBarberAverageRating",
  async (barberId: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/ratings/barber/${barberId}/average`);
      return { barberId, average: response.data.average };
    } catch (err: any) {
      return rejectWithValue(err.response?.data || "Failed to fetch average rating");
    }
  }
);
