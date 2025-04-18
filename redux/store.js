// src/store/store.js
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import tabReducer from "./slices/tabSlice";
import boardReducer from "./slices/boardSlice";
import taskReducer from "./slices/taskSlice";
import checkReducer from "./slices/checkSlice";
import quickTickReducer from "./slices/quicktickSlice";
import quickTabReducer from "./slices/quicktabSlice";

const store = configureStore({
  reducer: {
    user: userReducer,
    tabs: tabReducer,
    boards: boardReducer,
    tasks: taskReducer,
    checks: checkReducer,
    quickTicks: quickTickReducer,
    quickTabs: quickTabReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Configuration options can go here
      serializableCheck: false, // Example: disable serializable check
    }),
});

export default store;
