import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axios";

// Public Mirror Max booking
export const bookAppointment = createAsyncThunk(
  "appointments/bookAppointment",
  async (
    appointmentData: {
      customerName: string;
      customerPhone: string;
      barberId: string;
      serviceId: string;
      startTime: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post("/appointments/book", appointmentData);
      return response.data;
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.response?.statusText ||
        err.message ||
        "Booking failed";
      return rejectWithValue(message);
    }
  }
);

// Reception booking list
export const fetchAppointments = createAsyncThunk(
  "appointments/fetchAppointments",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/receptionist");
      return response.data;
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.response?.statusText ||
        err.message ||
        "Failed to fetch appointments";
      return rejectWithValue(message);
    }
  }
);

// Reception checks a pre-booked customer into the barber queue
export const checkInAppointment = createAsyncThunk(
  "appointments/checkInAppointment",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/receptionist/${id}/checkin`);
      return response.data;
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.response?.statusText ||
        err.message ||
        "Failed to check in appointment";
      return rejectWithValue(message);
    }
  }
);

// Reception sends a walk-in directly to their chosen barber
export const assignWalkIn = createAsyncThunk(
  "appointments/assignWalkIn",
  async (
    walkInData: { customerName: string; barberId: string; serviceId: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post("/receptionist/walkin", walkInData);
      return response.data;
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.response?.statusText ||
        err.message ||
        "Failed to assign walk-in";
      return rejectWithValue(message);
    }
  }
);
