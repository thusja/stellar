import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import SplashScreen from './src/screens/SplashScreen';
import PermissionScreen from './src/screens/PermissionScreen';
import StarMapScreen from './src/screens/StarMapScreen';
import NightGuideScreen from './src/screens/NightGuideScreen';

type AppScreen = 'splash' | 'permission' | 'starmap' | 'nightguide';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('splash');

  const handleSplashReady = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status === 'granted') {
      setScreen('starmap');
    } else {
      setScreen('permission');
    }
  };

  if (screen === 'splash') {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <SplashScreen onReady={handleSplashReady} />
      </SafeAreaProvider>
    );
  }

  if (screen === 'permission') {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <PermissionScreen onComplete={() => setScreen('starmap')} />
      </SafeAreaProvider>
    );
  }

  if (screen === 'nightguide') {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <NightGuideScreen onBack={() => setScreen('starmap')} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={styles.appContainer}>
        <View style={styles.content}>
          <StarMapScreen />
        </View>
        <SafeAreaView edges={['bottom']} style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, styles.tabActive]}
            onPress={() => setScreen('starmap')}
          >
            <Text style={styles.tabIconActive}>🗺️</Text>
            <Text style={styles.tabLabelActive}>성도</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setScreen('nightguide')}
          >
            <Text style={styles.tabIcon}>🌙</Text>
            <Text style={styles.tabLabel}>오늘 밤</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#040812',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#080f1e',
    borderTopWidth: 1,
    borderColor: '#1a2a44',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    gap: 2,
  },
  tabActive: {
    borderTopWidth: 2,
    borderTopColor: '#4a80c4',
  },
  tabIcon: {
    fontSize: 18,
    opacity: 0.5,
  },
  tabIconActive: {
    fontSize: 18,
    color: '#a0c4ff',
  },
  tabLabel: {
    color: '#3a5070',
    fontSize: 11,
  },
  tabLabelActive: {
    color: '#a0c4ff',
    fontSize: 11,
  },
});
