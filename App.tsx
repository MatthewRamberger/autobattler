import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useGameStore } from './src/store/gameStore';
import HomeScreen from './src/screens/HomeScreen';
import CollectionScreen from './src/screens/CollectionScreen';
import EquipmentScreen from './src/screens/EquipmentScreen';
import LevelsScreen from './src/screens/LevelsScreen';
import BattlePrepScreen from './src/screens/BattlePrepScreen';
import BattleScreen from './src/screens/BattleScreen';

export default function App() {
  const { currentScreen } = useGameStore();

  function renderScreen() {
    switch (currentScreen) {
      case 'home': return <HomeScreen />;
      case 'collection': return <CollectionScreen />;
      case 'equipment': return <EquipmentScreen />;
      case 'levels': return <LevelsScreen />;
      case 'battle-prep': return <BattlePrepScreen />;
      case 'battle': return <BattleScreen />;
      default: return <HomeScreen />;
    }
  }

  return (
    <>
      <StatusBar style="light" />
      {renderScreen()}
    </>
  );
}
