import "@/lib/polyfills";
import "@walletconnect/react-native-compat";
import "react-native-get-random-values";

import { AppToast } from "@/components/ui/app-toast";
import { walletKit } from "@/lib/clients/wallet";
import { AppKit, AppKitProvider } from "@reown/appkit-react-native";
import { Stack } from "expo-router";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppKitProvider instance={walletKit}>
        <Stack screenOptions={{ headerShown: false }} />
        <AppToast />
        <View style={{ position: "absolute", height: "100%", width: "100%" }}>
          <AppKit />
        </View>
      </AppKitProvider>
    </GestureHandlerRootView>
  );
}
