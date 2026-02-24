import "@/lib/polyfills";
import "@walletconnect/react-native-compat";
import "react-native-get-random-values";

import { Stack } from "expo-router";
import { View } from "react-native";
import { AppKitProvider, AppKit } from "@reown/appkit-react-native";
import { walletKit } from "@/lib/clients/wallet";
import "../global.css";

export default function RootLayout() {
  return (
    <AppKitProvider instance={walletKit}>
      <Stack screenOptions={{ headerShown: false }} />
      <View style={{ position: "absolute", height: "100%", width: "100%" }}>
        <AppKit />
      </View>
    </AppKitProvider>
  );
}
