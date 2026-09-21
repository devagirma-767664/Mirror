// src/features/bills/billsThunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axios";

// Reception payment queue
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

// Reception records collection method and closes the bill
export const markBillPaid = createAsyncThunk(
  "bills/markPaid",
  async ({ billId, ...payment }: { billId: number; accountId: number; cashReceived?:number; transactionReference?:string; paymentVerified?:boolean }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(`/receptionist/bills/${billId}/pay`, payment);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || "Failed to mark bill as paid");
    }
  }
);
