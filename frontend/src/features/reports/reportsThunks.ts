import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axios";

// Income report (daily/weekly/monthly)
export const fetchIncomeReport = createAsyncThunk(
  "reports/fetchIncomeReport",
  async () => {
    const res = await axiosInstance.get("/admin/reports/income");
    return res.data; // { daily, weekly, monthly }
  }
);

// Barber performance (customer flow)
export const fetchCustomerFlow = createAsyncThunk(
  "reports/fetchCustomerFlow",
  async () => {
    const res = await axiosInstance.get("/admin/reports/customer-flow");
    return res.data; // { barbers: [...] }
  }
);

// Bills report
export const fetchBillsReport = createAsyncThunk(
  "reports/fetchBillsReport",
  async () => {
    const res = await axiosInstance.get("/admin/reports/bills");
    return res.data;
  }
);
