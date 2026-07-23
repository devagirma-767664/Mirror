import { createSlice } from "@reduxjs/toolkit";
import {
  bookAppointment,
  fetchAppointments,
  fetchBarberAppointments,
  checkInAppointment,
  assignWalkIn,
  generateBill,
  startSession,
  closeSession,
} from "./appointmentsThunks";

interface Appointment {
  id: string;
  customer_name: string;
  customer_phone: string;
  barber_id: string;
  service_id: string;
  service_name?: string;
  start_time: string;
  status: string;
  end_time?: string;
  actual_duration?: number;
}

interface AppointmentsState {
  list: Appointment[];
  loading: boolean;
  error: string | null;
}

const initialState: AppointmentsState = {
  list: [],
  loading: false,
  error: null,
};

const appointmentsSlice = createSlice({
  name: "appointments",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Book Appointment
    builder.addCase(bookAppointment.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(bookAppointment.fulfilled, (state, action) => {
      state.loading = false;
      state.list.push(action.payload);
    });
    builder.addCase(bookAppointment.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch All Appointments
    builder.addCase(fetchAppointments.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAppointments.fulfilled, (state, action) => {
      state.loading = false;
      state.list = action.payload;
    });
    builder.addCase(fetchAppointments.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Barber Appointments
    builder.addCase(fetchBarberAppointments.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchBarberAppointments.fulfilled, (state, action) => {
      state.loading = false;
      state.list = action.payload;
    });

    builder.addCase(fetchBarberAppointments.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ✅ Check-In Appointment
    builder.addCase(checkInAppointment.fulfilled, (state, action) => {
      const updated = action.payload;
      const idx = state.list.findIndex((a) => a.id === updated.id);
      if (idx !== -1) state.list[idx] = updated;
    });

    // ✅ Assign Walk-In
    builder.addCase(assignWalkIn.fulfilled, (state, action) => {
      state.list.push(action.payload);
    });

    // ✅ Generate Bill
    builder.addCase(generateBill.fulfilled, (state, action) => {
      const updated = action.payload;
      const idx = state.list.findIndex((a) => a.id === updated.id);
      if (idx !== -1) state.list[idx] = updated;
    });

    // ✅ Start Session
    builder.addCase(startSession.fulfilled, (state, action) => {
      const updated = action.payload;
      const idx = state.list.findIndex((a) => a.id === updated.id);
      if (idx !== -1) state.list[idx] = updated;
    });

    // ✅ Close Session → remove from list
    // ✅ Close Session → remove from list
    builder.addCase(closeSession.fulfilled, (state, action) => {
      const updated = action.payload; // backend likely returns the full appointment
      const closedId = updated.id;    // extract the id
      state.list = state.list.filter((appt) => appt.id !== closedId);
    });


  },
});

export default appointmentsSlice.reducer;
