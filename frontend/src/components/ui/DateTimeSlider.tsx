import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { useObserverStore } from '../../stores/observerStore';
import { useUIStore } from '../../stores/uiStore';

const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatDate(d: Date) {
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

function formatTime(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function DateTimeSlider() {
  const { observationDate, setObservationDate } = useObserverStore();
  const { isDateSliderExpanded, toggleDateSlider } = useUIStore();

  const resetToNow = useCallback(() => {
    setObservationDate(new Date());
  }, [setObservationDate]);

  // 시간 슬라이더: 0~1439 (0시 0분 ~ 23시 59분)
  const totalMinutes = observationDate.getHours() * 60 + observationDate.getMinutes();

  const onTimeChange = useCallback(
    (value: number) => {
      const next = new Date(observationDate);
      next.setHours(Math.floor(value / 60));
      next.setMinutes(value % 60);
      next.setSeconds(0);
      setObservationDate(next);
    },
    [observationDate, setObservationDate],
  );

  // 날짜 ±1일 이동
  const shiftDay = useCallback(
    (delta: number) => {
      const next = new Date(observationDate);
      next.setDate(next.getDate() + delta);
      setObservationDate(next);
    },
    [observationDate, setObservationDate],
  );

  return (
    <View style={styles.wrapper}>
      {/* 접힌 상태: 날짜·시간 요약 탭 */}
      <TouchableOpacity style={styles.summary} onPress={toggleDateSlider} activeOpacity={0.8}>
        <Text style={styles.summaryIcon}>📅</Text>
        <Text style={styles.summaryDate}>{formatDate(observationDate)}</Text>
        <Text style={styles.summaryTime}>{formatTime(observationDate)}</Text>
        <Text style={styles.chevron}>{isDateSliderExpanded ? '▼' : '▲'}</Text>
      </TouchableOpacity>

      {/* 펼쳐진 상태 */}
      {isDateSliderExpanded && (
        <View style={styles.expanded}>
          {/* 날짜 row */}
          <View style={styles.dateRow}>
            <TouchableOpacity style={styles.arrowBtn} onPress={() => shiftDay(-1)}>
              <Text style={styles.arrowTxt}>◀</Text>
            </TouchableOpacity>

            <View style={styles.dateCenter}>
              <Text style={styles.dateMain}>
                {observationDate.getFullYear()}년{' '}
                {MONTHS[observationDate.getMonth()]}{' '}
                {observationDate.getDate()}일
              </Text>
            </View>

            <TouchableOpacity style={styles.arrowBtn} onPress={() => shiftDay(1)}>
              <Text style={styles.arrowTxt}>▶</Text>
            </TouchableOpacity>
          </View>

          {/* 시간 슬라이더 */}
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>{formatTime(observationDate)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1439}
              step={1}
              value={totalMinutes}
              onValueChange={onTimeChange}
              minimumTrackTintColor="#4a80c4"
              maximumTrackTintColor="#1a2a44"
              thumbTintColor="#a0c4ff"
            />
          </View>

          {/* 현재 시간 초기화 */}
          <TouchableOpacity style={styles.resetBtn} onPress={resetToNow}>
            <Text style={styles.resetTxt}>현재 시간으로 초기화</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#080f1e',
    borderTopWidth: 1,
    borderColor: '#1a2a44',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  summaryIcon: {
    fontSize: 14,
  },
  summaryDate: {
    color: '#a0b8d8',
    fontSize: 14,
    flex: 1,
  },
  summaryTime: {
    color: '#c0d4f0',
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  chevron: {
    color: '#3a5070',
    fontSize: 10,
    marginLeft: 4,
  },
  expanded: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowBtn: {
    padding: 8,
  },
  arrowTxt: {
    color: '#4a80c4',
    fontSize: 14,
  },
  dateCenter: {
    flex: 1,
    alignItems: 'center',
  },
  dateMain: {
    color: '#c0d4f0',
    fontSize: 16,
    fontWeight: '500',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeLabel: {
    color: '#a0b8d8',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    width: 40,
  },
  slider: {
    flex: 1,
    height: 36,
  },
  resetBtn: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  resetTxt: {
    color: '#3a5878',
    fontSize: 12,
  },
});
