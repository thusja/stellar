import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useObserverStore } from '../stores/observerStore';
import { useUIStore } from '../stores/uiStore';
import { BRIGHT_STARS } from '../data/brightStars';
import { calcAltAz, calcSunriseSunset, tempToColor } from '../utils/starUtils';
import SettingsScreen from './SettingsScreen';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatTime(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (v: number) => pad(Math.round(v * 255).toString(16));
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

interface VisibleStar {
  id: number;
  name: string;
  nameKo: string;
  constellationKo: string;
  magnitude: number;
  altitude: number;
  azimuth: number;
  temperature: number;
}

const DIRECTION = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
function azToDir(az: number) {
  return DIRECTION[Math.round(az / 45) % 8];
}

interface Props {
  onBack: () => void;
}

export default function NightGuideScreen({ onBack }: Props) {
  const { latitude, longitude, observationDate, locationLabel } = useObserverStore();
  const { isNorthLocked, toggleNorthLock } = useUIStore();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { visibleStars, sunInfo } = useMemo(() => {
    // 지평선 위 별 필터링 + 고도 내림차순 정렬
    const visible: VisibleStar[] = BRIGHT_STARS
      .map((star) => {
        const { altitude, azimuth } = calcAltAz(
          star.ra,
          star.dec,
          latitude,
          longitude,
          observationDate,
        );
        return { ...star, altitude, azimuth };
      })
      .filter((s) => s.altitude > 5) // 5° 이상만 (지평선 근처 대기굴절 제외)
      .sort((a, b) => a.magnitude - b.magnitude); // 밝기 순

    const { sunrise, sunset } = calcSunriseSunset(latitude, longitude, observationDate);

    return { visibleStars: visible, sunInfo: { sunrise, sunset } };
  }, [latitude, longitude, observationDate]);

  const renderItem = ({ item, index }: ListRenderItemInfo<VisibleStar>) => {
    const [r, g, b] = tempToColor(item.temperature);
    const starColor = rgbToHex(r, g, b);

    return (
      <View style={styles.row}>
        <View style={styles.rankBox}>
          <Text style={styles.rank}>{index + 1}</Text>
        </View>

        <View style={[styles.starDot, { backgroundColor: starColor }]} />

        <View style={styles.starInfo}>
          <Text style={styles.starName}>{item.name}</Text>
          <Text style={styles.starSub}>
            {item.nameKo} · {item.constellationKo}
          </Text>
        </View>

        <View style={styles.posInfo}>
          <Text style={styles.altitude}>{item.altitude.toFixed(1)}°</Text>
          <Text style={styles.azimuth}>
            {azToDir(item.azimuth)} {item.azimuth.toFixed(0)}°
          </Text>
        </View>

        <View style={styles.magBox}>
          <Text style={styles.mag}>{item.magnitude.toFixed(1)}</Text>
          <Text style={styles.magLabel}>등급</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 설정 오버레이 */}
      {settingsOpen && <SettingsScreen onClose={() => setSettingsOpen(false)} />}

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backTxt}>← 성도</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>오늘 밤 가이드</Text>
          <Text style={styles.subtitle}>{locationLabel}</Text>
        </View>
        <TouchableOpacity
          onPress={toggleNorthLock}
          style={[styles.northLockBtn, isNorthLocked && styles.northLockBtnActive]}
        >
          <Text style={[styles.northLockTxt, isNorthLocked && styles.northLockTxtActive]}>
            {isNorthLocked ? 'N 고정' : 'N 자유'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSettingsOpen(true)} style={styles.gearBtn}>
          <Text style={styles.gearIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* 일출/일몰 카드 */}
      <View style={styles.sunCard}>
        <View style={styles.sunItem}>
          <Text style={styles.sunIcon}>🌅</Text>
          <Text style={styles.sunLabel}>일출</Text>
          <Text style={styles.sunTime}>
            {sunInfo.sunrise ? formatTime(sunInfo.sunrise) : '--:--'}
          </Text>
        </View>
        <View style={styles.sunDivider} />
        <View style={styles.sunItem}>
          <Text style={styles.sunIcon}>🌇</Text>
          <Text style={styles.sunLabel}>일몰</Text>
          <Text style={styles.sunTime}>
            {sunInfo.sunset ? formatTime(sunInfo.sunset) : '--:--'}
          </Text>
        </View>
        <View style={styles.sunDivider} />
        <View style={styles.sunItem}>
          <Text style={styles.sunIcon}>✦</Text>
          <Text style={styles.sunLabel}>관측 가능</Text>
          <Text style={styles.sunTime}>{visibleStars.length}개</Text>
        </View>
      </View>

      {/* 컬럼 헤더 */}
      <View style={styles.colHeader}>
        <Text style={[styles.colTxt, { flex: 1, marginLeft: 56 }]}>별</Text>
        <Text style={[styles.colTxt, { width: 80, textAlign: 'right' }]}>고도/방위</Text>
        <Text style={[styles.colTxt, { width: 44, textAlign: 'right' }]}>밝기</Text>
      </View>

      {/* 별 목록 */}
      <FlatList
        data={visibleStars}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTxt}>현재 시각엔 밝은 별이 지평선 위에 없습니다.</Text>
            <Text style={styles.emptyHint}>날짜/시간 슬라이더를 조정해 보세요.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#040812',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#1a2a44',
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: 12,
  },
  backTxt: {
    color: '#4a80c4',
    fontSize: 14,
  },
  headerCenter: {
    flex: 1,
  },
  title: {
    color: '#c8d8f0',
    fontSize: 17,
    fontWeight: '600',
  },
  subtitle: {
    color: '#3a5070',
    fontSize: 12,
    marginTop: 1,
  },
  northLockBtn: {
    borderWidth: 1,
    borderColor: '#2a4264',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#0b1627',
    marginRight: 6,
  },
  northLockBtnActive: {
    borderColor: '#5f93d7',
    backgroundColor: '#1a3658',
  },
  northLockTxt: {
    color: '#7a96ba',
    fontSize: 11,
    fontWeight: '600',
  },
  northLockTxtActive: {
    color: '#cbe2ff',
  },
  gearBtn: {
    padding: 6,
  },
  gearIcon: {
    fontSize: 22,
  },
  sunCard: {
    flexDirection: 'row',
    backgroundColor: '#0b1220',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1a2a44',
    paddingVertical: 14,
  },
  sunItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  sunIcon: {
    fontSize: 18,
  },
  sunLabel: {
    color: '#4a6888',
    fontSize: 11,
  },
  sunTime: {
    color: '#c0d4f0',
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  sunDivider: {
    width: 1,
    backgroundColor: '#1a2a44',
    marginVertical: 4,
  },
  colHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  colTxt: {
    color: '#2a4060',
    fontSize: 11,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  rankBox: {
    width: 22,
    alignItems: 'center',
  },
  rank: {
    color: '#2a4060',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  starDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  starInfo: {
    flex: 1,
  },
  starName: {
    color: '#c0d4f0',
    fontSize: 15,
    fontWeight: '500',
  },
  starSub: {
    color: '#4a6888',
    fontSize: 11,
    marginTop: 1,
  },
  posInfo: {
    width: 80,
    alignItems: 'flex-end',
  },
  altitude: {
    color: '#a0c4ff',
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  azimuth: {
    color: '#3a5878',
    fontSize: 11,
    marginTop: 1,
  },
  magBox: {
    width: 36,
    alignItems: 'center',
  },
  mag: {
    color: '#c0d4f0',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  magLabel: {
    color: '#2a4060',
    fontSize: 10,
  },
  separator: {
    height: 1,
    backgroundColor: '#0d1828',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyTxt: {
    color: '#3a5070',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyHint: {
    color: '#2a3a55',
    fontSize: 12,
  },
});
