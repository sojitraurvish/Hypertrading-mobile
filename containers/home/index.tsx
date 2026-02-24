import React, { useCallback } from "react";
import { ScrollView, View } from "react-native";
import { FleetCommander } from "@/components/sections/home/fleet-commander";
import { StatsCards } from "@/components/sections/home/stats-cards";
import { Watchlist } from "@/components/sections/home/watchlist";
import { AiMarketPulse } from "@/components/sections/home/ai-market-pulse";
import { LiveIntelligence } from "@/components/sections/home/live-intelligence";

// ============================================================
// All API calls and data fetching should happen in this container.
// Section components receive data as props — they are pure UI.
// Header is rendered in the tab layout so it's visible on all pages.
// ============================================================

export const HomeContainer: React.FC = () => {
  // ----------------------------------------------------------
  // Handlers (wire up API calls here)
  // ----------------------------------------------------------

  const handleNotificationPress = useCallback(() => {
    // TODO: Open notifications
  }, []);

  const handleSeeAllWatchlist = useCallback(() => {
    // TODO: Navigate to full watchlist
  }, []);

  const handleWatchlistItemPress = useCallback((item: any) => {
    // TODO: Navigate to coin detail
  }, []);

  const handleRefreshPulse = useCallback(() => {
    // TODO: Refresh AI market pulse
  }, []);

  const handleSeeMoreIntelligence = useCallback(() => {
    // TODO: Navigate to full intelligence feed
  }, []);

  const handleIntelligenceItemPress = useCallback((item: any) => {
    // TODO: Open intelligence detail
  }, []);

  // ----------------------------------------------------------
  // Mock Data (replace with API data)
  // ----------------------------------------------------------
  const statsData = [
    {
      label: "LIQUID CAPITAL",
      value: "$0.00",
      iconName: "arrow-down-left" as const,
    },
    {
      label: "SESSION PNL",
      value: "$0.00",
      iconName: "arrow-up-right" as const,
      valueColor: "text-text-quaternary-dark",
    },
  ];

  const watchlistItems = [
    {
      symbol: "BTC",
      iconLabel: "B",
      iconBgColor: "bg-bg-octonary-dark",
      changePercent: "-1.74%",
      isPositive: false,
      price: "$70,165.42",
    },
  ];

  const aiPulseContent =
    'The crypto market is currently mired in "Extreme Fear" with the sentiment index bottoming at a historical low of 5, as Bitcoin\'s failure to hold the $70,000 level has triggered a massive leverage flush and a 45% correction from its $126,000 peak. Institutional support is wavering under the weight of multi-billion dollar ETF outflows and a hawkish Fed outlook fueled by sticky inflation data, turning every minor relief rally into a "bull trap" for over-leveraged longs. Aggressive traders should eye the $60,000 support floor as the final capitulation zone; while the technical trend remains broken, this "crypto reset" is engineering a massive asymmetric entry for a predicted run to $150,000 once current retail exhaustion peaks and liquidity returns.';

  const intelligenceItems = [
    {
      id: "1",
      title: "LENDING RATE UPDATE",
      subtitle: "BTC-USDC APR: 4.82%",
      timeAgo: "2m",
      iconName: "flash" as const,
      iconColor: "#000000",
      iconBgColor: "bg-bg-octonary-dark",
    },
    {
      id: "2",
      title: "LENDING RATE UPDATE",
      subtitle: "BTC-USDC APR: 4.82%",
      timeAgo: "7m",
      iconName: "flash" as const,
      iconColor: "#000000",
      iconBgColor: "bg-bg-octonary-dark",
    },
  ];

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <View className="flex-1 bg-bg-primary-dark">
      {/* Scrollable Content */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-6"
      >
        <FleetCommander onNotificationPress={handleNotificationPress} />

        <StatsCards stats={statsData} />

        <Watchlist
          items={watchlistItems}
          onSeeAll={handleSeeAllWatchlist}
          onItemPress={handleWatchlistItemPress}
        />

        <AiMarketPulse
          content={aiPulseContent}
          onRefresh={handleRefreshPulse}
        />

        <LiveIntelligence
          items={intelligenceItems}
          onSeeMore={handleSeeMoreIntelligence}
          onItemPress={handleIntelligenceItemPress}
        />
      </ScrollView>
    </View>
  );
};

export default HomeContainer;
