import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Animated,
  Easing,
  TouchableOpacity,
  I18nManager,
  Platform,
} from 'react-native';
import { FlatList } from "react-native-gesture-handler";
import {useCalendar} from '../calendarContext';
import {TimeInput} from './TimeInput';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const TimeScroller = ({title, data, onChange, current}) => {
  const {options, utils} = useCalendar();
  const [itemSize, setItemSize] = useState(0);
  const [nativeEventWidth, setNativeEventWidth] = useState(0)
  const style = styles(options);
  const scrollAnimatedValue = useRef(new Animated.Value(0)).current;
  const scrollListener = useRef(null);
  const active = useRef(0);
  const flatListRef = useRef();

  data = ['', '', ...data, '', ''];

  useEffect(() => {
    onChange(current && data.length > 5 ? data[getIndexOfCurrentItem()] : data[2]);
  }, []);

  useEffect(()=>{
    setTimeout(()=>{
        getOffsetOfCurrent()
    }, 200)
  },[nativeEventWidth])

  useEffect(() => {
    scrollListener.current && clearInterval(scrollListener.current);
    scrollListener.current = scrollAnimatedValue.addListener(({value}) => (active.current = value));

    return () => {
      clearInterval(scrollListener.current);
    };
  }, [scrollAnimatedValue]);

  const getIndexOfCurrentItem = () => {
    const closest = data.reduce(function(prevVal, currVal) {
      return (Math.abs(currVal - current) < Math.abs(prevVal - current) ? currVal : prevVal);
    });
    const currentIndex = (i) => data.findIndex((i) => i == closest)
    return currentIndex() > 0 ? currentIndex() : 2
  }

  const getOffsetOfCurrent = useCallback(() =>{
    if(nativeEventWidth > 0){
      const offset = Math.round((getIndexOfCurrentItem() - 2) * (nativeEventWidth / 5));
      flatListRef.current.scrollToOffset({animated: true, offset: offset});
    }
  }, [nativeEventWidth]);

  const changeItemWidth = ({nativeEvent}) => {
    const {width} = nativeEvent.layout;
    setNativeEventWidth(width)
    !itemSize && setItemSize(width / 5);
  };

  const renderItem = ({item, index}) => {
    const makeAnimated = (a, b, c) => {
      return {
        inputRange: [...data.map((_, i) => i * itemSize)],
        outputRange: [
          ...data.map((_, i) => {
            const center = i + 2;
            if (center === index) {
              return a;
            } else if (center + 1 === index || center - 1 === index) {
              return b;
            } else {
              return c;
            }
          }),
        ],
      };
    };

    return (
      <Animated.View
        style={[
          {
            width: itemSize,
            opacity: scrollAnimatedValue.interpolate(makeAnimated(1, 0.6, 0.3)),
            transform: [
              {
                scale: scrollAnimatedValue.interpolate(makeAnimated(1.2, 0.9, 0.8)),
              },
              {
                scaleX: I18nManager.isRTL ? -1 : 1,
              },
            ],
          },
          style.listItem,
        ]}>
        <Text style={style.listItemText}>
          {utils.toPersianNumber(String(item).length === 1 ? '0' + item : item)}
        </Text>
      </Animated.View>
    );
  };

  return (
    <View style={style.row} onLayout={changeItemWidth}>
      <Text style={style.title}>{title}</Text>
      <AnimatedFlatList
        ref={flatListRef}
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        horizontal
        snapToInterval={itemSize}
        decelerationRate={'fast'}
        onScroll={Animated.event([{nativeEvent: {contentOffset: {x: scrollAnimatedValue}}}], {
          useNativeDriver: true,
        })}
        data={I18nManager.isRTL ? data.reverse() : data}
        onMomentumScrollEnd={() => {
          const index = Math.round(active.current / itemSize);
          onChange(data[index + 2]);
        }}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        inverted={I18nManager.isRTL}
        contentContainerStyle={
          I18nManager.isRTL && {
            transform: [
              {
                scaleX: -1,
              },
            ],
          }
        }
      />
    </View>
  );
};

