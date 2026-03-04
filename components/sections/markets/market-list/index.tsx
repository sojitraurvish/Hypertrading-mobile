import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppText } from "@/components/ui/app-text";
import { getCoinIconUrls } from "@/lib/config";
import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils/tailwind-configs";
import type { MarketItem } from "@/types/markets";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  LayoutAnimation,
  Platform,
  RefreshControl,
  View,
} from "react-native";

const VARIANTS = {
  [VARIANT_TYPES.NOT_SELECTED]: "",
  [VARIANT_TYPES.PRIMARY]: "mx-4 mt-4",
} as const;

type VariantKeys = keyof typeof VARIANTS;

type Props = {
  variant?: VariantKeys;
  items?: MarketItem[];
  expandAll?: boolean;
  onItemPress?: (item: MarketItem) => void;
  onFavoriteToggle?: (pair: string, nextIsFavorite: boolean) => void;
  className?: string;
  isRefreshing?: boolean;
  onRefresh?: () => void;
};

const DetailCell: React.FC<{
  label: string;
  value: string;
  valueColor?: string;
}> = ({ label, value, valueColor = "text-text-primary-dark" }) => (
  <View className="flex-1 bg-bg-tertiary-dark rounded-lg px-3 py-2">
    <AppText
      variant={VARIANT_TYPES.NOT_SELECTED}
      className="text-text-octonary-dark text-[9px] uppercase tracking-wider mb-1"
    >
      {label}
    </AppText>
    <AppText
      variant={VARIANT_TYPES.NOT_SELECTED}
      className={cn("text-[12px] font-semibold", valueColor)}
      numberOfLines={1}
    >
      {value}
    </AppText>
  </View>
);

const CoinIcon: React.FC<{ item: MarketItem }> = memo(({ item }) => {
  const iconUris = useMemo(() => getCoinIconUrls(item.symbol), [item.symbol]);
  const [iconIndex, setIconIndex] = useState(0);
  const [showFallbackLabel, setShowFallbackLabel] = useState(false);
  const iconUri = iconUris[iconIndex] ?? "";

  useEffect(() => {
    setIconIndex(0);
    setShowFallbackLabel(false);
  }, [item.symbol, iconUris.length]);

  const handleIconError = () => {
    if (iconIndex < iconUris.length - 1) {
      setIconIndex((prev) => prev + 1);
      return;
    }
    setShowFallbackLabel(true);
  };

  return (
    <View
      className={cn(
        "w-11 h-11 rounded-full items-center justify-center overflow-hidden",
        item.iconBgColor,
      )}
    >
      {!showFallbackLabel && iconUri ? (
        <Image
          source={{ uri: iconUri }}
          style={{ width: 44, height: 44 }}
          onError={handleIconError}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={120}
        />
      ) : (
        <AppText
          variant={VARIANT_TYPES.NOT_SELECTED}
          className="text-white font-bold text-base"
        >
          {item.iconLabel}
        </AppText>
      )}
    </View>
  );
});

