import {createContext, useContext} from 'react';

export const CalendarContext = createContext();

export const useCalendar = () => {
  return useContext(CalendarContext);
};
