// src/features/users/usersSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import { fetchUsers, fetchUserById, addUser, updateUser, deleteUser } from "./usersThunks";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface UsersState {
  list: User[];
  selectedUser: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  list: [],
  selectedUser: null,
  loading: false,
  error: null,
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Fetch Users
    builder.addCase(fetchUsers.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUsers.fulfilled, (state, action) => {
      state.loading = false;
      state.list = action.payload;
    });
    builder.addCase(fetchUsers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch User by ID
    builder.addCase(fetchUserById.fulfilled, (state, action) => {
      state.selectedUser = action.payload;
    });

    // Add User
    builder.addCase(addUser.fulfilled, (state, action) => {
      state.list.push(action.payload); // ✅ add new user to list
    });

    // Update User
    builder.addCase(updateUser.fulfilled, (state, action) => {
      const updatedUser = action.payload;
      state.list = state.list.map((user) =>
        user.id === updatedUser.id ? updatedUser : user
      );
    });

    // Delete User
    builder.addCase(deleteUser.fulfilled, (state, action) => {
      state.list = state.list.filter((user) => user.id !== action.payload);
    });
  },
});

export default usersSlice.reducer;
