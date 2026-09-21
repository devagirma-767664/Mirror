import { createSlice } from "@reduxjs/toolkit";
import {
  bookAppointment,
  fetchAppointments,
  checkInAppointment,
  assignWalkIn,
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

    // Check a booking into the assigned barber's queue
    builder.addCase(checkInAppointment.fulfilled, (state, action) => {
      const updated = action.payload.appointment || action.payload;
      const idx = state.list.findIndex((a) => a.id === updated.id);
      if (idx !== -1) state.list[idx] = updated;
    });

    // Assign a walk-in to a barber
    builder.addCase(assignWalkIn.fulfilled, (state, action) => {
      const createdAppointment = action.payload.appointment || action.payload;
      state.list.push(createdAppointment);
    });


  },
});

export default appointmentsSlice.reducer;
