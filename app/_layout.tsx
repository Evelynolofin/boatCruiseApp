import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";

export default function RootLayout() {
  const colorScheme = useColorScheme();

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