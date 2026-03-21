// src/store/taskSlice.js
import {
  createSlice,
  createEntityAdapter,
  createSelector,
  createAsyncThunk,
} from "@reduxjs/toolkit";
import apiClient from "@api/api";

// Adapter for tasks
const tasksAdapter = createEntityAdapter({});

const initialState = tasksAdapter.getInitialState({
  loading: false,
  error: null,
});

// CREATE TASK
export const createTask = createAsyncThunk(
  "tasks/createTask",
  async (taskData, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post("/tasks", taskData); // Laravel returns all tasks for the board
      return {
        board_id: taskData.board_id,
        tasks: data,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// DELETE TASK
export const deleteTask = createAsyncThunk(
  "tasks/deleteTask",
  async (taskId, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.delete(`/tasks/${taskId}`);
      return { board_id: data.board_id, tasks: data.tasks };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateTask = createAsyncThunk(
  "tasks/updateTask",
  async ({ id, changes }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.put(`/tasks/${id}`, changes);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const saveReorderedTasks = createAsyncThunk(
  "tasks/saveReorderedTasks",
  async (reorderedTasks, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.put("/tasks/reorder", {
        tasks: reorderedTasks,
      });

      return reorderedTasks;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const taskSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    setTasks: tasksAdapter.setAll,
    addTask: tasksAdapter.addOne,
    removeTask: tasksAdapter.removeOne,
    clearTasks: (state) => {
      tasksAdapter.removeAll(state);
      state.loading = false;
      state.error = null;
    },
    reorderTasks: (state, action) => {
      const newOrder = action.payload;
      const reorderedIds = new Set(newOrder.map((task) => task.id));
      const untouchedIds = state.ids.filter((id) => !reorderedIds.has(id));

      newOrder.forEach((task) => {
        state.entities[task.id] = task;
      });

      state.ids = [...untouchedIds, ...newOrder.map((task) => task.id)];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.loading = false;
        const { board_id, tasks } = action.payload;

        const idsToRemove = state.ids.filter(
          (id) => state.entities[id]?.board_id === board_id
        );
        tasksAdapter.removeMany(state, idsToRemove);

        tasksAdapter.upsertMany(state, tasks);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.loading = false;
        const { board_id, tasks } = action.payload;

        if (!board_id) return;

        const idsToRemove = state.ids.filter(
          (id) => state.entities[id]?.board_id === board_id
        );
        tasksAdapter.removeMany(state, idsToRemove);

        tasksAdapter.upsertMany(state, tasks);
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const task = action.payload;
        tasksAdapter.updateOne(state, {
          id: task.id,
          changes: task,
        });
      })
      .addCase(saveReorderedTasks.fulfilled, (state, action) => {
        // Only update the task entities (not the order in state.ids)
        action.payload.forEach((task) => {
          tasksAdapter.updateOne(state, {
            id: task.id,
            changes: { task_order: task.task_order },
          });
        });
      })
      .addCase(saveReorderedTasks.rejected, (state, action) => {
        state.error = action.payload || "Failed to save task order";
      });
  },
});

// Selectors
export const { selectAll: selectAllTasks, selectById: selectTaskById } =
  tasksAdapter.getSelectors((state) => state.tasks);

export const selectTasksByBoardId = (boardId) =>
  createSelector(
    (state) => state.tasks,
    (tasksState) =>
      tasksState.ids
        .map((id) => tasksState.entities[id])
        .filter((task) => task.board_id === boardId)
  );

// Export actions
export const { setTasks, addTask, removeTask, clearTasks, reorderTasks } =
  taskSlice.actions;

// Export reducer
export default taskSlice.reducer;
