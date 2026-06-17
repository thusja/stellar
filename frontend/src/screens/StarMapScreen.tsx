import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StarMapCanvas from '../components/starmap/StarMapCanvas';
import DateTimeSlider from '../components/ui/DateTimeSlider';
import SettingsScreen from './SettingsScreen';
import { useUIStore } from '../stores/uiStore';
import { useStarStore } from '../stores/starStore';
import { useObserverStore } from '../stores/observerStore';
import { StarPoint } from '../types';
import { tempToColor } from '../utils/starUtils';

function getSpectralType(temp: number): { type: string; label: string } {
  if (temp < 3500) return { type: 'M', label: 'M형 - 적색' };
  if (temp < 5000) return { type: 'K', label: 'K형 - 주황색' };
  if (temp < 6000) return { type: 'G', label: 'G형 - 황백색' };
  if (temp < 7500) return { type: 'F', label: 'F형 - 백색' };
  if (temp < 10000) return { type: 'A', label: 'A형 - 청백색' };
  if (temp < 20000) return { type: 'B', label: 'B형 - 청색' };
  return { type: 'O', label: 'O형 - 진청색' };
}

function rgbToHex(r: number, g: number, b: number) {
  const h = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

function distanceFill(distanceLy: number): number {
  const clamped = Math.max(0.01, Math.min(distanceLy, 2000));
  return (Math.log10(clamped + 1) / Math.log10(2001)) * 100;
}

function getObservationTips(star: StarPoint): string[] {
  const tips: string[] = [];

  if (star.magnitude <= 1.5) {
    tips.push('도심에서도 육안으로 쉽게 식별됩니다.');
  } else if (star.magnitude <= 3.0) {
    tips.push('밝은 하늘에서는 찾기 어렵고, 교외/어두운 하늘에서 더 잘 보입니다.');
  } else {
    tips.push('쌍안경 또는 매우 어두운 하늘에서 관측을 권장합니다.');
  }

  if (star.temperature >= 9000) {
    tips.push('청백색 계열이라 색감이 차갑게 느껴질 수 있습니다.');
  } else if (star.temperature <= 4500) {
    tips.push('주황~적색 계열로 저배율에서도 색 대비가 잘 보입니다.');
  } else {
    tips.push('황백색 계열로 중성적인 색감입니다.');
  }

  if (star.distanceLy > 300) {
    tips.push('매우 먼 항성입니다. 밝기가 좋아도 실제 광도는 매우 클 수 있습니다.');
  } else {
    tips.push('상대적으로 가까운 항성으로 거리 감각 비교에 좋습니다.');
  }

  return tips;
}

export default function StarMapScreen() {
  const {
    selectedStarId,
    isDetailSheetOpen,
    closeDetailSheet,
    isSettingsOpen,
    setSettingsOpen,
    isNorthLocked,
    toggleNorthLock,
    selectStar,
    setFocusStarId,
    recentSearchIds,
    pushRecentSearch,
    highlightedConstellation,
    setHighlightedConstellation,
  } =
    useUIStore();
  const stars = useStarStore((s) => s.stars);
  const magnitudeFilter = useStarStore((s) => s.magnitudeFilter);
  const setMagnitudeFilter = useStarStore((s) => s.setMagnitudeFilter);
  const showConstellationLines = useStarStore((s) => s.showConstellationLines);
  const toggleConstellationLines = useStarStore((s) => s.toggleConstellationLines);
  const { locationLabel, latitude, longitude } = useObserverStore();
  const selectedStar = selectedStarId != null ? stars.find((s) => s.id === selectedStarId) ?? null : null;
  const [searchQuery, setSearchQuery] = useState('');

  const [activeStar, setActiveStar] = useState<StarPoint | null>(null);
  const sheetAnim = useRef(new Animated.Value(420)).current;

  const showDetail = isDetailSheetOpen && !!selectedStar;

  useEffect(() => {
    if (selectedStar) {
      setActiveStar(selectedStar);
    }
  }, [selectedStar]);

  useEffect(() => {
    if (showDetail) {
      Animated.timing(sheetAnim, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }

    if (activeStar) {
      Animated.timing(sheetAnim, {
        toValue: 420,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setActiveStar(null);
      });
    }
  }, [showDetail, activeStar, sheetAnim]);

  const spectral = useMemo(() => {
    if (!activeStar) return null;
    const [r, g, b] = tempToColor(activeStar.temperature);
    const starColor = rgbToHex(r, g, b);
    const typeInfo = getSpectralType(activeStar.temperature);
    return { starColor, ...typeInfo };
  }, [activeStar]);

  const tips = useMemo(() => {
    if (!activeStar) return [];
    return getObservationTips(activeStar);
  }, [activeStar]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return stars
      .filter((s) => {
        return (
          s.name.toLowerCase().includes(q) ||
          s.nameKo.toLowerCase().includes(q) ||
          s.constellation.toLowerCase().includes(q) ||
          s.constellationKo.toLowerCase().includes(q)
        );
      })
      .slice(0, 6);
  }, [searchQuery, stars]);

  const recentStars = useMemo(
    () => recentSearchIds
      .map((id) => stars.find((s) => s.id === id))
      .filter((s): s is StarPoint => !!s),
    [recentSearchIds, stars],
  );

  const handleSelectSearchStar = (item: StarPoint) => {
    selectStar(item.id);
    setFocusStarId(item.id);
    pushRecentSearch(item.id);
    setSearchQuery('');
  };

  const handleFocusConstellation = () => {
    if (!activeStar) return;
    const next = highlightedConstellation === activeStar.constellation ? null : activeStar.constellation;
    setHighlightedConstellation(next);
    setFocusStarId(activeStar.id);
  };

  const cycleMagnitudeFilter = () => {
    const options = [2.0, 3.0, 4.0, 5.0, 6.0];
    const idx = options.findIndex((v) => Math.abs(v - magnitudeFilter) < 0.05);
    const next = options[(idx + 1 + options.length) % options.length];
    setMagnitudeFilter(next);
  };

  return (
    <View style={styles.container}>
      <StarMapCanvas key={`mag-${magnitudeFilter.toFixed(1)}`} />

      <SafeAreaView style={styles.headerWrapper} pointerEvents="box-none">
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>STELLAR</Text>
            <Text style={styles.headerSub}>드래그로 천구 회전 · 별 탭으로 상세 정보</Text>
            <View style={styles.locationPill}>
              <Text style={styles.locationLabel}>{locationLabel}</Text>
              <Text style={styles.locationCoords}>
                {latitude.toFixed(2)}°, {longitude.toFixed(2)}°
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.northLockBtn, isNorthLocked && styles.northLockBtnActive]}
              onPress={toggleNorthLock}
            >
              <Text style={[styles.northLockTxt, isNorthLocked && styles.northLockTxtActive]}>
                {isNorthLocked ? 'N 고정' : 'N 자유'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.gearBtn} onPress={() => setSettingsOpen(true)}>
              <Text style={styles.gearIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchOverlay}>
          <View style={styles.searchInputRow}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="별/별자리 검색 (예: Sirius, 시리우스, Orion)"
              placeholderTextColor="#3a5070"
              returnKeyType="search"
              onSubmitEditing={() => {
                if (searchResults.length > 0) handleSelectSearchStar(searchResults[0]);
              }}
            />
            {searchQuery.trim().length > 0 && (
              <TouchableOpacity style={styles.searchClearBtn} onPress={() => setSearchQuery('')}>
                <Text style={styles.searchClearTxt}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {searchQuery.trim().length === 0 && recentStars.length > 0 && (
            <View style={styles.recentWrap}>
              <Text style={styles.recentTitle}>최근 검색</Text>
              <View style={styles.recentRow}>
                {recentStars.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.recentChip}
                    onPress={() => handleSelectSearchStar(item)}
                  >
                    <Text style={styles.recentChipName}>{item.name}</Text>
                    <Text style={styles.recentChipSub}>{item.nameKo}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {searchQuery.trim().length > 0 && (
            <View style={styles.searchResultsCard}>
              {searchResults.length === 0 ? (
                <Text style={styles.searchEmpty}>검색 결과가 없습니다.</Text>
              ) : (
                searchResults.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.searchResultItem}
                    onPress={() => handleSelectSearchStar(item)}
                  >
                    <View style={styles.searchItemTop}>
                      <Text style={styles.searchName}>{item.name}</Text>
                      <View style={styles.magBadge}>
                        <Text style={styles.magBadgeText}>{item.magnitude.toFixed(1)}</Text>
                      </View>
                    </View>
                    <Text style={styles.searchSub}>
                      {item.nameKo} · {item.constellationKo}
                    </Text>
                    <Text style={styles.searchMeta}>
                      {getSpectralType(item.temperature).type}형 · {item.temperature.toLocaleString()}K
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>
      </SafeAreaView>

      {isSettingsOpen && <SettingsScreen onClose={() => setSettingsOpen(false)} />}

      {activeStar ? (
        <Animated.View
          style={[
            styles.detailSheet,
            {
              transform: [{ translateY: sheetAnim }],
              opacity: sheetAnim.interpolate({
                inputRange: [0, 420],
                outputRange: [1, 0.6],
              }),
            },
          ]}
        >
          <View style={styles.dragHandle} />

          <TouchableOpacity style={styles.closeBtn} onPress={closeDetailSheet}>
            <Text style={styles.closeTxt}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.starName}>{activeStar.name}</Text>
          <Text style={styles.starNameKo}>{activeStar.nameKo}</Text>
          <Text style={styles.constellation}>{activeStar.constellationKo}</Text>

          {spectral && (
            <View style={styles.spectrumSection}>
              <View style={styles.spectrumBarRow}>
                {['O', 'B', 'A', 'F', 'G', 'K', 'M'].map((t, i) => {
                  const COLORS = ['#9ab0ff', '#b8c8ff', '#d8e4ff', '#fff8f0', '#ffe08a', '#ffb050', '#ff6020'];
                  return (
                    <View
                      key={t}
                      style={[
                        styles.spectrumSegment,
                        { backgroundColor: COLORS[i] },
                        t === spectral.type && styles.spectrumSegmentActive,
                      ]}
                    />
                  );
                })}
              </View>
              <View style={styles.spectrumLabelRow}>
                {['O', 'B', 'A', 'F', 'G', 'K', 'M'].map((t) => (
                  <Text
                    key={t}
                    style={[
                      styles.spectrumTypeChar,
                      t === spectral.type && { color: spectral.starColor, fontWeight: '700' },
                    ]}
                  >
                    {t}
                  </Text>
                ))}
              </View>
              <View style={styles.spectrumInfo}>
                <View style={[styles.spectrumDot, { backgroundColor: spectral.starColor }]} />
                <Text style={styles.spectrumLabel}>{spectral.label}</Text>
                <Text style={styles.spectrumTemp}>{activeStar.temperature.toLocaleString()} K</Text>
              </View>
            </View>
          )}

          <View style={styles.distanceSection}>
            <View style={styles.distanceHeader}>
              <Text style={styles.distanceTitle}>거리 스케일</Text>
              <Text style={styles.distanceValue}>{activeStar.distanceLy} ly</Text>
            </View>
            <View style={styles.distanceTrack}>
              <View
                style={[
                  styles.distanceFill,
                  { width: `${distanceFill(activeStar.distanceLy)}%` },
                ]}
              />
            </View>
            <View style={styles.distanceTicks}>
              <Text style={styles.distanceTickLabel}>1 ly</Text>
              <Text style={styles.distanceTickLabel}>10 ly</Text>
              <Text style={styles.distanceTickLabel}>100 ly</Text>
              <Text style={styles.distanceTickLabel}>1k+ ly</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>등급</Text>
              <Text style={styles.statValue}>{activeStar.magnitude.toFixed(2)}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>거리</Text>
              <Text style={styles.statValue}>{activeStar.distanceLy} ly</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>온도</Text>
              <Text style={styles.statValue}>{activeStar.temperature.toLocaleString()}K</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.constellationBtn} onPress={handleFocusConstellation}>
            <Text style={styles.constellationBtnTxt}>
              {highlightedConstellation === activeStar.constellation
                ? '별자리 하이라이트 해제'
                : '이 별자리 전체 보기'}
            </Text>
          </TouchableOpacity>

          <View style={styles.tipSection}>
            <Text style={styles.tipTitle}>관측 팁</Text>
            {tips.map((tip) => (
              <View key={tip} style={styles.tipRow}>
                <View style={styles.tipDot} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.coords}>
            RA {activeStar.ra.toFixed(4)}h {'  '}Dec {activeStar.dec.toFixed(3)}°
          </Text>
        </Animated.View>
      ) : (
        <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
          <View style={styles.filterBar}>
            <TouchableOpacity style={styles.filterChip} onPress={cycleMagnitudeFilter}>
              <Text style={styles.filterChipLabel}>등급 ≤ {magnitudeFilter.toFixed(1)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, showConstellationLines && styles.filterChipActive]}
              onPress={toggleConstellationLines}
            >
              <Text style={[styles.filterChipLabel, showConstellationLines && styles.filterChipLabelActive]}>
                별자리선 {showConstellationLines ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </View>
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gearBtn: {
    padding: 6,
    marginTop: 2,
  },
  gearIcon: {
    fontSize: 22,
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
    marginBottom: 6,
  },
  locationPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(10, 20, 35, 0.86)',
    borderWidth: 1,
    borderColor: '#1a2a44',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  locationLabel: {
    color: '#a6c7f7',
    fontSize: 12,
    fontWeight: '600',
  },
  locationCoords: {
    color: '#5a7396',
    fontSize: 11,
    marginTop: 1,
  },
  northLockBtn: {
    marginTop: 3,
    borderWidth: 1,
    borderColor: '#2a4264',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(10, 20, 35, 0.78)',
  },
  northLockBtnActive: {
    borderColor: '#5f93d7',
    backgroundColor: 'rgba(30, 60, 95, 0.9)',
  },
  northLockTxt: {
    color: '#7a96ba',
    fontSize: 11,
    fontWeight: '600',
  },
  northLockTxtActive: {
    color: '#cbe2ff',
  },
  searchOverlay: {
    marginTop: 2,
    marginHorizontal: 20,
  },
  searchInputRow: {
    position: 'relative',
  },
  searchInput: {
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#20324d',
    backgroundColor: 'rgba(9, 16, 28, 0.92)',
    color: '#c8d8f0',
    paddingHorizontal: 12,
    paddingRight: 36,
    fontSize: 13,
  },
  searchClearBtn: {
    position: 'absolute',
    right: 8,
    top: 7,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#162942',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchClearTxt: {
    color: '#9dbce6',
    fontSize: 12,
    fontWeight: '700',
  },
  recentWrap: {
    marginTop: 6,
  },
  recentTitle: {
    color: '#6e86a8',
    fontSize: 11,
    marginBottom: 4,
    marginLeft: 2,
  },
  recentRow: {
    flexDirection: 'row',
    gap: 6,
  },
  recentChip: {
    flex: 1,
    backgroundColor: 'rgba(13, 24, 40, 0.9)',
    borderWidth: 1,
    borderColor: '#1a2a44',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  recentChipName: {
    color: '#cbe2ff',
    fontSize: 12,
    fontWeight: '600',
  },
  recentChipSub: {
    color: '#6e86a8',
    fontSize: 10,
    marginTop: 1,
  },
  searchResultsCard: {
    marginTop: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(8, 14, 24, 0.95)',
    borderWidth: 1,
    borderColor: '#1a2a44',
    overflow: 'hidden',
  },
  searchResultItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#122034',
  },
  searchItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchName: {
    color: '#d8e7ff',
    fontSize: 14,
    fontWeight: '600',
  },
  magBadge: {
    minWidth: 34,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#183255',
    alignItems: 'center',
  },
  magBadgeText: {
    color: '#b9d8ff',
    fontSize: 11,
    fontWeight: '700',
  },
  searchSub: {
    color: '#6e86a8',
    fontSize: 12,
    marginTop: 1,
  },
  searchMeta: {
    color: '#4f6788',
    fontSize: 11,
    marginTop: 2,
  },
  searchEmpty: {
    color: '#7085a5',
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  spectrumSection: {
    marginBottom: 18,
  },
  spectrumBarRow: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 4,
  },
  spectrumSegment: {
    flex: 1,
    opacity: 0.35,
  },
  spectrumSegmentActive: {
    opacity: 1.0,
    transform: [{ scaleY: 1.4 }],
  },
  spectrumLabelRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  spectrumTypeChar: {
    flex: 1,
    textAlign: 'center',
    color: '#3a5070',
    fontSize: 10,
  },
  spectrumInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spectrumDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  spectrumLabel: {
    color: '#a0b8d8',
    fontSize: 13,
    flex: 1,
  },
  spectrumTemp: {
    color: '#4a6888',
    fontSize: 12,
  },
  distanceSection: {
    marginBottom: 16,
    backgroundColor: '#0f1e30',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  distanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  distanceTitle: {
    color: '#4a6888',
    fontSize: 11,
  },
  distanceValue: {
    color: '#a0c4ff',
    fontSize: 12,
    fontWeight: '600',
  },
  distanceTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1a2a44',
    overflow: 'hidden',
  },
  distanceFill: {
    height: '100%',
    backgroundColor: '#4a80c4',
  },
  distanceTicks: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  distanceTickLabel: {
    color: '#3a5070',
    fontSize: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
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
  constellationBtn: {
    backgroundColor: '#153154',
    borderWidth: 1,
    borderColor: '#4a80c4',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  constellationBtnTxt: {
    color: '#cbe2ff',
    fontSize: 13,
    fontWeight: '700',
  },
  tipSection: {
    backgroundColor: '#0f1a2b',
    borderColor: '#1a2a44',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  tipTitle: {
    color: '#8fb6ee',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  tipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 6,
    marginRight: 8,
    backgroundColor: '#4a80c4',
  },
  tipText: {
    flex: 1,
    color: '#9fb5d3',
    fontSize: 12,
    lineHeight: 18,
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
  filterBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  filterChip: {
    flex: 1,
    backgroundColor: '#0d1b2f',
    borderWidth: 1,
    borderColor: '#1a2a44',
    borderRadius: 9,
    paddingVertical: 8,
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: '#19365a',
    borderColor: '#4a80c4',
  },
  filterChipLabel: {
    color: '#7b97bc',
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipLabelActive: {
    color: '#cbe2ff',
  },
});
