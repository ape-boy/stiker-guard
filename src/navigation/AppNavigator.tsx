import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '@screens/HomeScreen';
import { CheckInScreen } from '@screens/CheckInScreen';
import { AccountLockedScreen } from '@screens/AccountLockedScreen';
import { StatsScreen } from '@screens/StatsScreen';
import { SettingsScreen } from '@screens/SettingsScreen';

export type RootStackParamList = {
  Home: undefined;
  CheckIn: undefined;
  AccountLocked: undefined;
  Stats: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CheckIn" component={CheckInScreen} />
        <Stack.Screen
          name="AccountLocked"
          component={AccountLockedScreen}
          options={{
            gestureEnabled: false, // 뒤로 가기 제스처 비활성화
          }}
        />
        <Stack.Screen name="Stats" component={StatsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
