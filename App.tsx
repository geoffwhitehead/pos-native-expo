import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Root } from 'native-base';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';

// Import your existing App component from src
import { App as MainApp } from './src/App';
import { DatabaseProvider, database } from './watermelonDBModule';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Root>
            <DatabaseProvider database={database}>
              <MainApp />
            </DatabaseProvider>
            <StatusBar style="auto" />
          </Root>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

registerRootComponent(App);
