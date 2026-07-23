import { createSlice } from "@reduxjs/toolkit";
import { fetchIncomeReport, fetchCustomerFlow, fetchBillsReport } from "./reportsThunks";

const initialState = {
  income: { daily: [], weekly: [], monthly: [] },
  flow: { barbers: [] },
  bills: [],
  loading: false,
  error: null as string | null,
};

const reportsSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchIncomeReport.pending, (state) => { state.loading = true; })
      .addCase(fetchIncomeReport.fulfilled, (state, action) => {
        state.loading = false;
        state.income = action.payload;
      })
      .addCase(fetchIncomeReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch income report";
      })

      .addCase(fetchCustomerFlow.fulfilled, (state, action) => {
        state.flow = action.payload;
      })

      .addCase(fetchBillsReport.fulfilled, (state, action) => {
        state.bills = action.payload;
      });
  },
});

export default reportsSlice.reducer;
