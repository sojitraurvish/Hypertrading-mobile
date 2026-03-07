import { AppCard } from "@/components/ui/app-card";
import { VARIANT_TYPES } from "@/lib/constants";
import React from "react";
import { View } from "react-native";

export function HomeLoadingState() {
  return (
    <View className="px-4 pt-4">
      <AppCard
        variant={VARIANT_TYPES.NOT_SELECTED}
        className="mb-4 h-44 rounded-[30px] border border-border-primary-dark/20 bg-bg-tertiary-dark"
      />
      <View className="mb-4 flex-row gap-3">
        <AppCard
          variant={VARIANT_TYPES.NOT_SELECTED}
          className="h-36 flex-1 rounded-[28px] border border-border-primary-dark/20 bg-bg-tertiary-dark"
        />
        <AppCard
          variant={VARIANT_TYPES.NOT_SELECTED}
          className="h-36 flex-1 rounded-[28px] border border-border-primary-dark/20 bg-bg-tertiary-dark"
        />
      </View>
      <AppCard
        variant={VARIANT_TYPES.NOT_SELECTED}
        className="mb-4 h-52 rounded-[30px] border border-border-primary-dark/20 bg-bg-tertiary-dark"
      />
      <AppCard
        variant={VARIANT_TYPES.NOT_SELECTED}
        className="mb-4 h-40 rounded-[30px] border border-border-primary-dark/20 bg-bg-tertiary-dark"
      />
    </View>
  );
}