const MarketCard: React.FC<{
  item: MarketItem;
  expandAll?: boolean;
  onItemPress?: (item: MarketItem) => void;
  onFavoriteToggle?: (pair: string, nextIsFavorite: boolean) => void;
}> = memo(({ item, expandAll = false, onItemPress, onFavoriteToggle }) => {
  const [localExpanded, setLocalExpanded] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [optimisticFavorite, setOptimisticFavorite] = useState(
    item.isFavorite ?? false,
  );
  const expanded = expandAll || localExpanded;

  useEffect(() => {
    setOptimisticFavorite(item.isFavorite ?? false);
  }, [item.isFavorite]);

  const toggleExpanded = () => {
    if (Platform.OS === "ios") {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setLocalExpanded((prev) => !prev);
  };

  const changeColor = item.isPositive
    ? "text-text-quaternary-dark"
    : "text-text-senary-dark";
  const fundingColor =
    item.funding8hour == null
      ? "text-text-primary-dark"
      : item.funding8hour >= 0
        ? "text-text-quaternary-dark"
        : "text-text-senary-dark";
  const fundingRateColor =
    item.fundingPer == null
      ? "text-text-primary-dark"
      : item.fundingPer >= 0
        ? "text-text-quaternary-dark"
        : "text-text-senary-dark";
  const full24hChange =
    item.priceChange === "—" || item.changePercent === "—"
      ? item.changePercent
      : `${item.priceChange} / ${item.changePercent}`;

  return (
    <AppButton
      variant={VARIANT_TYPES.NOT_SELECTED}
      onPress={() => {
        setIsPressed(false);
        onItemPress?.(item);
      }}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
    >
      <AppCard
        variant={VARIANT_TYPES.SECONDARY}
        className={cn(
          "py-3.5 px-4 rounded-2xl border",
          isPressed
            ? "bg-bg-tertiary-dark border-border-secondary-dark"
            : "border-border-primary-dark/80",
        )}
      >
        {/* Top Row */}
        <View className="flex-row items-center">
          {/* Coin Icon + Favorite Badge */}
          <AppButton
            variant={VARIANT_TYPES.NOT_SELECTED}
            onPress={(e) => {
              e.stopPropagation();
              const nextIsFavorite = !optimisticFavorite;
              setOptimisticFavorite(nextIsFavorite);
              requestAnimationFrame(() => {
                onFavoriteToggle?.(item.pair, nextIsFavorite);
              });
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="mr-3"
          >
            <CoinIcon item={item} />
            <View
              className={cn(
                "absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full items-center justify-center border-2 border-bg-quaternary-dark",
                optimisticFavorite ? "bg-bg-senary-dark" : "bg-bg-tertiary-dark",
              )}
            >
              <Ionicons
                name={optimisticFavorite ? "star" : "star-outline"}
                size={10}
                color={optimisticFavorite ? "#000000" : "#6b7280"}
              />
            </View>
          </AppButton>

          {/* Symbol + Leverage */}
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              <AppText
                variant={VARIANT_TYPES.PRIMARY}
                className="font-bold text-[15px]"
              >
                {item.pair}
              </AppText>
              <View className="bg-bg-senary-dark/15 px-1.5 py-0.5 rounded-md">
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="text-text-quaternary-dark text-[10px] font-bold"
                >
                  {item.leverage}
                </AppText>
              </View>
            </View>
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="text-text-octonary-dark text-[10px] mt-1"
            >
              VOL: {item.volume}
            </AppText>
          </View>

          {/* Price & Change */}
          <View className="items-end mr-2.5">
            <AppText
              variant={VARIANT_TYPES.PRIMARY}
              className="font-bold text-[15px]"
            >
              {item.price}
            </AppText>
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className={cn("text-[11px] font-semibold mt-0.5", changeColor)}
            >
              {full24hChange}
            </AppText>
          </View>

          {/* Chevron */}
          <AppButton
            variant={VARIANT_TYPES.NOT_SELECTED}
            onPress={toggleExpanded}
            className="w-8 h-8 items-center justify-center rounded-lg bg-bg-tertiary-dark"
          >
            <Feather
              name={expanded ? "chevron-up" : "chevron-down"}
              size={16}
              color="#6b7280"
            />
          </AppButton>
        </View>

        {/* Expanded Details */}
        {expanded && (
          <View className="mt-3 pt-3 border-t border-border-primary-dark">
            <View className="flex-row gap-2 mb-2">
              <DetailCell label="LAST PRICE" value={item.price} />
              <DetailCell label="MARK" value={item.mark} />
              <DetailCell label="ORACLE" value={item.oracle} />
            </View>
            <View className="flex-row gap-2 mb-2">
              <DetailCell
                label="24H CHANGE"
                value={`${item.priceChange} / ${item.changePercent}`}
                valueColor={changeColor}
              />
              <DetailCell label="OPEN INTEREST" value={item.openInterest} />
              <DetailCell label="24H VOLUME" value={item.volume24h} />
            </View>
            <View className="flex-row gap-2">
              <View className="flex-1 min-w-0 bg-bg-tertiary-dark rounded-lg px-3 py-2">
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="text-text-octonary-dark text-[8px] uppercase tracking-wide mb-1"
                  numberOfLines={1}
                >
                  FUNDING (1H) / COUNTDOWN
                </AppText>
                <View className="flex-row items-center gap-2">
                  <AppText
                    variant={VARIANT_TYPES.NOT_SELECTED}
                    className={cn(
                      "text-[11px] font-semibold",
                      fundingRateColor,
                    )}
                    numberOfLines={1}
                  >
                    {item.fundingDisplay}
                  </AppText>
                  <AppText
                    variant={VARIANT_TYPES.NOT_SELECTED}
                    className="text-[10px] font-semibold text-text-primary-dark"
                    numberOfLines={1}
                  >
                    {item.fundingCountdown}
                  </AppText>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <DetailCell
                  label="8H FUNDING"
                  value={item.funding8hourDisplay}
                  valueColor={fundingColor}
                />
              </View>
            </View>
          </View>
        )}
      </AppCard>
    </AppButton>
  );
});

export const MarketList: React.FC<Props> = ({
  variant = VARIANT_TYPES.PRIMARY,
  items = [],
  expandAll = false,
  onItemPress,
  onFavoriteToggle,
  className = "",
  isRefreshing = false,
  onRefresh,
}) => {
  const listRef = React.useRef<FlatList<MarketItem>>(null);
  const [showScrollActions, setShowScrollActions] = useState(false);
  const baseClassName = VARIANTS[variant] || "";
  const keyExtractor = useCallback((item: MarketItem) => item.pair, []);
  const handleScrollStart = useCallback(() => {
    setShowScrollActions(true);
  }, []);
  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);
  const scrollToBottom = useCallback(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, []);
  const renderItem = useCallback(
    ({ item }: { item: MarketItem }) => (
      <MarketCard
        item={item}
        expandAll={expandAll}
        onItemPress={onItemPress}
        onFavoriteToggle={onFavoriteToggle}
      />
    ),
    [expandAll, onFavoriteToggle, onItemPress],
  );

  useEffect(() => {
    const prefetchUris = Array.from(
      new Set(
        items
          .slice(0, 30)
          .flatMap((item) => getCoinIconUrls(item.symbol))
          .filter(Boolean),
      ),
    );

    if (prefetchUris.length > 0) {
      void Image.prefetch(prefetchUris, "memory-disk");
    }
  }, [items]);

  return (
    <View className="flex-1 relative">
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={keyExtractor}
        contentContainerClassName={cn(baseClassName, className, "gap-3 pb-28")}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={11}
        updateCellsBatchingPeriod={16}
        removeClippedSubviews={false}
        onScrollBeginDrag={handleScrollStart}
        onMomentumScrollBegin={handleScrollStart}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#50fa7b"
            />
          ) : undefined
        }
        ListEmptyComponent={
          <View className="mx-4 mt-4">
            <AppCard
              variant={VARIANT_TYPES.SECONDARY}
              className="py-4 px-4 rounded-2xl border border-border-primary-dark"
            >
              <AppText
                variant={VARIANT_TYPES.NOT_SELECTED}
                className="text-text-tertiary-dark text-center"
              >
                No market data available right now.
              </AppText>
            </AppCard>
          </View>
        }
        renderItem={renderItem}
      />

      {showScrollActions && items.length > 0 ? (
        <View className="absolute right-5 bottom-24 gap-2.5">
          <AppButton
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="w-11 h-11 rounded-full items-center justify-center bg-bg-tertiary-dark border border-border-primary-dark"
            onPress={scrollToTop}
          >
            <Feather name="chevrons-up" size={18} color="#50fa7b" />
          </AppButton>
          <AppButton
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="w-11 h-11 rounded-full items-center justify-center bg-bg-tertiary-dark border border-border-primary-dark"
            onPress={scrollToBottom}
          >
            <Feather name="chevrons-down" size={18} color="#50fa7b" />
          </AppButton>
        </View>
      ) : null}
    </View>
  );
};

export default MarketList;
