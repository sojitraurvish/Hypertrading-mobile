import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils/tailwind-configs";
import React from "react";
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { AppText } from "@/components/ui/app-text";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";

const VARIANTS = {
  [VARIANT_TYPES.NOT_SELECTED]: "",
  [VARIANT_TYPES.PRIMARY]: "mx-4 mt-6",
} as const;

type VariantKeys = keyof typeof VARIANTS;

export type SettingsItem = {
  id: string;
  label: string;
  subtitle?: string;
  iconName: keyof typeof Feather.glyphMap;
  iconColor?: string;
  hasChevron?: boolean;
};

type Props = {
  variant?: VariantKeys;
  items?: SettingsItem[];
  onItemPress?: (item: SettingsItem) => void;
  className?: string;
};

const DEFAULT_ITEMS: SettingsItem[] = [
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

export const SettingsList: React.FC<Props> = ({
  variant = VARIANT_TYPES.PRIMARY,
  items = DEFAULT_ITEMS,
  onItemPress,
  className = "",
}) => {
  const baseClassName = VARIANTS[variant] || "";

  return (
    <View className={cn(baseClassName, className)}>
      {/* Section Header */}
      <AppText variant={VARIANT_TYPES.TERTIARY} className="text-[10px] tracking-[2.5px] mb-4">
        SETTINGS
      </AppText>

      <AppCard variant={VARIANT_TYPES.OCTONARY} className="p-0 overflow-hidden">
        {items.map((item, index) => (
          <AppButton
            key={item.id}
            variant={VARIANT_TYPES.NOT_SELECTED}
            className={cn(
              "flex-row items-center px-4 py-4",
              index < items.length - 1 && "border-b border-border-primary-dark/15"
            )}
            onPress={() => onItemPress?.(item)}
          >
            {/* Icon */}
            <View className="w-9 h-9 rounded-xl items-center justify-center bg-bg-quaternary-dark mr-3">
              <Feather
                name={item.iconName}
                size={16}
                color={item.iconColor || "#6b7280"}
              />
            </View>

            {/* Label & Subtitle */}
            <View className="flex-1">
              <AppText variant={VARIANT_TYPES.PRIMARY} className="text-sm font-medium">
                {item.label}
              </AppText>
              {item.subtitle && (
                <AppText variant={VARIANT_TYPES.DENARY} className="text-[11px] mt-0.5">
                  {item.subtitle}
                </AppText>
              )}
            </View>

            {/* Chevron */}
            {item.hasChevron && (
              <Feather name="chevron-right" size={16} color="#4b5563" />
            )}
          </AppButton>
        ))}
      </AppCard>
    </View>
  );
};

export default SettingsList;
