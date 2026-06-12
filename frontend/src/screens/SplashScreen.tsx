import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { useObserverStore } from '../stores/observerStore';

interface Props {
  onReady: () => void;
}

export default function SplashScreen({ onReady }: Props) {
  const [status, setStatus] = useState('initializing');
  const { setLocation, setDefaultLocation } = useObserverStore();

  useEffect(() => {
    const init = async () => {
      const { status: permStatus } = await Location.getForegroundPermissionsAsync();

      if (permStatus === 'granted') {
        try {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setLocation(loc.coords.latitude, loc.coords.longitude, '현재 위치');
        } catch {
          setDefaultLocation();
        }
        setTimeout(onReady, 500);
      } else {
        setTimeout(onReady, 1500);
      }
    };

    init();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.star}>★</Text>
      <Text style={styles.title}>STELLAR</Text>
      <ActivityIndicator style={styles.loader} color="#a0c4ff" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05060f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: {
    fontSize: 48,
    color: '#a0c4ff',
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: '#e8f0ff',
    letterSpacing: 12,
  },
  loader: {
    marginTop: 40,
  },
});
