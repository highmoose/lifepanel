import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
} from "@reduxjs/toolkit";
import apiClient from "@api/api";

const checksAdapter = createEntityAdapter();

const initialState = checksAdapter.getInitialState({
  status: "idle",
  error: null,
});

// Thunks for create, update, delete
export const createCheck = createAsyncThunk(
  "checks/createCheck",
  async (check) => {
    const { data } = await apiClient.post("/checks", check);
    return data;
  }
);

export const updateCheck = createAsyncThunk(
  "checks/updateCheck",
  async (check) => {
    const { data } = await apiClient.put(`/checks/${check.id}`, check);
    return data;
  }
);

export const toggleCheck = createAsyncThunk(
  "checks/toggleCheck",
  async (check) => {
    const { data } = await apiClient.put(`/checks/${check.id}`, check);
    return data;
  }
);

export const deleteCheck = createAsyncThunk(
  "checks/deleteCheck",
  async (id) => {
    await apiClient.delete(`/checks/${id}`);
    return id;
  }
);

let lastHash = "";

export const saveReorderedChecks = createAsyncThunk(
  "checks/saveReorderedChecks",
  async (checks, { rejectWithValue }) => {
    const hash = JSON.stringify(checks.map((c) => [c.id, c.check_order]));
    if (hash === lastHash) {
      console.log("⚠️ Duplicate check order detected — skipping");
      return;
    }

    lastHash = hash;

    console.log(
      "✅ Saving reordered checks",
      checks.map((c) => c.id)
    );

    try {
      await apiClient.put("/checks/reorder", { checks });
      return checks;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const resetChecks = createAsyncThunk(
  "checks/resetChecks",
  async ({ taskId }, { rejectWithValue }) => {
    console.log("resetChecks asyncThunk", taskId);
    try {
      const { data } = await apiClient.put("/checks/reset", {
        task_id: taskId,
      });
      console.log("✅ Checks reset:", data);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Slice
const checkSlice = createSlice({
  name: "checks",
  initialState,
  reducers: {
    setChecks: (state, action) => {
      checksAdapter.setAll(state, action.payload);
    },
    clearChecks: (state) => {
      checksAdapter.removeAll(state);
    },
    reorderChecks: (state, action) => {
      const reordered = action.payload;

      reordered.forEach((check) => {
        if (state.entities[check.id]) {
          state.entities[check.id].check_order = check.check_order;
        }
      });
    },
    updateCheckOptimistically: (state, action) => {
      checksAdapter.upsertOne(state, action.payload);
    },
    deleteCheckOptimistically: (state, action) => {
      checksAdapter.removeOne(state, action.payload);
    },
    resetChecksOptimistically: (state, action) => {
      action.payload.forEach((check) => {
        if (state.entities[check.id]) {
          state.entities[check.id].check_complete = check.check_complete;
        }
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCheck.fulfilled, (state, action) => {
        checksAdapter.addOne(state, action.payload);
      })
      .addCase(updateCheck.fulfilled, (state, action) => {
        checksAdapter.upsertOne(state, action.payload);
      })
      // .addCase(toggleCheck.fulfilled, (state, action) => {
      //   checksAdapter.upsertOne(state, action.payload);
      // })
      .addCase(deleteCheck.fulfilled, (state, action) => {
        checksAdapter.removeOne(state, action.payload);
      })
      // .addCase(saveReorderedChecks.fulfilled, (state, action) => {
      //   checksAdapter.upsertMany(state, action.payload);
      // });
      .addCase(resetChecks.fulfilled, (state, action) => {
        const taskId = action.payload.task_id;

        const checksForTask = Object.values(state.entities).filter(
          (check) => check.task_id === taskId
        );

        checksForTask.forEach((check) => {
          check.check_complete = 0;
        });
      })
      .addCase(resetChecks.rejected, (state, action) => {
        state.error = action.payload || "Failed to reset checks";
      });
  },
});

// Selectors
export const {
  selectAll: selectAllChecks,
  selectById: selectCheckById,
  selectEntities: selectCheckEntities,
  selectIds: selectCheckIds,
} = checksAdapter.getSelectors((state) => state.checks);

export const selectChecksByTaskId = (taskId) =>
  createSelector([selectAllChecks], (checks) =>
    checks
      .filter((check) => check.task_id === taskId)
      .sort((a, b) => a.check_order - b.check_order)
  );

export const selectChecksGroupedByTask = createSelector(
  [selectAllChecks],
  (checks) => {
    const grouped = checks.reduce((acc, check) => {
      if (!acc[check.task_id]) acc[check.task_id] = [];
      acc[check.task_id].push(check);
      return acc;
    }, {});

    // IMPORTANT: Sort each group by check_order
    Object.keys(grouped).forEach((taskId) => {
      grouped[taskId].sort((a, b) => a.check_order - b.check_order);
    });

    return grouped;
  }
);

// Actions
export const {
  setChecks,
  clearChecks,
  updateCheckOptimistically,
  reorderChecks,
  deleteCheckOptimistically,
  resetChecksOptimistically,
} = checkSlice.actions;

// Reducer
export default checkSlice.reducer;
