// src/features/bills/billsThunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axios";

// ✅ Check-in appointment (Receptionist) → backend also generates bill
export const checkInAppointment = createAsyncThunk(
  "appointments/checkIn",
  async (appointmentId: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/receptionist/${appointmentId}/checkin`);
      return response.data; // includes { appointment, bill }
    } catch (err: any) {
      return rejectWithValue(err.response?.data || "Failed to check in appointment");
    }
  }
);

// ✅ Fetch all bills (Receptionist/Admin view)
export const fetchBills = createAsyncThunk(
  "bills/fetchBills",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/receptionist/bills");
      return response.data; // array of bills
    } catch (err: any) {
      return rejectWithValue(err.response?.data || "Failed to fetch bills");
    }
  }
);

// ✅ Fetch income report (Admin)
export const fetchIncomeReport = createAsyncThunk(
  "bills/fetchIncomeReport",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/reports/income");
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || "Failed to fetch income report");
    }
  }
);

// ✅ Mark bill as paid
export const markBillPaid = createAsyncThunk(
  "bills/markPaid",
  async (billId: number, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(`/receptionist/bills/${billId}/pay`);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || "Failed to mark bill as paid");
    }
  }
);
