import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppText } from "@/components/ui/app-text";
import { VARIANT_TYPES } from "@/lib/constants";
import type { HomeMoverItem } from "@/types/home";
import React from "react";
import { ScrollView, View } from "react-native";
import { SectionHeader } from "./section-header";

type MoversCarouselProps = {
  title: string;
  items: HomeMoverItem[];
  onPressItem: (symbol: string) => void;
  onPressSeeAll?: () => void;
  compact?: boolean;
  cardClassName?: string;
};

export function MoversCarousel({
  title,
  items,
  onPressItem,
  onPressSeeAll,
  compact = false,
  cardClassName = "",
}: MoversCarouselProps) {
  return (
    <View className="mb-6">
      <View className="px-4">
        <SectionHeader title={title} onPressAction={onPressSeeAll} actionLabel="More" />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-4 gap-2.5"
      >
        {items.map((item) => (
          <AppButton
            key={item.symbol}
            variant={VARIANT_TYPES.NOT_SELECTED}
            onPress={() => onPressItem(item.symbol)}
          >
            <AppCard
              variant={VARIANT_TYPES.NOT_SELECTED}
              className={`rounded-[24px] border border-border-primary-dark bg-bg-tertiary-dark p-3 ${
                compact ? "h-[116px] w-[122px]" : "h-[120px] w-[128px]"
              } ${cardClassName}`}
            >
              <AppText
                variant={VARIANT_TYPES.QUINARY}
                className="text-[30px] leading-[30px] text-text-primary-dark"
              >
                {item.symbol[0]}
              </AppText>
              <AppText
                variant={VARIANT_TYPES.QUATERNARY}
                className="mt-1 text-[16px] text-text-primary-dark"
                numberOfLines={1}
              >
                {item.symbol}
              </AppText>
              <AppText
                variant={VARIANT_TYPES.SENARY}
                className={`mt-1 text-[14px] ${
                  item.changePercent >= 0
                    ? "text-text-quaternary-dark"
                    : "text-text-senary-dark"
                }`}
              >
                {item.changePercent >= 0 ? "+" : ""}
                {item.changePercent.toFixed(2)}%
              </AppText>
            </AppCard>
          </AppButton>
        ))}
      </ScrollView>
    </View>
  );
}
