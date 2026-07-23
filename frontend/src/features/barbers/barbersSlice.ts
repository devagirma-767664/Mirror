import { createSlice } from "@reduxjs/toolkit";
import {
  fetchBarbers,
  fetchBarberAvailability,
  fetchBarberAppointments,
  startSession,
  closeSession,
  requestDayOff,
  fetchBarberRatings,
} from "./barbersThunks";

interface Appointment {
  id: string;
  customerName: string;
  serviceId: string;
  startTime: string;
  status: string;
  barberId?: string;
}

interface DayOffRequest {
  id: string;
  date: string;
  reason: string;
  status: string;
}

interface Rating {
  id: string;
  customerId: string;
  barberId: string;
  score: number;
  comment: string;
}

interface Barber {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  image: string;
  availability?: string[];
  dayOffRequests?: DayOffRequest[];
  ratings?: Rating[];
}

interface BarbersState {
  list: Barber[];
  appointments: Appointment[]; // ✅ separate slice field
  loading: boolean;
  error: string | null;
}

const initialState: BarbersState = {
  list: [],
  appointments: [],
  loading: false,
  error: null,
};

const barbersSlice = createSlice({
  name: "barbers",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Fetch Barbers
    builder.addCase(fetchBarbers.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchBarbers.fulfilled, (state, action) => {
      state.loading = false;
      state.list = action.payload;
    });
    builder.addCase(fetchBarbers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Barber Availability
    builder.addCase(fetchBarberAvailability.fulfilled, (state, action) => {
      const { barberId, availability } = action.payload;
      const barber = state.list.find((b) => b.id === barberId);
      if (barber) {
        barber.availability = availability;
      }
    });

    // Fetch Barber Appointments (for logged-in barber)
    builder.addCase(fetchBarberAppointments.fulfilled, (state, action) => {
      state.appointments = action.payload; // ✅ store directly
    });

    // Start Session
    builder.addCase(startSession.fulfilled, (state, action) => {
      const updatedAppointment = action.payload;
      const appt = state.appointments.find((a) => a.id === updatedAppointment.id);
      if (appt) appt.status = updatedAppointment.status;
    });

    // Close Session
    builder.addCase(closeSession.fulfilled, (state, action) => {
      const closedAppointment = action.payload;
      state.appointments = state.appointments.filter(
        (a) => a.id !== closedAppointment.id
      );
    });

    // Request Day Off
    builder.addCase(requestDayOff.fulfilled, (state, action) => {
      const { barberId } = action.payload;
      const barber = state.list.find((b) => b.id === barberId);
      if (barber) {
        barber.dayOffRequests = barber.dayOffRequests || [];
        barber.dayOffRequests.push(action.payload);
      }
    });

    // Fetch Barber Ratings
    builder.addCase(fetchBarberRatings.fulfilled, (state, action) => {
      const { barberId, ratings } = action.payload;
      const barber = state.list.find((b) => b.id === barberId);
      if (barber) {
        barber.ratings = ratings;
      }
    });
  },
});

export default barbersSlice.reducer;
