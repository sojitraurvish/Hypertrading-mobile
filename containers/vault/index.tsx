import React, { useCallback } from "react";
import { ScrollView, View } from "react-native";
import { VaultHeader } from "@/components/sections/vault/vault-header";
import { VaultSummary } from "@/components/sections/vault/vault-summary";
import { VaultStrategies } from "@/components/sections/vault/vault-strategies";
import { VaultActivity } from "@/components/sections/vault/vault-activity";
import type { StrategyItem } from "@/components/sections/vault/vault-strategies";

// ============================================================
// All API calls and data fetching should happen in this container.
// Section components receive data as props — they are pure UI.
// ============================================================

export const VaultContainer: React.FC = () => {
  // ----------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------
  const handleInfoPress = useCallback(() => {
    // TODO: Open vault info/docs
  }, []);

  const handleStrategyPress = useCallback((strategy: StrategyItem) => {
    // TODO: Navigate to vault detail / deposit flow
  }, []);

  // ----------------------------------------------------------
  // Mock Data (replace with API data)
  // ----------------------------------------------------------
  const summaryData = {
    totalDeposited: "$0.00",
    totalEarned: "$0.00",
    activeVaults: 0,
  };

  const strategies: StrategyItem[] = [
    {
      id: "1",
      name: "USDC Lending",
      description: "Earn yield by lending USDC to traders",
      apy: "8.42%",
      tvl: "$12.4M",
      risk: "Low",
      iconName: "dollar-sign",
    },
    {
      id: "2",
      name: "BTC Delta Neutral",
      description: "Market-neutral strategy on BTC perpetuals",
      apy: "15.8%",
      tvl: "$5.2M",
      risk: "Medium",
      iconName: "shield",
    },
    {
      id: "3",
      name: "ETH Momentum",
      description: "Algorithmic trend-following on ETH",
      apy: "24.6%",
      tvl: "$3.1M",
      risk: "High",
      iconName: "zap",
    },
    {
      id: "4",
      name: "Multi-Asset Yield",
      description: "Diversified yield across top assets",
      apy: "11.2%",
      tvl: "$8.7M",
      risk: "Low",
      iconName: "pie-chart",
    },
  ];

  const recentActivity = [
    {
      id: "1",
      type: "deposit" as const,
      vault: "USDC Lending",
      amount: "+$500.00",
      timeAgo: "2h ago",
    },
    {
      id: "2",
      type: "earn" as const,
      vault: "BTC Delta Neutral",
      amount: "+$12.40",
      timeAgo: "6h ago",
    },
    {
      id: "3",
      type: "withdraw" as const,
      vault: "ETH Momentum",
      amount: "-$200.00",
      timeAgo: "1d ago",
    },
  ];

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <View className="flex-1 bg-bg-primary-dark">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-6"
      >
        <VaultHeader onInfoPress={handleInfoPress} />

        <VaultSummary
          totalDeposited={summaryData.totalDeposited}
          totalEarned={summaryData.totalEarned}
          activeVaults={summaryData.activeVaults}
        />

        <VaultStrategies
          strategies={strategies}
          onStrategyPress={handleStrategyPress}
        />

        <VaultActivity activities={recentActivity} />
      </ScrollView>
    </View>
  );
};

export default VaultContainer;
