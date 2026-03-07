import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils/tailwind-configs";
import React from "react";
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { AppText } from "@/components/ui/app-text";
import { AppCard } from "@/components/ui/app-card";

const VARIANTS = {
  [VARIANT_TYPES.NOT_SELECTED]: "",
  [VARIANT_TYPES.PRIMARY]: "mx-4 mt-6 mb-6",
} as const;

type VariantKeys = keyof typeof VARIANTS;

type ActivityItem = {
  id: string;
  type: "deposit" | "withdraw" | "earn";
  vault: string;
  amount: string;
  timeAgo: string;
};

type Props = {
  variant?: VariantKeys;
  activities?: ActivityItem[];
  className?: string;
};

const ACTIVITY_CONFIG = {
  deposit: {
    icon: "arrow-down-left" as const,
    color: "#4ade80",
    bgColor: "bg-bg-quaternary-dark",
    label: "Deposited",
  },
  withdraw: {
    icon: "arrow-up-right" as const,
    color: "#f87171",
    bgColor: "bg-bg-quaternary-dark",
    label: "Withdrew",
  },
  earn: {
    icon: "dollar-sign" as const,
    color: "#4ade80",
    bgColor: "bg-bg-quaternary-dark",
    label: "Earned",
  },
};

const DEFAULT_ACTIVITIES: ActivityItem[] = [
  {
    id: "1",
    type: "deposit",
    vault: "USDC Lending",
    amount: "+$500.00",
    timeAgo: "2h ago",
  },
  {
    id: "2",
    type: "earn",
    vault: "BTC Delta Neutral",
    amount: "+$12.40",
    timeAgo: "6h ago",
  },
  {
    id: "3",
    type: "withdraw",
    vault: "ETH Momentum",
    amount: "-$200.00",
    timeAgo: "1d ago",
  },
];

export const VaultActivity: React.FC<Props> = ({
  variant = VARIANT_TYPES.PRIMARY,
  activities = DEFAULT_ACTIVITIES,
  className = "",
}) => {
  const baseClassName = VARIANTS[variant] || "";

  return (
    <View className={cn(baseClassName, className)}>
      {/* Section Header */}
      <AppText variant={VARIANT_TYPES.TERTIARY} className="text-[10px] tracking-[2.5px] mb-4">
        RECENT ACTIVITY
      </AppText>

      {/* Activity List */}
      <View className="gap-3">
        {activities.map((activity) => {
          const config = ACTIVITY_CONFIG[activity.type];
          return (
            <AppCard
              key={activity.id}
              variant={VARIANT_TYPES.QUINARY}
              className="flex-row items-center py-3.5 px-4"
            >
              {/* Icon */}
              <View
                className={cn(
                  "w-10 h-10 rounded-2xl items-center justify-center mr-3",
                  config.bgColor
                )}
              >
                <Feather name={config.icon} size={18} color={config.color} />
              </View>

              {/* Info */}
              <View className="flex-1">
                <AppText variant={VARIANT_TYPES.PRIMARY} className="font-semibold text-sm">
                  {config.label}
                </AppText>
                <AppText variant={VARIANT_TYPES.DENARY} className="text-[11px] mt-0.5">
                  {activity.vault}
                </AppText>
              </View>

              {/* Amount & Time */}
              <View className="items-end">
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className={cn(
                    "text-sm font-semibold",
                    activity.type === "withdraw"
                      ? "text-text-senary-dark"
                      : "text-text-quaternary-dark"
                  )}
                >
                  {activity.amount}
                </AppText>
                <AppText variant={VARIANT_TYPES.DENARY} className="text-[10px] mt-0.5">
                  {activity.timeAgo}
                </AppText>
              </View>
            </AppCard>
          );
        })}
      </View>
    </View>
  );
};

export default VaultActivity;
