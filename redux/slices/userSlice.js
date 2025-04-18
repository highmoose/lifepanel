import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "@api/api";
import { auth } from "../../src/app/firebase/config";

// import actions to hydrate other slices
import { setTabs } from "./tabSlice";
import { setBoards } from "./boardSlice";
import { setTasks } from "./taskSlice";
import { setChecks } from "./checkSlice";
import { setQuickTabs } from "./quicktabSlice";
import { setQuickTicks } from "./quicktickSlice";

export const fetchUserByUid = createAsyncThunk(
  "user/fetchByUid",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      const { data } = await apiClient.get("/user/by-uid", {
        params: { firebase_uid: user.uid },
      });

      dispatch(setTabs(data.tabs));
      dispatch(setBoards(data.boards));

      const orderedTasks = data.tasks
        ?.slice()
        .sort((a, b) => a.task_order - b.task_order);
      dispatch(setTasks(orderedTasks));

      dispatch(setChecks(data.checks));
      dispatch(setQuickTicks(data.quickTicks));
      dispatch(setQuickTabs(data.quickTabs));

      return data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState: {
    data: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearUserData: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserByUid.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserByUid.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload; // only the user object
      })
      .addCase(fetchUserByUid.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Selectors
export const selectUserData = (state) => state.user.data;
export const selectUserLoading = (state) => state.user.loading;
export const selectUserError = (state) => state.user.error;

// Actions
export const { clearUserData } = userSlice.actions;

// Reducer
export default userSlice.reducer;
