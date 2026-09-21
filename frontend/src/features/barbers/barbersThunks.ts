import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axios";

// Fetch all barbers (landing page, admin view)
export const fetchBarbers = createAsyncThunk(
  "barbers/fetchBarbers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/barbers");
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || "Failed to fetch barbers");
    }
  }
);

// Fetch barber availability (customer booking flow)
// 🔹 Backend route: GET /barbers/:id/availability
export const fetchBarberAvailability = createAsyncThunk(
  "barbers/fetchBarberAvailability",
  async (barberId: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/barbers/${barberId}/availability`);
      return { barberId, availability: response.data };
    } catch (err: any) {
      return rejectWithValue(err.response?.data || "Failed to fetch availability");
    }
  }
);

// Fetch appointments (Barber Dashboard)
// 🔹 Backend route is GET /appointments (auth + roleMiddleware)
export const fetchBarberAppointments = createAsyncThunk(
  "appointments/fetchBarberAppointments",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/barber/appointments"); // ✅ no barberId in URL
      return response.data;
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.response?.statusText ||
        err.message ||
        "Failed to fetch barber appointments";
      return rejectWithValue(message);
    }
  }
);

// Start a session
// 🔹 Backend route is PUT /appointments/:id/start
export const startSession = createAsyncThunk(
  "barbers/startSession",
  async (appointmentId: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/barber/appointments/${appointmentId}/start`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || "Failed to start session");
    }
  }
);

// Close a session
// 🔹 Backend route is PUT /appointments/:id/close
export const closeSession = createAsyncThunk(
  "barbers/closeSession",
  async (appointmentId: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/barber/appointments/${appointmentId}/close`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || "Failed to close session");
    }
  }
);

// Request day off
// 🔹 Backend route is POST /dayoff
export const requestDayOff = createAsyncThunk(
  "barbers/requestDayOff",
  async (dayOffData: { barberId: string; date: string; reason: string }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/barber/dayoff", {
        barberId: dayOffData.barberId,
        requestDate: dayOffData.date,
        reason: dayOffData.reason,
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || "Failed to request day off");
    }
  }
);

// Fetch barber ratings
// 🔹 Backend route is GET /ratings
export const fetchBarberRatings = createAsyncThunk(
  "barbers/fetchBarberRatings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/barber/ratings");
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || "Failed to fetch ratings");
    }
  }
);



