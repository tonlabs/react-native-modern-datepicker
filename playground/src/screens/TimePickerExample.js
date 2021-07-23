/* eslint-disable no-alert */
import React from 'react';
import DatePicker from 'react-native-modern-datepicker';

const TimePickerExample = () => {
  return (
    <DatePicker
      mode="time"
      minuteInterval={3}
      onTimeChange={time => alert(time)}
      minimumTime={new Date('1972-01-01 12:00')}
      maximumTime={new Date('1972-01-01 15:00')}
    />
  );
};

export default TimePickerExample;
