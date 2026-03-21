// redux/slices/quickTickSlice.js
import {
  createSlice,
  createEntityAdapter,
  createAsyncThunk,
} from "@reduxjs/toolkit";
import apiClient from "@api/api";

const quickTickAdapter = createEntityAdapter();

export const addQuickTickAsync = createAsyncThunk(
  "quickTicks/addQuickTick",
  async (quickTick, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post("/quickticks", quickTick);
      console.log("✅ QuickTick created:", data);
      return data;
    } catch (error) {
      console.error(
        "❌ QuickTick creation failed:",
        error.response?.data || error.message
      );
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const toggleQuickTickComplete = createAsyncThunk(
  "quickTicks/toggleComplete",
  async ({ id, quicktick_complete }, { dispatch, rejectWithValue }) => {
    // Optimistically update the state
    dispatch(
      quickTickSlice.actions.updateQuickTick({
        id,
        changes: { quicktick_complete },
      })
    );

    try {
      const { data } = await apiClient.put(`/quickticks/${id}`, {
        quicktick_complete,
      });
      return data;
    } catch (error) {
      // If the request fails, roll back to previous state
      dispatch(
        quickTickSlice.actions.updateQuickTick({
          id,
          changes: { quicktick_complete: quicktick_complete === 1 ? 0 : 1 },
        })
      );
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateQuickTickAsync = createAsyncThunk(
  "quickTicks/updateQuickTickAsync",
  async ({ id, changes }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.put(`/quickticks/${id}`, changes);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateQuickTicksOrder = createAsyncThunk(
  "quickTicks/updateQuickTicksOrder",
  async (reorderedTicks, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.put("/quickticks/reorder", {
        ticks: reorderedTicks,
      });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteQuickTick = createAsyncThunk(
  "quickTicks/deleteQuickTick",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/quickticks/${id}`);
      return id; // Return the ID directly
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const quickTickSlice = createSlice({
  name: "quickTicks",
  initialState: quickTickAdapter.getInitialState(),
  reducers: {
    setQuickTicks: quickTickAdapter.setAll,
    clearQuickTicks: quickTickAdapter.removeAll,
    updateQuickTick: quickTickAdapter.updateOne,
    updateQuickTickOrderBatch: quickTickAdapter.updateMany,
    deleteQuickTickOptimistically: quickTickAdapter.removeOne,
    addQuickTickOptimistic: quickTickAdapter.addOne,
  },

  extraReducers: (builder) => {
    builder
      .addCase(addQuickTickAsync.fulfilled, (state, action) => {
        quickTickAdapter.addOne(state, action.payload);
      })
      .addCase(toggleQuickTickComplete.fulfilled, (state, action) => {
        quickTickAdapter.updateOne(state, {
          id: action.payload.id,
          changes: { quicktick_complete: action.payload.quicktick_complete },
        });
      })
      .addCase(updateQuickTickAsync.fulfilled, (state, action) => {
        quickTickAdapter.updateOne(state, {
          id: action.payload.id,
          changes: action.payload,
        });
      })
      .addCase(updateQuickTicksOrder.fulfilled, (state, action) => {
        // quickTickAdapter.updateMany(
        //   state,
        //   action.payload.map(({ id, quicktick_order }) => ({
        //     id,
        //     changes: { quicktick_order },
        //   }))
        // );
      })
      .addCase(deleteQuickTick.fulfilled, (state, action) => {
        quickTickAdapter.removeOne(state, action.payload); // payload is the ID
      });
  },
});

export const {
  setQuickTicks,
  clearQuickTicks,
  updateQuickTick,
  updateQuickTickOrderBatch,
  deleteQuickTickOptimistically,
  addQuickTickOptimistic,
} = quickTickSlice.actions;

export const {
  selectAll: selectAllQuickTicks,
  selectById: selectQuickTickById,
  selectEntities: selectQuickTickEntities,
} = quickTickAdapter.getSelectors((state) => state.quickTicks);

export default quickTickSlice.reducer;
