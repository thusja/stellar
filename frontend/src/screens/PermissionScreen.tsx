import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { useObserverStore } from '../stores/observerStore';

interface Props {
  onComplete: () => void;
}

export default function PermissionScreen({ onComplete }: Props) {
  const [requesting, setRequesting] = useState(false);
  const { setLocation, setDefaultLocation } = useObserverStore();

  const handleAllow = async () => {
    setRequesting(true);
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status === 'granted') {
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(loc.coords.latitude, loc.coords.longitude, '현재 위치');
      } catch {
        setDefaultLocation();
      }
    } else {
      setDefaultLocation();
    }
    onComplete();
  };

  const handleSkip = () => {
    setDefaultLocation();
    onComplete();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📍</Text>
      <Text style={styles.title}>현재 위치가 필요해요</Text>
      <Text style={styles.description}>
        정확한 밤하늘을 보려면{'\n'}현재 위치 정보가 사용됩니다.
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleAllow} disabled={requesting}>
        {requesting ? (
          <ActivityIndicator color="#05060f" />
        ) : (
          <Text style={styles.buttonText}>위치 허용하기</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>건너뛰기 (기본 위치 사용)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05060f',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  icon: {
    fontSize: 48,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#e8f0ff',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#8899bb',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 48,
  },
  button: {
    backgroundColor: '#a0c4ff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#05060f',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    padding: 12,
  },
  skipText: {
    color: '#556688',
    fontSize: 14,
  },
});
