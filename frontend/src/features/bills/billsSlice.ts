// src/features/bills/billsSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import { checkInAppointment, fetchBills, fetchIncomeReport, markBillPaid } from "./billsThuks";

interface Bill {
  id: string;
  appointment_id: string;
  customer_name: string;
  service_name: string;
  barber_name: string;
  total: number;
  paid: boolean;
  generated_at: string;
  paid_at?: string;
  payment_method?: string;
}

interface BillsState {
  list: Bill[];
  incomeReport: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: BillsState = {
  list: [],
  incomeReport: null,
  loading: false,
  error: null,
};

const billsSlice = createSlice({
  name: "bills",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // ✅ Check-in (auto generates bill)
    builder.addCase(checkInAppointment.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(checkInAppointment.fulfilled, (state, action) => {
      state.loading = false;
      // backend returns { appointment, bill }
      if (action.payload.bill) {
        state.list.push(action.payload.bill);
      }
    });
    builder.addCase(checkInAppointment.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ✅ Fetch Bills
    builder.addCase(fetchBills.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchBills.fulfilled, (state, action) => {
      state.loading = false;
      state.list = action.payload;
    });
    builder.addCase(fetchBills.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ✅ Fetch Income Report
    builder.addCase(fetchIncomeReport.fulfilled, (state, action) => {
      state.incomeReport = action.payload;
    });

    // ✅ Mark Bill Paid
    builder.addCase(markBillPaid.fulfilled, (state, action) => {
      const updated = action.payload;
      const idx = state.list.findIndex((b) => b.id === updated.id);
      if (idx !== -1) state.list[idx] = updated;
    });
  },
});

export default billsSlice.reducer;
