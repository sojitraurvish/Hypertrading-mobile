import "@/lib/polyfills";
import "@walletconnect/react-native-compat";
import "react-native-get-random-values";

import { TradeOrderDrawer } from "@/components/sections/markets/trade-order-drawer";
import { AppToast } from "@/components/ui/app-toast";
import { walletKit } from "@/lib/clients/wallet";
import { useMarketStore } from "@/store/markets";
import { useTradeOrderDrawerStore } from "@/store/trade-order-drawer";
import { AppKit, AppKitProvider } from "@reown/appkit-react-native";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";
// -------------------------------------------------
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { Stack, usePathname, useRouter } from "expo-router";
import React from "react";

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const scheme = Constants.expoConfig?.scheme ?? "app-scheme-prod";
  const lastStableRouteRef = React.useRef<string>("/");
  React.useEffect(() => {
    if (pathname !== "/") {
      lastStableRouteRef.current = pathname;
    }
  }, [pathname]);

  React.useEffect(() => {
    const subscription = Linking.addEventListener("url", ({ url }) => {
      const isAppCallback = url.startsWith(`${scheme}://`);
      if (!isAppCallback) return;

      const parsed = Linking.parse(url);
      const callbackPath = parsed.path?.trim();
      const isRootCallback = !callbackPath;
      const shouldRestoreRoute =
        isRootCallback && lastStableRouteRef.current !== "/";

      if (shouldRestoreRoute) {
        router.replace(lastStableRouteRef.current as never);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router, scheme]);

  // -------------------------------------------------

  const isTradeDrawerOpen = useTradeOrderDrawerStore((state) => state.isOpen);
  const selectedMarket = useMarketStore((state) => state.selectedMarket);
  const tradeDrawerSide = useTradeOrderDrawerStore(
    (state) => state.sideOpenWith,
  );
  const closeTradeOrderDrawer = useTradeOrderDrawerStore(
    (state) => state.closeTradeOrderDrawer,
  );
  const tradeDrawerCoin = selectedMarket?.symbol ?? null;


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppKitProvider instance={walletKit}>
        <Stack screenOptions={{ headerShown: false }} />
        <AppToast />
        {isTradeDrawerOpen && tradeDrawerCoin ? (
          <TradeOrderDrawer
            isOpen={isTradeDrawerOpen}
            onClose={closeTradeOrderDrawer}
            coin={tradeDrawerCoin}
            side={tradeDrawerSide}
          />
        ) : null}
        <View style={{ position: "absolute", height: "100%", width: "100%" }}>
          <AppKit />
        </View>
      </AppKitProvider>
    </GestureHandlerRootView>
  );
}
