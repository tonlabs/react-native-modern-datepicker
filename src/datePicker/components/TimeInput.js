import React from 'react';
import {useCalendar} from '../calendarContext';

export const TimeInput = () => {
  const {utils, minTime, maxTime, onTimeChange} = useCalendar();

  const [time, setTime] = React.useState('');

  const onChangeHandler = React.useCallback(
    val => {
      if (val) {
        const today = new Date();
        const newTimeArray = val.split(':');
        const hour = Number(newTimeArray[0]);
        const minute = Number(newTimeArray[1]);
        const newTime = new Date(today.setHours(hour, minute, 0));
        setTime(val);
        const isValidated = utils.validateTimeMinMax(newTime, minTime, maxTime);
        isValidated ? onTimeChange({hour, minute}) : onTimeChange();
      }
    },
    [utils, minTime, maxTime, onTimeChange],
  );

  const inputStyle = {
    marginBottom: 40,
    textAlign: 'center',
    fontSize: 35,
    width: 160,
    alignSelf: 'center',
    border: 'none', // remove useless border in web input
  };

  const inputOptions = {
    style: inputStyle,
    name: 'time',
    type: 'time',
    value: time, // current time or empty on mount
    autoFocus: true,
    onChange: e => onChangeHandler(e.target.value), // its can return value only on end input, '' or '00:00'
  };

  // We are have to use React element input here because of broken timepicker flatlist in web.
  // Also web input have useful props like type: 'time' that use mask 00:00, dropdown lists for hours and minutes.
  // So it was useful element for faster develop of TimePicker ???
  return React.createElement('input', inputOptions);
};