const SelectTime = () => {
  const {
    options,
    state,
    utils,
    minuteInterval,
    minimumTime,
    maximumTime,
    mode,
    onTimeChange,
    currentTime,
  } = useCalendar();
  const [mainState, setMainState] = state;
  const [show, setShow] = useState(false);
  const [isValidTime, setValidTime] = useState(true);
  const [time, setTime] = useState(new Date());
  const style = styles(options);
  const openAnimation = useRef(new Animated.Value(0)).current;
  const minHour = minimumTime ? new Date(minimumTime).getHours() : 0;
  const maxHour = maximumTime ? new Date(maximumTime).getHours() : 23;
  const minMinute = minimumTime ? new Date(minimumTime).getMinutes() : 0;
  const maxMinute = maximumTime ? new Date(maximumTime).getMinutes() : 0;
  const defaultTimeWeb = currentTime
    ? utils.formatTime(currentTime)
    : utils.formatTime(minimumTime);
  const currentHour = currentTime ? new Date(currentTime).getHour() : null;
  const currentMinute = currentTime ? new Date(currentTime).getMinutes() : null;

  useEffect(() => {
    show &&
      setTime(new Date(new Date().setHours(minHour, minMinute, 0)));
  }, [minHour, show, minMinute]);

  useEffect(() => {
    mainState.timeOpen && setShow(true);
    Animated.timing(openAnimation, {
      toValue: mainState.timeOpen ? 1 : 0,
      duration: 350,
      useNativeDriver: true,
      easing: Easing.bezier(0.17, 0.67, 0.46, 1),
    }).start(() => {
      !mainState.timeOpen && setShow(false);
    });
  }, [mainState.timeOpen, openAnimation]);

  function numberRange(start, end) {
    if (start > end) {
      start = [end, start];
    }
    return Array(end - start + 1)
      .fill()
      .map((_, idx) => start + idx);
  }

  const selectTime = () => {
    const newTime = new Date(new Date().setHours(time.getHours(), time.getMinutes(), 0));
    const newTimeForActiveDate = new Date(new Date(mainState.activeDate).setHours(
      time.getHours(),
      time.getMinutes(),
      0,
    ));
    setMainState({
      type: 'set',
      activeDate: utils.formatTime(newTimeForActiveDate),
      selectedDate: mainState.selectedDate
        ? new Date(new Date(mainState.selectedDate).setHours(time.getHours(), time.getMinutes(), 0))
        : '',
    });
    onTimeChange(newTime);
    mode !== 'time' &&
      setMainState({
        type: 'toggleTime',
      });
  };

  const containerStyle = [
    style.container,
    {
      opacity: openAnimation,
      transform: [
        {
          scale: openAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [1.1, 1],
          }),
        },
      ],
    },
  ];

  const minMinutes = minimumTime ? new Date(minimumTime).getMinutes() : 0;
  const maxMinutes = maximumTime ? new Date(maximumTime).getMinutes() : 0;

  function getMinutesArray(min = 0, max = 59) {
    return numberRange(min, max).filter((n) => !(n % minuteInterval));
  }

  function returnMinutes() {
    switch (time.getHours()) {
      case minHour:
        return getMinutesArray(minMinutes);
      case maxHour:
        return getMinutesArray(0, maxMinutes);
      default:
        return getMinutesArray();
    }
  }

  function updateTime(time, isHour){
    let newTime = new Date(time)
    if(isHour){
      const curMinutes = new Date(time).getMinutes()
      const newHour = new Date(time).getHours()
      if(newHour === minHour){
        if(curMinutes < new Date(minimumTime).getMinutes()){
          newTime = newTime.setHours(newHour, minMinute)
        }
      } else if(newHour === maxHour) {
          if (curMinutes > new Date(maximumTime).getMinutes()) {
            newTime = newTime.setHours(newHour, maxMinute)
          }
        }
      }
      const isValidated = utils.validateTimeMinMax(new Date(newTime), minimumTime, maximumTime);
      setValidTime(isValidated);
      setTime(new Date(newTime))
  }

  return show ? (
    <Animated.View style={containerStyle}>
      {Platform.OS === 'web' ? (
        <View style={style.row}>
          <Text style={style.title}>{`Please choose time from ${utils.formatTime(
            minimumTime,
          )} to ${utils.formatTime(maximumTime)}`}</Text>
          <TimeInput current={defaultTimeWeb} onChange={(newTime) => updateTime(newTime)} />
        </View>
      ) : (
        <>
          <TimeScroller
            title={utils.config.hour}
            data={numberRange(minHour, maxHour)}
            onChange={(hour) => updateTime(time.setHours(hour), true)}
            current={currentHour}
          />
          <TimeScroller
            title={utils.config.minute}
            data={returnMinutes()}
            onChange={(minute) => updateTime(time.setMinutes(minute), false)}
            current={currentMinute}
          />
        </>
      )}
      <View style={style.footer}>
        <TouchableOpacity
          disabled={Platform.OS === 'web' ? !isValidTime : false}
          style={[!isValidTime && {opacity: 0.5}, style.button]}
          activeOpacity={0.8}
          onPress={selectTime}>
          <Text style={style.btnText}>{utils.config.timeSelect}</Text>
        </TouchableOpacity>
        {mode !== 'time' && (
          <TouchableOpacity
            style={[style.button, style.cancelButton]}
            onPress={() =>
              setMainState({
                type: 'toggleTime',
              })
            }
            activeOpacity={0.8}>
            <Text style={style.btnText}>{utils.config.timeClose}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  ) : null;
};

const styles = (theme) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      top: 0,
      right: 0,
      backgroundColor: theme.backgroundColor,
      borderRadius: 10,
      flexDirection: 'column',
      justifyContent: 'center',
      zIndex: 999,
    },
    row: {
      flexDirection: 'column',
      alignItems: 'center',
      marginVertical: 5,
    },
    title: {
      fontSize: theme.textHeaderFontSize,
      color: theme.mainColor,
      fontFamily: theme.headerFont,
    },
    listItem: {
      height: 60,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listItemText: {
      fontSize: theme.textHeaderFontSize,
      color: theme.textDefaultColor,
      fontFamily: theme.defaultFont,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 15,
    },
    button: {
      paddingVertical: 10,
      paddingHorizontal: 25,
      borderRadius: 8,
      backgroundColor: theme.mainColor,
      margin: 8,
    },
    btnText: {
      fontSize: theme.textFontSize,
      color: theme.selectedTextColor,
      fontFamily: theme.defaultFont,
    },
    cancelButton: {
      backgroundColor: theme.textSecondaryColor,
    },
  });

export {SelectTime};
