import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#8E8E93",
        tabBarIcon: ({ color, size, focused }) => {
            let iconName: keyof typeof Ionicons.glyphMap = "ellipse";

            if (route.name === "HomePage") {
                iconName = focused ? "home" : "home-outline";
            } else if (route.name === "MyBookings") {
                iconName = focused ? "calendar" : "calendar-outline";
            } else if (route.name === "FeaturedYacht") {
                iconName = focused ? "star" : "star-outline";
            }

            return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="HomePage" options={{ title: "Home" }} />
      <Tabs.Screen name="MyBookings" options={{ title: "My Bookings" }} />
      <Tabs.Screen name="FeaturedYacht" options={{ title: "Featured" }} />
    </Tabs>
  );
}
