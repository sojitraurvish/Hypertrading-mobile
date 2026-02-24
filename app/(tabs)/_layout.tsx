import { Tabs } from "expo-router";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HomeHeader } from "@/components/sections/home/header";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-bg-primary-dark" style={{ paddingTop: insets.top }}>
      {/* Sticky Header */}
      <HomeHeader />

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#000000",
            borderTopColor: "#1f1f28",
            borderTopWidth: 1,
            height: 70 + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 8,
          },
          tabBarActiveTintColor: "#50fa7b",
          tabBarInactiveTintColor: "#6b7280",
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "600",
            letterSpacing: 1,
            textTransform: "uppercase",
            marginTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="markets"
          options={{
            title: "Markets",
            tabBarIcon: ({ color, size }) => (
              <Feather name="bar-chart-2" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="vault"
          options={{
            title: "Vault",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="shield-outline" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={22} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
