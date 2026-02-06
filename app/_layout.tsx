import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { Platform, View } from "react-native";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useColorScheme } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from 'expo-navigation-bar';
import { useEffect } from "react";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { updateActivity } = useAutoLogout();

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('overlay-swipe');
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View
        style={{ flex: 1 }}
        onTouchStart={updateActivity}
        onTouchMove={updateActivity}
      >
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
      </View>
    </GestureHandlerRootView>
  );
}
