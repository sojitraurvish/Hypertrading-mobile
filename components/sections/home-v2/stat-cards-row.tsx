import { AppCard } from "@/components/ui/app-card";
import { AppText } from "@/components/ui/app-text";
import { VARIANT_TYPES } from "@/lib/constants";
import type { HomeStatCard } from "@/types/home";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";
import { HOME_V2_COLORS } from "./theme";

type StatCardsRowProps = {
  cards: HomeStatCard[];
  compact?: boolean;
};

export function StatCardsRow({ cards, compact = false }: StatCardsRowProps) {
  return (
    <View className="mx-4 mb-6 flex-row gap-3">
      {cards.map((card) => {
        const iconColor =
          card.tone === "positive"
            ? HOME_V2_COLORS.positive
            : card.tone === "negative"
              ? HOME_V2_COLORS.negative
              : HOME_V2_COLORS.muted;
        const valueClassName =
          card.tone === "negative" ? "text-text-senary-dark" : "text-text-primary-dark";
        return (
          <AppCard
            key={card.id}
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="flex-1 rounded-[28px] border border-border-primary-dark/20 bg-bg-tertiary-dark p-4"
          >
            <View className="mb-3 h-10 w-10 items-center justify-center rounded-xl bg-bg-quaternary-dark">
              <Feather
                name={card.tone === "negative" ? "arrow-up-right" : "arrow-down-left"}
                size={16}
                color={iconColor}
              />
            </View>
            <AppText
              variant={VARIANT_TYPES.NONARY}
              className="text-[9px] tracking-[2.5px] text-text-tertiary-dark"
            >
              {card.label}
            </AppText>
            <AppText
              variant={VARIANT_TYPES.QUINARY}
              className={`${compact ? "mt-1 text-[34px] leading-[38px]" : "mt-1 text-[38px] leading-[42px]"} ${valueClassName}`}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
            >
              {card.value}
            </AppText>
            {card.changeLabel ? (
              <AppText variant={VARIANT_TYPES.SENARY} className="mt-1 text-text-senary-dark">
                {card.changeLabel}
              </AppText>
            ) : null}
          </AppCard>
        );
      })}
    </View>
  );
}
