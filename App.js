import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { theme } from './src/theme';

import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ConsentScreen from './src/screens/ConsentScreen';
import CaptureScreen from './src/screens/CaptureScreen';
import ResultScreen from './src/screens/ResultScreen';
import QuestionnaireScreen from './src/screens/QuestionnaireScreen';
import DoneScreen from './src/screens/DoneScreen';
import RecordsScreen from './src/screens/RecordsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.ink },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: theme.bg },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Caries Screening' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
        <Stack.Screen name="Records" component={RecordsScreen} options={{ title: 'Records' }} />
        <Stack.Screen name="Consent" component={ConsentScreen} options={{ title: 'Consent' }} />
        <Stack.Screen name="Capture" component={CaptureScreen} options={{ title: 'Capture image' }} />
        <Stack.Screen name="Result" component={ResultScreen} options={{ title: 'AI reference output' }} />
        <Stack.Screen name="Questionnaire" component={QuestionnaireScreen} options={{ title: 'Questionnaire' }} />
        <Stack.Screen name="Done" component={DoneScreen} options={{ title: 'Complete', headerBackVisible: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
