// src/store/boardSlice.js
import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
} from "@reduxjs/toolkit";
import apiClient from "@api/api";
import { auth } from "@/app/firebase/config";
import { createSelector } from "@reduxjs/toolkit";

// Thunks
export const createBoard = createAsyncThunk(
  "boards/createBoard",
  async ({ uid, board_name, tab_id }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post("/boards", {
        uid,
        board_name,
        tab_id,
      });

      return data; // Should be full board list for that tab
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteBoard = createAsyncThunk(
  "boards/deleteBoard",
  async ({ board_id }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.delete(`/boards/${board_id}`);
      return data; // Should be updated full list of boards for the tab
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateBoardName = createAsyncThunk(
  "boards/updateBoardName",
  async ({ board_id, board_name }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.put(`/boards/${board_id}`, {
        board_name,
      });
      return data; // Should be updated full list of boards for the tab
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const moveBoardToTab = createAsyncThunk(
  "boards/moveBoardToTab",
  async ({ board_id, tab_id }, { rejectWithValue }) => {
    try {
      console.log("moveBoardToTab", board_id, tab_id);
      const { data } = await apiClient.put(`/boards/${board_id}/move`, {
        tab_id,
      });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const saveReorderedBoards = createAsyncThunk(
  "boards/saveReorderedBoards",
  async (reorderedBoards, { rejectWithValue }) => {
    try {
      await apiClient.put("/boards/reorder", {
        boards: reorderedBoards,
      });
      return reorderedBoards;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Adapter
const boardsAdapter = createEntityAdapter({
  sortComparer: (a, b) => a.board_order - b.board_order,
});
const initialState = boardsAdapter.getInitialState({
  loading: false,
  error: null,
});

// Slice
const boardSlice = createSlice({
  name: "boards",
  initialState,
  reducers: {
    setBoards: boardsAdapter.setAll,
    addBoard: boardsAdapter.addOne,
    updateBoard: boardsAdapter.updateOne,
    removeBoard: boardsAdapter.removeOne,
    clearBoards: (state) => {
      boardsAdapter.removeAll(state);
      state.loading = false;
      state.error = null;
    },
    reorderBoards: (state, action) => {
      const newOrder = action.payload;
      const reorderedIds = new Set(newOrder.map((b) => b.id));
      const untouchedIds = state.ids.filter((id) => !reorderedIds.has(id));

      newOrder.forEach((board) => {
        state.entities[board.id] = board;
      });

      state.ids = [...untouchedIds, ...newOrder.map((b) => b.id)];
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(createBoard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBoard.fulfilled, (state, action) => {
        state.loading = false;
        boardsAdapter.addOne(state, action.payload);
      })
      .addCase(createBoard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteBoard.fulfilled, (state, action) => {
        state.loading = false;
        boardsAdapter.removeOne(state, action.payload.board_id);
      })
      .addCase(deleteBoard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(saveReorderedBoards.fulfilled, (state, action) => {
        action.payload.forEach((board) => {
          if (state.entities[board.id]) {
            state.entities[board.id].board_order = board.board_order;
          }
        });
      })
      .addCase(updateBoardName.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBoardName.fulfilled, (state, action) => {
        state.loading = false;
        boardsAdapter.upsertOne(state, action.payload);
      })
      .addCase(updateBoardName.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      })
      .addCase(moveBoardToTab.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(moveBoardToTab.fulfilled, (state, action) => {
        state.loading = false;
        boardsAdapter.upsertOne(state, action.payload);
      })
      .addCase(moveBoardToTab.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

// Selectors
export const { selectAll: selectBoards, selectById: selectBoardById } =
  boardsAdapter.getSelectors((state) => state.boards);

export const selectBoardsByTabId = (tabId) =>
  createSelector([selectBoards], (boards) =>
    boards.filter((board) => board.tab_id === tabId)
  );

export const selectBoardLoading = (state) => state.boards.loading;
export const selectBoardError = (state) => state.boards.error;

// Actions & Reducer
export const {
  setBoards,
  addBoard,
  updateBoard,
  removeBoard,
  clearBoards,
  reorderBoards,
} = boardSlice.actions;

export default boardSlice.reducer;
