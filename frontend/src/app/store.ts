// src/app/store.ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import usersReducer from "../features/users/usersSlice";
import appointmentsReducer from "../features/appointments/appointmentsSlice";
import barbersReducer from "../features/barbers/barbersSlice";
import servicesReducer from "../features/services/servicesSlice";
import ratingsReducer from "../features/ratings/ratingsSlice";
import billsReducer from "../features/bills/billsSlice";
import reportsReducer from "../features/reports/reportSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    appointments: appointmentsReducer,
    barbers: barbersReducer,
    services: servicesReducer,
    ratings: ratingsReducer,
    bills: billsReducer,
    reports: reportsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Types for TS
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
