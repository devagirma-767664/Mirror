// src/features/bills/billsSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import { fetchBills, markBillPaid } from "./billsThuks";

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
  loading: boolean;
  error: string | null;
}

const initialState: BillsState = {
  list: [],
  loading: false,
  error: null,
};

const billsSlice = createSlice({
  name: "bills",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Fetch bills after the barber has completed the service
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

    // Mark collection complete
    builder.addCase(markBillPaid.fulfilled, (state, action) => {
      const updated = action.payload;
      const idx = state.list.findIndex((b) => b.id === updated.id);
      if (idx !== -1) state.list[idx] = updated;
    });
  },
});

export default billsSlice.reducer;
