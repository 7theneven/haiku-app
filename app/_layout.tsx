import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { CardStyleInterpolators, createStackNavigator } from '@react-navigation/stack';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import HaikuScreen from './haiku';
import WelcomeScreen from './index';

const Stack = createStackNavigator();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    'AvenirLTStd-Light': require('../assets/fonts/AvenirLTStd-Light.otf'),
    'AvenirLTStd-Medium': require('../assets/fonts/AvenirLTStd-Medium.otf'),
    'AvenirLTStd-Roman': require('../assets/fonts/AvenirLTStd-Roman.otf'),
    Sora: require('../assets/fonts/Sora-Regular.ttf'),
    'Sora-Bold': require('../assets/fonts/Sora-Bold.ttf'),
    'Sora-SemiBold': require('../assets/fonts/Sora-SemiBold.ttf'),
    CourierPrime: require('../assets/fonts/CourierPrime-Regular.ttf'),
    'CourierPrime-Bold': require('../assets/fonts/CourierPrime-Bold.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Add notification permission request
  useEffect(() => {
    async function requestNotificationPermission() {
      console.log('Requesting notification permissions...');
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        console.log('Existing permission status:', existingStatus);
        
        const { status } = await Notifications.requestPermissionsAsync();
        console.log('New permission status:', status);
        
        if (status !== 'granted') {
          console.log('Notification permission denied');
        } else {
          console.log('Notification permission granted');
        }
      } catch (error) {
        console.error('Error requesting permissions:', error);
      }
    }

    requestNotificationPermission();
  }, []);

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen 
          name="Haiku" 
          component={HaikuScreen}
          options={{
            cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
            transitionSpec: {
              open: { animation: 'timing', config: { duration: 1000 } },
              close: { animation: 'timing', config: { duration: 100 } },
            },
          }}
        />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
