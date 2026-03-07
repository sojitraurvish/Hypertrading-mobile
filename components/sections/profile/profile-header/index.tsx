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
  [VARIANT_TYPES.PRIMARY]: "mx-4 mt-4",
} as const;

type VariantKeys = keyof typeof VARIANTS;

type Props = {
  variant?: VariantKeys;
  memberSince?: string;
  onEditPress?: () => void;
  className?: string;
};

export const ProfileHeader: React.FC<Props> = ({
  variant = VARIANT_TYPES.PRIMARY,
  memberSince = "Feb 2026",
  onEditPress,
  className = "",
}) => {
  const baseClassName = VARIANTS[variant] || "";

  const displayName = "Guest";
  const statusText = "Not Connected";
  const statusColor = "text-accent-green";

  return (
    <View className={cn(baseClassName, className)}>
      <AppCard variant={VARIANT_TYPES.TERTIARY}>
        <View className="flex-row items-center">
          <View className="w-16 h-16 rounded-3xl bg-accent-green items-center justify-center mr-4">
            <Feather
              name="user"
              size={28}
              color="#000000"
            />
          </View>

          <View className="flex-1">
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="text-text-primary-dark text-lg font-bold"
            >
              {displayName}
            </AppText>
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className={`text-xs mt-0.5 ${statusColor}`}
            >
              {statusText}
            </AppText>
          </View>

          <AppButton
            variant={VARIANT_TYPES.QUATERNARY}
            className="w-10 h-10 items-center justify-center bg-bg-quaternary-dark rounded-2xl border border-border-primary-dark/20"
            onPress={onEditPress}
          >
            <Feather name="edit-2" size={16} color="#6b7280" />
          </AppButton>
        </View>
      </AppCard>
    </View>
  );
};

export default ProfileHeader;
