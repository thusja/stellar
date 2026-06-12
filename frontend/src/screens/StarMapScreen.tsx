import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StarMapCanvas from '../components/starmap/StarMapCanvas';
import DateTimeSlider from '../components/ui/DateTimeSlider';
import { useUIStore } from '../stores/uiStore';
import { useStarStore } from '../stores/starStore';

export default function StarMapScreen() {
  const { selectedStarId, isDetailSheetOpen, closeDetailSheet } = useUIStore();
  const stars = useStarStore((s) => s.stars);
  const selectedStar = selectedStarId != null ? stars.find((s) => s.id === selectedStarId) : null;

  return (
    <View style={styles.container}>
      <StarMapCanvas />

      {/* 상단 헤더 */}
      <SafeAreaView style={styles.headerWrapper} pointerEvents="none">
        <View style={styles.header}>
          <Text style={styles.headerTitle}>STELLAR</Text>
          <Text style={styles.headerSub}>드래그로 천구 회전 · 별 탭으로 상세 정보</Text>
        </View>
      </SafeAreaView>

      {/* 별 상세 정보 시트 (슬라이더와 동시 표시 X) */}
      {isDetailSheetOpen && selectedStar ? (
        <View style={styles.detailSheet}>
          <View style={styles.dragHandle} />

          <TouchableOpacity style={styles.closeBtn} onPress={closeDetailSheet}>
            <Text style={styles.closeTxt}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.starName}>{selectedStar.name}</Text>
          <Text style={styles.starNameKo}>{selectedStar.nameKo}</Text>
          <Text style={styles.constellation}>{selectedStar.constellationKo}</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>등급</Text>
              <Text style={styles.statValue}>{selectedStar.magnitude.toFixed(2)}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>거리</Text>
              <Text style={styles.statValue}>{selectedStar.distanceLy} ly</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>온도</Text>
              <Text style={styles.statValue}>{selectedStar.temperature.toLocaleString()}K</Text>
            </View>
          </View>

          <Text style={styles.coords}>
            RA {selectedStar.ra.toFixed(4)}h {'  '}Dec {selectedStar.dec.toFixed(3)}°
          </Text>
        </View>
      ) : (
        /* 날짜/시간 슬라이더 (별 상세 닫혔을 때 하단 고정) */
        <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
          <DateTimeSlider />
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#040812',
  },
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    color: '#c8d8f0',
    fontSize: 18,
    fontWeight: '300',
    letterSpacing: 8,
  },
  headerSub: {
    color: '#3a5070',
    fontSize: 11,
    marginTop: 2,
  },
  detailSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0b1220',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#1a2a44',
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#2a3a55',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 20,
    padding: 4,
  },
  closeTxt: {
    color: '#556688',
    fontSize: 16,
  },
  starName: {
    color: '#e0ecff',
    fontSize: 26,
    fontWeight: '600',
    marginBottom: 2,
  },
  starNameKo: {
    color: '#a0b8d8',
    fontSize: 16,
    marginBottom: 4,
  },
  constellation: {
    color: '#4a6888',
    fontSize: 13,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  stat: {
    flex: 1,
    backgroundColor: '#0f1e30',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    color: '#4a6888',
    fontSize: 11,
    marginBottom: 4,
  },
  statValue: {
    color: '#c0d4f0',
    fontSize: 15,
    fontWeight: '600',
  },
  coords: {
    color: '#3a5070',
    fontSize: 12,
    textAlign: 'center',
    paddingBottom: 8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
