import { configureStore } from "@reduxjs/toolkit";

import calendarReducer from "../components/calendar/calendarSlice";
import modalReducer from "../components/modal/modalSlice";
import reminderReducer from "../components/reminderForm/reminderFormSlice";

export const store = configureStore({
  reducer: {
    calendar: calendarReducer,
    reminder: reminderReducer,
    modal: modalReducer,
  },
});
