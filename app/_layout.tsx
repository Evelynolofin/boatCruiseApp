import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import * as NavigationBar from 'expo-navigation-bar';

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useEffect } from "react";
import { Platform } from "react-native";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('overlay-swipe');
    }
  }, []);

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { flex: 1 },
          animation: "fade",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth/Login" />
        <Stack.Screen name="auth/CreateAccount" />
        <Stack.Screen name="auth/ForgetPassword" />
        <Stack.Screen name="auth/Verification" />
        <Stack.Screen name="BookingPage" />
        <Stack.Screen name="BookingDetails" />
        <Stack.Screen name="YachtDetails" />
        <Stack.Screen name="UserProfile" />
      </Stack>

      <StatusBar
        style="dark"
        translucent={false}
        backgroundColor="#ffffff"
      />
    </ThemeProvider>
  );
}