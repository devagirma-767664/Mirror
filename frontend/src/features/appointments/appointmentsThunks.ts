import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axios";

// ✅ Book a new appointment (customer/receptionist)
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

// ✅ Fetch all appointments (Receptionist/Admin)
export const fetchAppointments = createAsyncThunk(
  "appointments/fetchAppointments",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/appointments");
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

// ✅ Fetch barber appointments (logged-in barber only)
export const fetchBarberAppointments = createAsyncThunk(
  "appointments/fetchBarberAppointments",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/appointments"); // ✅ no barberId
      return response.data;
    } catch (err: any) {
      console.error("Fetch barber appointments error:", err.response?.status, err.response?.data);
      return rejectWithValue(
        err.response?.data?.error ||
        err.response?.statusText ||
        err.message ||
        "Failed to fetch barber appointments"
      );
    }
  }
);



// ✅ Receptionist: Check In Appointment
export const checkInAppointment = createAsyncThunk(
  "appointments/checkInAppointment",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/appointments/${id}/checkin`);
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

// ✅ Receptionist: Assign Walk-In
export const assignWalkIn = createAsyncThunk(
  "appointments/assignWalkIn",
  async (
    walkInData: { customerName: string; barberId: string; serviceId: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post("/appointments/walkin", walkInData);
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

// ✅ Receptionist: Generate Bill
export const generateBill = createAsyncThunk(
  "appointments/generateBill",
  async (
    { id, total }: { id: string; total: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post(`/appointments/${id}/bill`, { total });
      return response.data;
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.response?.statusText ||
        err.message ||
        "Failed to generate bill";
      return rejectWithValue(message);
    }
  }
);

// ✅ Barber: Start Session
export const startSession = createAsyncThunk(
  "appointments/startSession",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/appointments/${id}/start`);
      return response.data;
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.response?.statusText ||
        err.message ||
        "Failed to start session";
      return rejectWithValue(message);
    }
  }
);

// ✅ Barber: Close Session
export const closeSession = createAsyncThunk(
  "appointments/closeSession",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/appointments/${id}/close`);
      return response.data;
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.response?.statusText ||
        err.message ||
        "Failed to close session";
      return rejectWithValue(message);
    }
  }
);
