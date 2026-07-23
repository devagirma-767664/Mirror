// src/features/ratings/ratingsSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import { submitRating, fetchBarberRatings, fetchBarberAverageRating } from "./ratingsThunks";

interface Rating {
  id: string;
  barberId: string;
  customerId: string;
  score: number;
  comment?: string;
}

interface RatingsState {
  list: Rating[];
  averages: Record<string, number>;
  loading: boolean;
  error: string | null;
}

const initialState: RatingsState = {
  list: [],
  averages: {},
  loading: false,
  error: null,
};

const ratingsSlice = createSlice({
  name: "ratings",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Submit Rating
    builder.addCase(submitRating.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(submitRating.fulfilled, (state, action) => {
      state.loading = false;
      state.list.push(action.payload);
    });
    builder.addCase(submitRating.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Barber Ratings
    builder.addCase(fetchBarberRatings.fulfilled, (state, action) => {
      const { barberId, ratings } = action.payload;
      state.list = ratings.filter((r: Rating) => r.barberId === barberId);
    });

    // Fetch Barber Average Rating
    builder.addCase(fetchBarberAverageRating.fulfilled, (state, action) => {
      const { barberId, average } = action.payload;
      state.averages[barberId] = average;
    });
  },
});

export default ratingsSlice.reducer;












