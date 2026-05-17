import React, { useEffect } from 'react';
import {
  View, ActivityIndicator, StyleSheet, Text, BackHandler, Alert, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useGameStore } from './src/store/gameStore';
import { ScreenBackground } from './src/components/ui';
import { palette } from './src/theme';
import ErrorBoundary from './src/components/ErrorBoundary';
import HomeScreen from './src/screens/HomeScreen';
import CollectionScreen from './src/screens/CollectionScreen';
import EquipmentScreen from './src/screens/EquipmentScreen';
import LevelsScreen from './src/screens/LevelsScreen';
import BattlePrepScreen from './src/screens/BattlePrepScreen';
import BattleScreen from './src/screens/BattleScreen';
import ShopScreen from './src/screens/ShopScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';
import ArenaScreen from './src/screens/ArenaScreen';
import ForgeScreen from './src/screens/ForgeScreen';
import DailyScreen from './src/screens/DailyScreen';
import StatsScreen from './src/screens/StatsScreen';
import CodexScreen from './src/screens/CodexScreen';
import ChestScreen from './src/screens/ChestScreen';
import StrongholdScreen from './src/screens/StrongholdScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SummonScreen from './src/screens/SummonScreen';

// Where each screen routes when the user hits "back". The battle screen is
// a special case: it asks for confirmation, then forfeits to battle-prep.
const BACK_TARGET: Record<string, string | 'forfeit'> = {
  home: 'home',
  collection: 'home',
  equipment: 'home',
  levels: 'home',
  'battle-prep': 'levels',
  battle: 'forfeit',
  shop: 'home',
  achievements: 'home',
  arena: 'home',
  forge: 'home',
  daily: 'home',
  stats: 'home',
  codex: 'home',
  chests: 'home',
  stronghold: 'home',
  settings: 'home',
  summon: 'home',
};

export default function App() {
  const { currentScreen, hydrated, hydrate, setScreen, clearPlacements, forfeitBattle } = useGameStore();

  useEffect(() => {
    hydrate();
  }, []);

  // Android hardware/gesture back button. iOS users use on-screen back chips.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const target = BACK_TARGET[currentScreen];
      if (currentScreen === 'home') return false; // let the OS exit the app
      if (target === 'forfeit') {
        Alert.alert(
          'Leave battle?',
          'Forfeiting counts as a loss. Are you sure?',
          [
            { text: 'Stay', style: 'cancel' },
            {
              text: 'Forfeit', style: 'destructive', onPress: () => {
                forfeitBattle();
                clearPlacements();
                setScreen('levels');
              },
            },
          ],
        );
        return true;
      }
      // battle-prep clears placements on the way out so they don't bleed
      // into a different level.
      if (currentScreen === 'battle-prep') clearPlacements();
      setScreen(target ?? 'home');
      return true;
    });
    return () => sub.remove();
  }, [currentScreen, setScreen, clearPlacements, forfeitBattle]);

  if (!hydrated) {
    return (
      <SafeAreaProvider>
        <View style={styles.loading}>
          <ScreenBackground />
          <StatusBar style="light" />
          <Text style={styles.logo}>⚔️</Text>
          <ActivityIndicator size="large" color={palette.gold} style={{ marginTop: 16 }} />
          <Text style={styles.loadingText}>Mustering the army…</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  function renderScreen() {
    switch (currentScreen) {
      case 'home': return <HomeScreen />;
      case 'collection': return <CollectionScreen />;
      case 'equipment': return <EquipmentScreen />;
      case 'levels': return <LevelsScreen />;
      case 'battle-prep': return <BattlePrepScreen />;
      case 'battle': return <BattleScreen />;
      case 'shop': return <ShopScreen />;
      case 'achievements': return <AchievementsScreen />;
      case 'arena': return <ArenaScreen />;
      case 'forge': return <ForgeScreen />;
      case 'daily': return <DailyScreen />;
      case 'stats': return <StatsScreen />;
      case 'codex': return <CodexScreen />;
      case 'chests': return <ChestScreen />;
      case 'stronghold': return <StrongholdScreen />;
      case 'settings': return <SettingsScreen />;
      case 'summon': return <SummonScreen />;
      default: return <HomeScreen />;
    }
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <ErrorBoundary key={currentScreen} onRecover={() => setScreen('home')}>
        {renderScreen()}
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: palette.bgBot, justifyContent: 'center', alignItems: 'center' },
  logo: { fontSize: 72 },
  loadingText: { color: palette.textSoft, marginTop: 14, fontWeight: '700', letterSpacing: 1 },
});
