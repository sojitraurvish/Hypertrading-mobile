import React, { useCallback } from "react";
import { ScrollView, View } from "react-native";
import { ProfileHeader } from "@/components/sections/profile/profile-header";
import { WalletStatus } from "@/components/sections/profile/wallet-status";
import { AccountStats } from "@/components/sections/profile/account-stats";
import { SettingsList } from "@/components/sections/profile/settings-list";
import { AppInfo } from "@/components/sections/profile/app-info";
import type { SettingsItem } from "@/components/sections/profile/settings-list";

export const ProfileContainer: React.FC = () => {
  const handleEditPress = useCallback(() => {
    // TODO: Open profile edit modal
  }, []);

  const handleSettingsItemPress = useCallback((item: SettingsItem) => {
    // TODO: Navigate to specific settings page
  }, []);

  const handleTermsPress = useCallback(() => {
    // TODO: Open terms of service
  }, []);

  const handlePrivacyPress = useCallback(() => {
    // TODO: Open privacy policy
  }, []);

  const accountStats = [
    {
      label: "TOTAL TRADES",
      value: "0",
      iconName: "activity" as const,
    },
    {
      label: "WIN RATE",
      value: "0%",
      iconName: "target" as const,
      valueColor: "text-text-quaternary-dark",
    },
    {
      label: "TOTAL PNL",
      value: "$0.00",
      iconName: "trending-up" as const,
    },
  ];

  const settingsItems: SettingsItem[] = [
    {
      id: "notifications",
      label: "Notifications",
      subtitle: "Price alerts & updates",
      iconName: "bell",
      hasChevron: true,
    },
    {
      id: "security",
      label: "Security",
      subtitle: "Biometrics & PIN",
      iconName: "shield",
      hasChevron: true,
    },
    {
      id: "preferences",
      label: "Preferences",
      subtitle: "Currency, language & display",
      iconName: "sliders",
      hasChevron: true,
    },
    {
      id: "network",
      label: "Network",
      subtitle: "RPC & chain settings",
      iconName: "globe",
      hasChevron: true,
    },
    {
      id: "export",
      label: "Export History",
      subtitle: "Download trade history as CSV",
      iconName: "download",
      hasChevron: true,
    },
    {
      id: "help",
      label: "Help & Support",
      subtitle: "FAQ, docs & contact",
      iconName: "help-circle",
      hasChevron: true,
    },
  ];

  return (
    <View className="flex-1 bg-bg-primary-dark">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-6"
      >
        <ProfileHeader onEditPress={handleEditPress} />

        <WalletStatus />

        <AccountStats stats={accountStats} />

        <SettingsList
          items={settingsItems}
          onItemPress={handleSettingsItemPress}
        />

        <AppInfo
          onTermsPress={handleTermsPress}
          onPrivacyPress={handlePrivacyPress}
        />
      </ScrollView>
    </View>
  );
};

export default ProfileContainer;
