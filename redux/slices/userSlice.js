import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "@api/api";

// import actions to hydrate other slices
import { setTabs } from "./tabSlice";
import { setBoards } from "./boardSlice";
import { setTasks } from "./taskSlice";
import { setChecks } from "./checkSlice";
import { setQuickTabs } from "./quicktabSlice";
import { setQuickTicks } from "./quicktickSlice";

// Fetch current authenticated user and hydrate all slices
export const fetchCurrentUser = createAsyncThunk(
  "user/fetchCurrentUser",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await apiClient.get("/user/me");

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

// Login — stores token in localStorage
export const loginUser = createAsyncThunk(
  "user/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post("/auth/login", { email, password });
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", data.token);
      }
      return data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.errors?.email?.[0] ||
        error.response?.data?.message ||
        "Invalid credentials"
      );
    }
  }
);

// Register — creates account and stores token
export const registerUser = createAsyncThunk(
  "user/register",
  async ({ email, password, password_confirmation, display_name }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post("/auth/register", {
        email,
        password,
        password_confirmation,
        display_name,
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", data.token);
      }
      return data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Registration failed"
      );
    }
  }
);

// Logout — revokes token on backend and clears localStorage
export const logoutUser = createAsyncThunk(
  "user/logout",
  async (_, { rejectWithValue }) => {
    try {
      await apiClient.post("/auth/logout");
    } catch (_) {
      // Even if API call fails, still clear local token
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
      }
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
      // fetchCurrentUser
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // loginUser
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // registerUser
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // logoutUser
      .addCase(logoutUser.fulfilled, (state) => {
        state.data = null;
        state.loading = false;
        state.error = null;
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
