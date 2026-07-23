// src/features/services/servicesSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import {
  fetchServices,
  addService,
  updateService,
  deleteService,
} from "./servicesThunks";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // ✅ matches backend schema
}

interface ServicesState {
  list: Service[];
  loading: boolean;
  error: string | null;
}

const initialState: ServicesState = {
  list: [],
  loading: false,
  error: null,
};

const servicesSlice = createSlice({
  name: "services",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Fetch Services
    builder.addCase(fetchServices.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchServices.fulfilled, (state, action) => {
      state.loading = false;
      state.list = action.payload;
    });
    builder.addCase(fetchServices.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Add Service
    builder.addCase(addService.fulfilled, (state, action) => {
      state.list.push(action.payload);
    });

    // Update Service
    builder.addCase(updateService.fulfilled, (state, action) => {
      const updated = action.payload;
      state.list = state.list.map((s) =>
        s.id === updated.id ? updated : s
      );
    });

    // Delete Service
    builder.addCase(deleteService.fulfilled, (state, action) => {
      state.list = state.list.filter((s) => s.id !== action.payload);
    });
  },
});

export default servicesSlice.reducer;
