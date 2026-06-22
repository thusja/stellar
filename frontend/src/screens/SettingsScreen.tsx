import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useObserverStore } from '../stores/observerStore';
import { useStarStore } from '../stores/starStore';

interface Props {
  onClose: () => void;
}

export default function SettingsScreen({ onClose }: Props) {
  const {
    latitude,
    longitude,
    locationLabel,
    isDefaultLocation,
    setLocation,
    setDefaultLocation,
  } = useObserverStore();

  const {
    magnitudeFilter,
    showConstellationLines,
    showBelowHorizon,
    showBelowHorizonLines,
    setMagnitudeFilter,
    toggleConstellationLines,
    toggleShowBelowHorizon,
    toggleShowBelowHorizonLines,
  } = useStarStore();

  const [latInput, setLatInput] = useState(String(latitude.toFixed(4)));
  const [lngInput, setLngInput] = useState(String(longitude.toFixed(4)));
  const [labelInput, setLabelInput] = useState(isDefaultLocation ? '' : locationLabel);
  const [localMag, setLocalMag] = useState(magnitudeFilter);

  const handleApplyLocation = () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      Alert.alert('오류', '위도는 -90 ~ 90 사이 숫자여야 합니다.');
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      Alert.alert('오류', '경도는 -180 ~ 180 사이 숫자여야 합니다.');
      return;
    }
    const label = labelInput.trim() || `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
    setLocation(lat, lng, label);
    Alert.alert('저장됨', `위치가 "${label}"로 설정됐습니다.`);
  };

  const handleResetLocation = () => {
    setDefaultLocation();
    setLatInput('37.5665');
    setLngInput('126.9780');
    setLabelInput('');
  };

  const handleMagCommit = (val: number) => {
    setMagnitudeFilter(Math.round(val * 10) / 10);
  };

  return (
    <Modal
      visible
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.sheetWrapper}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        <SafeAreaView style={styles.sheet} edges={['top', 'bottom']}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.title}>설정</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* ── 관측 위치 ─────────────────────────── */}
            <Text style={styles.sectionTitle}>관측 위치</Text>

            <View style={styles.card}>
              <Text style={styles.currentLocation}>
                현재: {locationLabel}
              </Text>

              <Text style={styles.inputLabel}>위도 (−90 ~ 90)</Text>
              <TextInput
                style={styles.input}
                value={latInput}
                onChangeText={setLatInput}
                keyboardType="numeric"
                placeholderTextColor="#3a5070"
                placeholder="예: 37.5665"
              />

              <Text style={styles.inputLabel}>경도 (−180 ~ 180)</Text>
              <TextInput
                style={styles.input}
                value={lngInput}
                onChangeText={setLngInput}
                keyboardType="numeric"
                placeholderTextColor="#3a5070"
                placeholder="예: 126.9780"
              />

              <Text style={styles.inputLabel}>위치 이름 (선택)</Text>
              <TextInput
                style={styles.input}
                value={labelInput}
                onChangeText={setLabelInput}
                placeholderTextColor="#3a5070"
                placeholder="예: 부산 해운대"
              />

              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.applyBtn} onPress={handleApplyLocation}>
                  <Text style={styles.applyBtnTxt}>적용</Text>
                </TouchableOpacity>
                {!isDefaultLocation && (
                  <TouchableOpacity style={styles.resetBtn} onPress={handleResetLocation}>
                    <Text style={styles.resetBtnTxt}>서울 기본값으로</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* ── 별 필터 ───────────────────────────── */}
            <Text style={styles.sectionTitle}>별 필터</Text>

            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.inputLabel}>최대 등급 (어두울수록 큰 값)</Text>
                <Text style={styles.magValue}>{localMag.toFixed(1)}</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={1.0}
                maximumValue={6.5}
                step={0.1}
                value={localMag}
                onValueChange={setLocalMag}
                onSlidingComplete={handleMagCommit}
                minimumTrackTintColor="#4a80c4"
                maximumTrackTintColor="#1a2a44"
                thumbTintColor="#a0c4ff"
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>1.0 (밝은 별만)</Text>
                <Text style={styles.sliderLabel}>6.5 (육안 한계)</Text>
              </View>
            </View>

            {/* ── 표시 설정 ─────────────────────────── */}
            <Text style={styles.sectionTitle}>표시 설정</Text>

            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.switchLabel}>별자리 선 표시</Text>
                <Switch
                  value={showConstellationLines}
                  onValueChange={toggleConstellationLines}
                  trackColor={{ false: '#1a2a44', true: '#2a5080' }}
                  thumbColor={showConstellationLines ? '#4a80c4' : '#3a4a60'}
                />
              </View>

              <View style={styles.rowBetween}>
                <Text style={styles.switchLabel}>지평선 아래 별 표시</Text>
                <Switch
                  value={showBelowHorizon}
                  onValueChange={toggleShowBelowHorizon}
                  trackColor={{ false: '#1a2a44', true: '#2a5080' }}
                  thumbColor={showBelowHorizon ? '#4a80c4' : '#3a4a60'}
                />
              </View>

              <View style={styles.rowBetween}>
                <Text style={styles.switchLabel}>지평선 아래 별자리 선 표시</Text>
                <Switch
                  value={showBelowHorizonLines}
                  onValueChange={toggleShowBelowHorizonLines}
                  trackColor={{ false: '#1a2a44', true: '#2a5080' }}
                  thumbColor={showBelowHorizonLines ? '#4a80c4' : '#3a4a60'}
                />
              </View>
            </View>

            <View style={styles.bottomPad} />
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(4,8,18,0.95)',
  },
  sheetWrapper: {
    flex: 1,
  },
  sheet: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderColor: '#1a2a44',
    marginBottom: 8,
  },
  title: {
    color: '#c8d8f0',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeTxt: {
    color: '#556688',
    fontSize: 18,
  },
  sectionTitle: {
    color: '#4a6888',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#0b1220',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1a2a44',
  },
  currentLocation: {
    color: '#4a80c4',
    fontSize: 13,
    marginBottom: 14,
  },
  inputLabel: {
    color: '#4a6888',
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0f1e30',
    borderWidth: 1,
    borderColor: '#1a2a44',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#c8d8f0',
    fontSize: 14,
    marginBottom: 12,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  applyBtn: {
    flex: 1,
    backgroundColor: '#1a3a6a',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  applyBtnTxt: {
    color: '#a0c4ff',
    fontSize: 14,
    fontWeight: '600',
  },
  resetBtn: {
    flex: 1,
    backgroundColor: '#0f1e30',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a2a44',
  },
  resetBtnTxt: {
    color: '#4a6888',
    fontSize: 13,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  magValue: {
    color: '#a0c4ff',
    fontSize: 16,
    fontWeight: '600',
    minWidth: 36,
    textAlign: 'right',
  },
  slider: {
    width: '100%',
    height: 36,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  sliderLabel: {
    color: '#3a5070',
    fontSize: 10,
  },
  switchLabel: {
    color: '#c8d8f0',
    fontSize: 14,
  },
  bottomPad: {
    height: 40,
  },
});
