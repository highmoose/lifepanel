// redux/slices/quickTickSlice.js
import {
  createSlice,
  createEntityAdapter,
  createAsyncThunk,
} from "@reduxjs/toolkit";
import apiClient from "@api/api";

const quickTabAdapter = createEntityAdapter();

export const renameQuickTabAsync = createAsyncThunk(
  "quickTabs/renameQuickTab",
  async ({ id, name }, thunkAPI) => {
    // console log the id and name
    console.log("🧠 renameQuickTabAsync firing", id, name);
    try {
      // You can change this to match your actual endpoint
      const response = await apiClient.put(`/quicktabs/${id}`, { name });
      return { id, name };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteQuickTabAsync = createAsyncThunk(
  "quickTabs/deleteQuickTab",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/quicktabs/${id}`);
      return id; // Return the ID directly
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const addQuickTabAsync = createAsyncThunk(
  "quickTabs/addQuickTab",
  async ({ name, userId, quicktab_order }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post("/quicktabs", {
        quicktab_name: name,
        user_id: userId,
        quicktab_order, // 👈 make sure backend saves this
      });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateQuickTabsOrderAsync = createAsyncThunk(
  "quickTabs/updateOrder",
  async (orderedTabs, { rejectWithValue }) => {
    try {
      // expected payload: [{ id, quicktab_order }]
      await apiClient.put("/quicktabs/reorder", { quicktabs: orderedTabs });
      return orderedTabs;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const toggleQuickTabOpen = createAsyncThunk(
  "quickTabs/toggleQuickTabOpen",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.put(`/quicktabs/${id}/toggle`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateQuickTabColour = createAsyncThunk(
  "quickTabs/updateTabColour",
  async ({ id, colour }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.put(`/quicktabs/${id}/colour`, {
        quicktab_colour: colour, // ✅ send correct key to backend
      });
      return data; // should contain `id` and `quicktab_colour`
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const quickTabSlice = createSlice({
  name: "quickTabs",
  initialState: quickTabAdapter.getInitialState(),
  reducers: {
    setQuickTabs: quickTabAdapter.setAll,
    clearQuickTabs: quickTabAdapter.removeAll,
    deleteQuickTabOptimistic: quickTabAdapter.removeOne,
    renameQuickTabOptimistic: quickTabAdapter.updateOne,
    addQuickTabOptimistic: quickTabAdapter.addOne,
    updateQuickTabOrderBatch: quickTabAdapter.updateMany,
    toggleQuickTabOpenOptimistic: (state, action) => {
      const id = action.payload;
      const tab = state.entities[id];
      if (tab) {
        tab.quicktab_open = tab.quicktab_open ? 0 : 1;
      }
    },
    updateQuickTabColourOptimistic: (state, action) => {
      const { id, colour } = action.payload;
      const tab = state.entities[id];
      if (tab) {
        tab.colour = colour;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(renameQuickTabAsync.pending, (state, action) => {
        const { id } = action.meta.arg;
        if (state.entities[id]) {
          state.entities[id].isRenaming = true;
          state.entities[id].renameError = null;
        }
      })
      .addCase(renameQuickTabAsync.fulfilled, (state, action) => {
        const { id, name } = action.payload;
        if (state.entities[id]) {
          state.entities[id].quicktab_name = name;
          state.entities[id].isRenaming = false;
          state.entities[id].renameError = null;
        }
      })
      .addCase(renameQuickTabAsync.rejected, (state, action) => {
        const { id } = action.meta.arg;
        if (state.entities[id]) {
          state.entities[id].isRenaming = false;
          state.entities[id].renameError = action.payload || "Rename failed";
        }
        console.error("Rename failed:", action.payload);
      })
      .addCase(deleteQuickTabAsync.fulfilled, (state, action) => {
        quickTabAdapter.removeOne(state, action.payload);
      })
      // .addCase(addQuickTabAsync.fulfilled, (state, action) => {
      //   quickTabAdapter.addOne(state, action.payload);
      // });
      .addCase(toggleQuickTabOpen.fulfilled, (state, action) => {
        const { id, quicktab_open } = action.payload;
        const existing = state.entities[id];
        if (existing) {
          existing.quicktab_open = quicktab_open;
        }
      })
      .addCase(updateQuickTabColour.fulfilled, (state, action) => {
        const { id, quicktab_colour } = action.payload;
        const tab = state.entities[id];
        if (tab) {
          tab.quicktab_colour = quicktab_colour;
        }
      });
  },
});

export const {
  setQuickTabs,
  clearQuickTabs,
  deleteQuickTabOptimistic,
  renameQuickTabOptimistic,
  addQuickTabOptimistic,
  updateQuickTabOrderBatch,
  toggleQuickTabOpenOptimistic,
  updateQuickTabColourOptimistic,
} = quickTabSlice.actions;

export const {
  selectAll: selectAllQuickTabs,
  selectById: selectQuickTabById,
  selectEntities: selectQuickTabEntities,
} = quickTabAdapter.getSelectors((state) => state.quickTabs);

export default quickTabSlice.reducer;
