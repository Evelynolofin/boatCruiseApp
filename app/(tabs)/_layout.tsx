import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View } from "react-native";

type TabRoute = "HomePage" | "MyBookings" | "FeaturedYacht";

export default function TabLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,

          tabBarActiveTintColor: "#007AFF",
          tabBarInactiveTintColor: "#8E8E93",

          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            borderTopColor: "#E5E5E5",
            height: 60,
            paddingBottom: 6,
          },

          tabBarBackground: () => (
            <View style={{ flex: 1, backgroundColor: "#FFFFFF" }} />
          ),

          tabBarIcon: ({ color, size, focused }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            switch (route.name as TabRoute) {
              case "HomePage":
                iconName = focused ? "home" : "home-outline";
                break;
              case "MyBookings":
                iconName = focused ? "calendar" : "calendar-outline";
                break;
              case "FeaturedYacht":
                iconName = focused ? "star" : "star-outline";
                break;
              default:
                iconName = "ellipse";
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tabs.Screen name="HomePage" options={{ title: "Home" }} />
        <Tabs.Screen name="MyBookings" options={{ title: "My Bookings" }} />
        <Tabs.Screen name="FeaturedYacht" options={{ title: "Featured" }} />
      </Tabs>
    </GestureHandlerRootView>
  );
}
