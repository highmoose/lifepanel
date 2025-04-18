import {
  createSlice,
  createEntityAdapter,
  createAsyncThunk,
} from "@reduxjs/toolkit";
import apiClient from "@api/api";

// Create the entity adapter
const tabsAdapter = createEntityAdapter();

// Initial state
const initialState = tabsAdapter.getInitialState({
  loading: false,
  error: null,
});

// creat tab thunk
export const createTab = createAsyncThunk(
  "tabs/createTab",
  async ({ tab_name, uid }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post("/tabs", {
        tab_name,
        uid,
      });

      return data; // Should be full tab list
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteTab = createAsyncThunk(
  "tabs/deleteTab",
  async ({ tabId }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.delete(`/tabs/${tabId}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Slice
const tabSlice = createSlice({
  name: "tabs",
  initialState,
  reducers: {
    setTabs: tabsAdapter.setAll,
    addTab: tabsAdapter.addOne,
    updateTab: tabsAdapter.updateOne,
    removeTab: tabsAdapter.removeOne,
    clearTabs: (state) => {
      tabsAdapter.removeAll(state);
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createTab.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTab.fulfilled, (state, action) => {
        state.loading = false;
        // assuming action.payload is the full tab list:
        tabsAdapter.setAll(state, action.payload);
      })
      .addCase(createTab.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteTab.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTab.fulfilled, (state, action) => {
        state.loading = false;
        // assuming action.payload is the full tab list
        tabsAdapter.setAll(state, action.payload);
      })
      .addCase(deleteTab.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Selectors
export const { selectAll: selectAllTabs, selectById: selectTabById } =
  tabsAdapter.getSelectors((state) => state.tabs);

export const selectTabLoading = (state) => state.tabs.loading;
export const selectTabError = (state) => state.tabs.error;

// Export Actions & Reducer
export const { setTabs, addTab, updateTab, removeTab, clearTabs } =
  tabSlice.actions;

export default tabSlice.reducer;
