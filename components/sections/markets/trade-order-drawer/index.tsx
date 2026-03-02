import { AppButton } from "@/components/ui/app-button";
import AppDrawer from "@/components/ui/app-drawer";
import { AppDropdown } from "@/components/ui/app-dropdown";
import AppModal from "@/components/ui/app-modal";
import { AppText } from "@/components/ui/app-text";
import { MarketsContainer } from "@/containers/markets";
import { VARIANT_TYPES } from "@/lib/constants";
import { addDecimals } from "@/lib/utils/decimals";
import { cn } from "@/lib/utils/tailwind-configs";
import { useBottomPannelStore } from "@/store/bottom-pannel";
import { useMarketStore } from "@/store/markets";
import { Feather } from "@expo/vector-icons";
import { Slider } from "@miblanchard/react-native-slider";
import React, { useMemo, useState } from "react";
import { ScrollView, TextInput, View } from "react-native";

type TradeSide = "long" | "short";
type OrderType = "market" | "limit";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  coin: string;
  side?: TradeSide;
};

type ToggleButtonProps = {
  label: string;
  isActive: boolean;
  onPress: () => void;
  activeClassName: string;
  inactiveClassName?: string;
  activeTextClassName?: string;
  inactiveTextClassName?: string;
};

const ToggleButton: React.FC<ToggleButtonProps> = ({
  label,
  isActive,
  onPress,
  activeClassName,
  inactiveClassName = "",
  activeTextClassName = "text-text-primary-dark",
  inactiveTextClassName = "text-text-octonary-dark",
}) => (
  <AppButton
    variant={VARIANT_TYPES.NOT_SELECTED}
    className={cn(
      "h-11 flex-1 rounded-2xl border items-center justify-center",
      isActive
        ? activeClassName
        : cn(
            "bg-bg-secondary-dark/90 border-border-primary-dark/60",
            inactiveClassName,
          ),
    )}
    onPress={onPress}
  >
    <AppText
      variant={VARIANT_TYPES.NOT_SELECTED}
      className={cn(
        "text-[13px] leading-[16px] font-bold",
        isActive ? activeTextClassName : inactiveTextClassName,
      )}
    >
      {label}
    </AppText>
  </AppButton>
);

type StatRowProps = {
  label: string;
  value: string;
  valueClassName?: string;
  labelClassName?: string;
};

const StatRow: React.FC<StatRowProps> = ({
  label,
  value,
  valueClassName = "",
  labelClassName = "",
}) => (
  <View className="flex-row items-center justify-between py-1.5">
    <AppText
      variant={VARIANT_TYPES.NOT_SELECTED}
      className={cn(
        "text-[13px] leading-[17px] text-text-octonary-dark font-medium",
        labelClassName,
      )}
    >
      {label}
    </AppText>
    <AppText
      variant={VARIANT_TYPES.NOT_SELECTED}
      className={cn(
        "text-[14px] leading-[18px] text-text-primary-dark font-bold",
        valueClassName,
      )}
    >
      {value}
    </AppText>
  </View>
);

type LabeledInputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  rightSlot?: React.ReactNode;
  placeholder?: string;
};

const LabeledInput: React.FC<LabeledInputProps> = ({
  label,
  value,
  onChangeText,
  rightSlot,
  placeholder = "0.00",
}) => (
  <View className="gap-1">
    <AppText
      variant={VARIANT_TYPES.NOT_SELECTED}
      className="text-[13px] leading-[16px] text-text-octonary-dark uppercase tracking-[0.8px]"
    >
      {label}
    </AppText>
    <View className="h-14 rounded-2xl border border-border-primary-dark/70 bg-bg-secondary-dark/95 px-3 flex-row items-center justify-between">
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
        placeholder={placeholder}
        placeholderTextColor="#64748b"
        className="flex-1 text-[22px] leading-[26px] font-semibold text-text-primary-dark pt-0 pb-0"
      />
      {rightSlot}
    </View>
  </View>
);

