import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppText } from "@/components/ui/app-text";
import { VARIANT_TYPES } from "@/lib/constants";
import { formatUsd } from "@/lib/home/formatters";
import type { HomeWatchlistItem } from "@/types/home";
import React from "react";
import { View } from "react-native";
import { SectionHeader } from "./section-header";

type WatchlistCardProps = {
  items: HomeWatchlistItem[];
  onPressSeeAll?: () => void;
  onPressItem: (symbol: string) => void;
  compact?: boolean;
};

export function WatchlistCard({
  items,
  onPressSeeAll,
  onPressItem,
  compact = false,
}: WatchlistCardProps) {
  return (
    <View className="mx-4 mb-6">
      <SectionHeader title="Watchlist" onPressAction={onPressSeeAll} actionLabel="See all" />
      <View className="gap-3">
        {items.map((item) => (
          <AppButton
            key={item.symbol}
            variant={VARIANT_TYPES.NOT_SELECTED}
            onPress={() => onPressItem(item.symbol)}
          >
            <AppCard
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="rounded-[24px] border border-border-primary-dark bg-bg-tertiary-dark px-3.5 py-3.5"
            >
              <View className="flex-row items-start justify-between">
                <View className="min-w-0 flex-1 flex-row items-center pr-3">
                  <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl border border-border-primary-dark bg-bg-quaternary-dark">
                    <AppText
                      variant={VARIANT_TYPES.QUATERNARY}
                      className="text-[18px] text-text-primary-dark"
                    >
                      {item.symbol[0]}
                    </AppText>
                  </View>
                  <View>
                    <AppText
                      variant={VARIANT_TYPES.QUATERNARY}
                      className="text-[18px] text-text-primary-dark"
                      numberOfLines={1}
                    >
                      {item.symbol}
                    </AppText>
                    <AppText
                      variant={VARIANT_TYPES.SENARY}
                      className={`mt-0.5 text-[13px] ${
                        item.changePercent >= 0
                          ? "text-text-quaternary-dark"
                          : "text-text-senary-dark"
                      }`}
                    >
                      {item.changePercent >= 0 ? "+" : ""}
                      {item.changePercent.toFixed(2)}%
                    </AppText>
                    <View className="mt-1.5 flex-row items-center gap-3">
                      <AppText
                        variant={VARIANT_TYPES.SENARY}
                        className="text-[11px] text-text-tertiary-dark"
                      >
                        8h:{" "}
                        <AppText
                          variant={VARIANT_TYPES.SENARY}
                          className={
                            (item.funding8hPercent ?? 0) >= 0
                              ? "text-text-quaternary-dark"
                              : "text-text-senary-dark"
                          }
                        >
                          {item.funding8hPercent == null
                            ? "—"
                            : `${item.funding8hPercent >= 0 ? "+" : ""}${item.funding8hPercent.toFixed(3)}%`}
                        </AppText>
                      </AppText>
                      <AppText
                        variant={VARIANT_TYPES.SENARY}
                        className="text-[11px] text-text-tertiary-dark"
                      >
                        OI: {item.openInterest == null ? "—" : formatUsd(item.openInterest, 0)}
                      </AppText>
                    </View>
                  </View>
                </View>
                <View className="min-w-[118px] shrink-0 items-end">
                  <AppText
                    variant={VARIANT_TYPES.QUATERNARY}
                    className={`text-text-primary-dark ${compact ? "text-[16px]" : "text-[18px]"}`}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    {formatUsd(item.lastPrice, item.lastPrice >= 100 ? 0 : 2)}
                  </AppText>
                  <AppText
                    variant={VARIANT_TYPES.SENARY}
                    className="mt-1 text-[11px] text-text-tertiary-dark"
                  >
                    Vol: {item.volume24h == null ? "—" : formatUsd(item.volume24h, 0)}
                  </AppText>
                </View>
              </View>
            </AppCard>
          </AppButton>
        ))}
      </View>
    </View>
  );
}