export const TradeOrderDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  coin,
  side,
}) => {
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [selectedSide, setSelectedSide] = useState<TradeSide>(side ?? "long");
  const [price, setPrice] = useState("0.00");
  const [size, setSize] = useState("910.74");
  const [sizePercent, setSizePercent] = useState(81);
  const [sizeAsset, setSizeAsset] = useState("USDC");
  const [tif, setTif] = useState("GTC");
  const [isTpSlEnabled, setIsTpSlEnabled] = useState(false);
  const [isMarketSelectorOpen, setIsMarketSelectorOpen] = useState(false);
  const balances = useBottomPannelStore((state) => state.balances);
  const userPositions = useBottomPannelStore((state) => state.userPositions);
  const selectedMarket = useMarketStore((state) => state.selectedMarket);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedSide(side ?? "long");
    }
  }, [isOpen, side]);

  const availableToTrade = useMemo(() => {
    const availableRaw = (balances[0]?.available_balance ?? "0").replace(
      /\s+[A-Za-z]+$/,
      "",
    );
    const parsed = Number.parseFloat(availableRaw);
    return Number.isFinite(parsed) ? addDecimals(parsed, 2).toFixed(2) : "0.00";
  }, [balances]);

  const currentPositionSize = useMemo(() => {
    const normalizedCoin = coin.toUpperCase();
    const position = userPositions.find(
      (item) => item?.position?.coin?.toUpperCase() === normalizedCoin,
    );
    const szi = Number.parseFloat(position?.position?.szi ?? "0");
    return Number.isFinite(szi) ? Math.abs(szi) : 0;
  }, [coin, userPositions]);

  const liquidationPrice = useMemo(() => {
    const normalizedCoin = coin.toUpperCase();
    const position = userPositions.find(
      (item) => item?.position?.coin?.toUpperCase() === normalizedCoin,
    );
    const raw = position?.position?.liquidationPx;
    if (!raw) return "NA";
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? `${addDecimals(parsed, 0)}` : "NA";
  }, [coin, userPositions]);

  const orderValue = useMemo(() => {
    const sizeValue = Number.parseFloat(size);
    if (!Number.isFinite(sizeValue) || sizeValue <= 0) return "0.00";
    return addDecimals(sizeValue, 2).toFixed(2);
  }, [size]);

  const marginRequired = useMemo(() => {
    const value = Number.parseFloat(orderValue);
    if (!Number.isFinite(value) || value <= 0) return "0.00";
    const divisor = 25;
    return addDecimals(value / divisor, 2).toFixed(2);
  }, [orderValue]);

  const sliderPercent = useMemo(
    () => Math.max(0, Math.min(100, sizePercent)),
    [sizePercent],
  );
  const perpsBalance = useMemo(() => {
    const raw = (balances[0]?.total_balance ?? "0").replace(
      /\s+[A-Za-z]+$/,
      "",
    );
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? addDecimals(parsed, 2) : 0;
  }, [balances]);
  const currentPosition = useMemo(() => {
    const normalizedCoin = coin.toUpperCase();
    return userPositions.find(
      (item) => item?.position?.coin?.toUpperCase() === normalizedCoin,
    );
  }, [coin, userPositions]);
  const unrealizedPnl = useMemo(() => {
    const parsed = Number.parseFloat(
      currentPosition?.position?.unrealizedPnl ?? "0",
    );
    return Number.isFinite(parsed) ? addDecimals(parsed, 2) : 0;
  }, [currentPosition]);
  const crossAccountLeverage = useMemo(() => {
    const leverage = currentPosition?.position?.leverage;
    if (!leverage) return "0.00x";
    return `${addDecimals(leverage.value, 2).toFixed(2)}x`;
  }, [currentPosition]);

  const handleNumberInput = (value: string, setValue: (v: string) => void) => {
    if (value === "") {
      setValue("");
      return;
    }
    const regex = /^\d*\.?\d{0,4}$/;
    if (regex.test(value)) {
      setValue(value);
    }
  };
  const handleSelectSizePercent = (percent: number) => {
    setSizePercent(percent);
    const available = Number.parseFloat(availableToTrade);
    if (!Number.isFinite(available) || available <= 0) return;
    const computed = (available * percent) / 100;
    setSize(addDecimals(computed, 2).toFixed(2));
  };
  const sectionCardClassName =
    "rounded-2xl border border-border-primary-dark/60 bg-bg-secondary-dark/70 p-3";

  return (
    <AppDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={undefined}
      showCloseButton={false}
      enableSwipeDownToClose={false}
      className="px-3 pb-5 pt-2"
    >
      <ScrollView
        className="max-h-[88vh]"
        contentContainerClassName="gap-3 pb-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        directionalLockEnabled
        nestedScrollEnabled
        scrollEventThrottle={16}
        stickyHeaderIndices={[0]}
      >
        <View
          className={cn(
            sectionCardClassName,
            "mb-1.5 gap-2 pb-2 bg-bg-secondary-dark z-10",
          )}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-1.5">
              <AppText
                variant={VARIANT_TYPES.NOT_SELECTED}
                className="text-[17px] leading-[21px] font-extrabold text-text-primary-dark"
              >
                {coin.toUpperCase()} Order
              </AppText>
              <View className="px-2 py-0.5 rounded-full border border-border-primary-dark/70 bg-bg-secondary-dark/80">
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="text-[9px] leading-[11px] font-semibold text-text-octonary-dark uppercase tracking-[0.8px]"
                >
                  PERP
                </AppText>
              </View>
            </View>
            <AppButton
              variant={VARIANT_TYPES.NOT_SELECTED}
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-bg-quaternary-dark/95 border border-border-primary-dark/70 items-center justify-center"
              accessibilityLabel="Close order drawer"
            >
              <Feather name="x" size={14} color="#94a3b8" />
            </AppButton>
          </View>

          <AppButton
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="h-[60px] rounded-2xl border border-border-primary-dark bg-bg-secondary-dark px-3 flex-row items-center justify-between"
            onPress={() => setIsMarketSelectorOpen(true)}
            accessibilityLabel="Select market"
          >
            <View className="flex-row items-center gap-3 min-w-0 flex-1">
              <View className="h-9 w-9 rounded-full bg-bg-quaternary-dark border border-bg-senary-dark items-center justify-center">
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="text-[11px] font-extrabold text-text-quaternary-dark uppercase"
                >
                  {coin.toUpperCase()}
                </AppText>
              </View>
              <View className="min-w-0">
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="text-[10px] leading-[12px] text-text-octonary-dark uppercase tracking-[0.9px]"
                >
                  Selected Market
                </AppText>
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="text-[15px] leading-[18px] font-bold text-text-primary-dark"
                  numberOfLines={1}
                >
                  {coin.toUpperCase()}-USDC
                </AppText>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="h-7 w-px bg-border-primary-dark/60" />
              <View className="h-8 flex-row items-center gap-1 rounded-full border border-border-primary-dark/70 bg-bg-quaternary-dark px-3">
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="text-[11px] font-semibold text-text-tertiary-dark"
                >
                  Change
                </AppText>
                <Feather name="chevron-down" size={13} color="#94a3b8" />
              </View>
            </View>
          </AppButton>
        </View>

        <View className={cn(sectionCardClassName, "gap-2.5")}>
          <View className="flex-row gap-2.5">
            <AppButton
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="h-11 flex-1 rounded-2xl border border-[#2d815f] bg-[#0a3a2a] items-center justify-center"
            >
              <AppText
                variant={VARIANT_TYPES.NOT_SELECTED}
                className="text-[13px] leading-[16px] font-bold text-[#52f2a8]"
              >
                Cross
              </AppText>
            </AppButton>
            <AppButton
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="h-11 flex-1 rounded-2xl border border-[#2d815f] bg-[#0a3a2a] items-center justify-center"
            >
              <AppText
                variant={VARIANT_TYPES.NOT_SELECTED}
                className="text-[13px] leading-[16px] font-bold text-[#52f2a8]"
              >
                25x
              </AppText>
            </AppButton>
          </View>

          <View className="flex-row gap-2.5">
            <ToggleButton
              label="Market"
              isActive={orderType === "market"}
              onPress={() => setOrderType("market")}
              activeClassName="bg-bg-quaternary-dark border-border-primary-dark"
              activeTextClassName="text-text-primary-dark"
            />
            <ToggleButton
              label="Limit"
              isActive={orderType === "limit"}
              onPress={() => setOrderType("limit")}
              activeClassName="bg-bg-quaternary-dark border-border-primary-dark"
              activeTextClassName="text-text-primary-dark"
            />
          </View>

          <View className="flex-row gap-2.5">
            <ToggleButton
              label="Buy / Long"
              isActive={selectedSide === "long"}
              onPress={() => setSelectedSide("long")}
              activeClassName="bg-bg-senary-dark border-[#78f39a]/45 shadow-sm"
              activeTextClassName="text-[#05311b]"
              inactiveTextClassName="text-text-octonary-dark"
            />
            <ToggleButton
              label="Sell / Short"
              isActive={selectedSide === "short"}
              onPress={() => setSelectedSide("short")}
              activeClassName="bg-[#ff4d57] border-[#ff6b73]"
              activeTextClassName="text-white"
              inactiveTextClassName="text-text-octonary-dark"
            />
          </View>
        </View>

        <View className={cn(sectionCardClassName, "gap-2")}>
          <StatRow
            label="Available to Trade"
            value={`${availableToTrade} USDC`}
            labelClassName="text-[14px]"
          />
          <View className="h-px bg-border-primary-dark/35" />
          <StatRow
            label="Current Position"
            value={`${addDecimals(currentPositionSize, 4).toFixed(4)} ${coin.toUpperCase()}`}
            valueClassName="text-[#52f2a8]"
            labelClassName="text-[14px]"
          />
        </View>

        <View className={cn(sectionCardClassName, "gap-3")}>
          {orderType === "limit" ? (
            <LabeledInput
              label="Price (USDC)"
              value={price}
              onChangeText={(value) => handleNumberInput(value, setPrice)}
              rightSlot={
                <AppButton
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="h-7 min-w-[44px] px-2 rounded-lg border border-[#78f39a]/30 bg-[#1b3f33] items-center justify-center"
                  onPress={() => setPrice("0.00")}
                >
                  <AppText
                    variant={VARIANT_TYPES.NOT_SELECTED}
                    className="text-[11px] font-semibold text-[#86efac]"
                  >
                    Mid
                  </AppText>
                </AppButton>
              }
            />
          ) : null}

          <LabeledInput
            label="Size"
            value={size}
            onChangeText={(value) => handleNumberInput(value, setSize)}
            rightSlot={
              <View className="w-[84px]">
                <AppDropdown
                  value={sizeAsset}
                  onChange={setSizeAsset}
                  options={[
                    { label: "USDC", value: "USDC" },
                    { label: coin.toUpperCase(), value: coin.toUpperCase() },
                  ]}
                  className="w-full"
                />
              </View>
            }
          />

          <View className="mt-1 gap-2">
            <View className="flex-row items-center gap-3">
              <View className="flex-1 px-1">
                <Slider
                  value={sliderPercent}
                  minimumValue={0}
                  maximumValue={100}
                  step={1}
                  trackClickable
                  containerStyle={{ marginHorizontal: 0 }}
                  onValueChange={(value) => {
                    const next = Array.isArray(value) ? value[0] : value;
                    if (typeof next === "number") {
                      handleSelectSizePercent(Math.round(next));
                    }
                  }}
                  minimumTrackTintColor="#66ef7a"
                  maximumTrackTintColor="#2a3347"
                  thumbTintColor="#66ef7a"
                  thumbStyle={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 3,
                    borderColor: "#0d1117",
                  }}
                  trackStyle={{ height: 7, borderRadius: 999 }}
                />
              </View>
              <View className="h-8 min-w-[58px] rounded-full border border-border-primary-dark/70 bg-bg-quaternary-dark items-center justify-center px-2">
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="text-[15px] leading-[18px] text-text-primary-dark font-bold"
                  numberOfLines={1}
                >
                  {sizePercent}%
                </AppText>
              </View>
            </View>

            <View className="flex-row gap-2">
              {[25, 50, 75, 100].map((percent) => (
                <AppButton
                  key={percent}
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  onPress={() => handleSelectSizePercent(percent)}
                  className={cn(
                    "h-7 flex-1 rounded-lg border items-center justify-center",
                    sizePercent === percent
                      ? "bg-bg-senary-dark border-[#78f39a]/50"
                      : "bg-bg-quaternary-dark/50 border-border-primary-dark/60",
                  )}
                >
                  <AppText
                    variant={VARIANT_TYPES.NOT_SELECTED}
                    className={cn(
                      "text-[11px] font-semibold",
                      sizePercent === percent
                        ? "text-[#064617]"
                        : "text-text-tertiary-dark",
                    )}
                  >
                    {percent}%
                  </AppText>
                </AppButton>
              ))}
            </View>
          </View>

          <View className="gap-1">
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="text-[13px] leading-[16px] text-text-octonary-dark uppercase tracking-[0.8px]"
            >
              TIF
            </AppText>
            <AppDropdown
              value={tif}
              onChange={setTif}
              options={[
                { label: "GTC", value: "GTC" },
                { label: "IOC", value: "IOC" },
                { label: "ALO", value: "ALO" },
              ]}
            />
          </View>

          <AppButton
            variant={VARIANT_TYPES.NOT_SELECTED}
            onPress={() => setIsTpSlEnabled((prev) => !prev)}
            className="h-11 flex-row items-center justify-start gap-2.5 px-3 rounded-xl border border-border-primary-dark/60 bg-bg-secondary-dark/65 mt-0.5"
          >
            <View
              className={cn(
                "w-5 h-5 rounded-md border items-center justify-center",
                isTpSlEnabled
                  ? "bg-bg-senary-dark border-[#78f39a]/60"
                  : "bg-transparent border-border-primary-dark/70",
              )}
            >
              {isTpSlEnabled ? (
                <Feather name="check" size={12} color="#0c4a2e" />
              ) : null}
            </View>
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="text-[14px] text-text-tertiary-dark font-medium"
            >
              Take Profit / Stop Loss
            </AppText>
          </AppButton>

          <AppButton
            variant={VARIANT_TYPES.NOT_SELECTED}
            className={cn(
              "h-14 rounded-2xl border items-center justify-center mt-0.5 shadow-sm",
              selectedSide === "long"
                ? "bg-bg-senary-dark border-[#78f39a]/50"
                : "bg-red-500 border-[#ff8a8a]/50",
            )}
          >
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className={cn(
                "text-[15px] leading-[18px] font-extrabold uppercase tracking-[0.7px]",
                selectedSide === "long" ? "text-[#064617]" : "text-white",
              )}
            >
              Place Order
            </AppText>
          </AppButton>
        </View>

        <View className={cn(sectionCardClassName, "gap-2")}>
          <StatRow label="Liquidation Price" value={liquidationPrice} />
          <View className="h-px bg-border-primary-dark/35" />
          <StatRow label="Order Value" value={`${orderValue} USDC`} />
          <View className="h-px bg-border-primary-dark/35" />
          <StatRow label="Margin Required" value={`${marginRequired} USDC`} />
          <View className="h-px bg-border-primary-dark/35" />
          <StatRow
            label="Slippage"
            value="MAX: 2.00%"
            valueClassName="text-[#84ff5c]"
          />
        </View>

        <View className={cn(sectionCardClassName, "gap-1.5")}>
          <View className="flex-row items-center gap-2">
            <View className="h-4 w-1 rounded-full bg-bg-senary-dark" />
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="text-[12px] leading-[16px] uppercase tracking-[1px] text-text-octonary-dark"
            >
              Account Equity
            </AppText>
          </View>
          <StatRow label="Perps" value={`${perpsBalance.toFixed(2)} USDC`} />
        </View>

        <View className={cn(sectionCardClassName, "gap-1.5")}>
          <View className="flex-row items-center gap-2">
            <View className="h-4 w-1 rounded-full bg-bg-senary-dark" />
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="text-[12px] leading-[16px] uppercase tracking-[1px] text-text-octonary-dark"
            >
              Perps Overview
            </AppText>
          </View>
          <StatRow label="Balance" value={`${perpsBalance.toFixed(2)} USDC`} />
          <View className="h-px bg-border-primary-dark/35" />
          <StatRow
            label="Unrealized PNL"
            value={`${unrealizedPnl.toFixed(2)} USDC`}
            valueClassName={
              unrealizedPnl >= 0 ? "text-[#52f2a8]" : "text-[#fb7185]"
            }
          />
          <View className="h-px bg-border-primary-dark/35" />
          <StatRow
            label="Cross Account Leverage"
            value={crossAccountLeverage}
          />
        </View>
      </ScrollView>

      <AppModal
        isOpen={isMarketSelectorOpen}
        onClose={() => setIsMarketSelectorOpen(false)}
        title="Select Market"
        className="h-[85vh]"
        contentClassName="p-0 flex-1"
      >
        <MarketsContainer
          openMarketDetailsOnSelect={false}
          onMarketSelect={() => setIsMarketSelectorOpen(false)}
        />
      </AppModal>
    </AppDrawer>
  );
};

export default TradeOrderDrawer;
