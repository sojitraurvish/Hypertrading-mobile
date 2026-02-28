import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils/tailwind-configs";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { ScrollView, View } from "react-native";

export type TabKey =
  | "balances"
  | "positions"
  | "openOrders"
  | "tradeHistory"
  | "fundingHistory"
  | "orderHistory";

type DetailTone = "default" | "positive" | "negative" | "muted";

type DetailItem = {
  label: string;
  value: string;
  tone?: DetailTone;
};

type CardData = {
  id: string;
  title: string;
  subtitle?: string;
  summaryLeft: string;
  summaryRight: string;
  details: DetailItem[];
};

type TabConfig = {
  key: TabKey;
  label: string;
  count: number;
  rows: CardData[];
};

type TabMeta = {
  icon: keyof typeof Feather.glyphMap;
  leftLabel: string;
  rightLabel: string;
  description: string;
};

const formatMoney = (value: number) => `$${value.toFixed(2)}`;
const formatSignedMoney = (value: number) => `${value >= 0 ? "+" : "-"}$${Math.abs(value).toFixed(2)}`;
const formatSignedPercent = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;

const BALANCE_ROWS: CardData[] = Array.from({ length: 10 }).map((_, idx) => {
  const isPerps = idx % 2 === 0;
  const total = Number((13.32 + idx * 2.47).toFixed(2));
  const available = Number((total * 0.985).toFixed(2));
  return {
    id: `balance-${idx}`,
    title: isPerps ? "USDC (Perps)" : "USDC (Spot)",
    subtitle: "Coin",
    summaryLeft: `${total} USDC`,
    summaryRight: formatMoney(total),
    details: [
      { label: "Coin", value: isPerps ? "USDC (Perps)" : "USDC (Spot)" },
      { label: "Total Balance", value: `${total} USDC` },
      { label: "Available Balance", value: `${available} USDC` },
      { label: "USDC Value", value: formatMoney(total) },
      { label: "Transfer", value: isPerps ? "Transfer to Spot" : "Transfer to Perps", tone: "positive" },
    ],
  };
});

const POSITION_ROWS: CardData[] = Array.from({ length: 10 }).map((_, idx) => {
  const size = Number((0.4 + idx * 0.07).toFixed(3));
  const entry = Number((81.39 + idx * 1.13).toFixed(2));
  const mark = Number((entry + (idx % 2 === 0 ? 0.16 : -0.22)).toFixed(2));
  const pnlAbs = Number(((mark - entry) * size * 10).toFixed(2));
  const roe = Number((((mark - entry) / entry) * 100).toFixed(2));
  return {
    id: `position-${idx}`,
    title: idx % 2 === 0 ? "SOL 20X" : "BTC 10X",
    subtitle: "Coin",
    summaryLeft: `${size} ${idx % 2 === 0 ? "SOL" : "BTC"}`,
    summaryRight: `${formatSignedMoney(pnlAbs)} (${formatSignedPercent(roe)})`,
    details: [
      { label: "Coin", value: idx % 2 === 0 ? "SOL 20X" : "BTC 10X" },
      { label: "Size", value: `${size} ${idx % 2 === 0 ? "SOL" : "BTC"}` },
      { label: "Position Value", value: `${formatMoney(Number((size * mark).toFixed(2)))} USDC` },
      { label: "Entry Price", value: entry.toFixed(2) },
      { label: "Mark Price", value: mark.toFixed(2) },
      {
        label: "PnL (ROE %)",
        value: `${formatSignedMoney(pnlAbs)} (${formatSignedPercent(roe)})`,
        tone: pnlAbs >= 0 ? "positive" : "negative",
      },
      { label: "Liq. Price", value: Number((entry * 0.95).toFixed(2)).toFixed(2) },
      { label: "Margin", value: `${formatMoney(Number((size * 4.2).toFixed(2)))} (Cross)` },
      { label: "Funding", value: idx % 2 === 0 ? "-$0.00" : "+$0.01", tone: idx % 2 === 0 ? "negative" : "positive" },
      { label: "Close All", value: "Limit | Market | Reverse" },
      { label: "TP/SL", value: "-- / --", tone: "muted" },
    ],
  };
});

const OPEN_ORDER_ROWS: CardData[] = Array.from({ length: 10 }).map((_, idx) => {
  const size = Number((0.13 + idx * 0.015).toFixed(5));
  const price = Number((80 + idx * 1.45).toFixed(2));
  const orderValue = Number((size * price).toFixed(2));
  return {
    id: `open-order-${idx}`,
    title: idx % 2 === 0 ? "SOL Long" : "BTC Short",
    subtitle: "Order",
    summaryLeft: `${idx % 2 === 0 ? "Limit" : "Market"} • ${size}`,
    summaryRight: `${formatMoney(orderValue)} USDC`,
    details: [
      { label: "Time", value: `28/02/2026 - 11:${(36 - idx).toString().padStart(2, "0")}:37` },
      { label: "Type", value: idx % 2 === 0 ? "Limit" : "Market" },
      { label: "Coin", value: idx % 2 === 0 ? "SOL" : "BTC" },
      { label: "Direction", value: idx % 2 === 0 ? "Long" : "Short", tone: idx % 2 === 0 ? "positive" : "negative" },
      { label: "Size", value: size.toFixed(5) },
      { label: "Original Size", value: size.toFixed(5) },
      { label: "Order Value", value: `${formatMoney(orderValue)} USDC` },
      { label: "Price", value: price.toString() },
      { label: "Reduce Only", value: idx % 3 === 0 ? "Yes" : "No" },
      { label: "Trigger Conditions", value: "N/A", tone: "muted" },
      { label: "TP/SL", value: "--", tone: "muted" },
    ],
  };
});

const TRADE_HISTORY_ROWS: CardData[] = Array.from({ length: 10 }).map((_, idx) => {
  const price = Number((81.34 + idx * 0.18).toFixed(3));
  const size = Number((0.13 + idx * 0.04).toFixed(6));
  const tradeValue = Number((price * size).toFixed(2));
  const fee = Number((tradeValue * 0.0015).toFixed(8));
  const pnl = Number(((idx % 2 === 0 ? -1 : 1) * (tradeValue * 0.003)).toFixed(2));
  return {
    id: `trade-history-${idx}`,
    title: idx % 2 === 0 ? "Close Short" : "Open Long",
    subtitle: "Direction",
    summaryLeft: `${idx % 2 === 0 ? "SOL" : "BTC"} @ ${price}`,
    summaryRight: `${formatSignedMoney(pnl)} USDC`,
    details: [
      { label: "Time", value: `28/02/2026 - 11:${(36 - idx).toString().padStart(2, "0")}:1${idx % 10}` },
      { label: "Coin", value: idx % 2 === 0 ? "SOL" : "BTC" },
      { label: "Direction", value: idx % 2 === 0 ? "Close Short" : "Open Long", tone: idx % 2 === 0 ? "negative" : "positive" },
      { label: "Price", value: price.toString() },
      { label: "Size", value: `${size.toFixed(6)} ${idx % 2 === 0 ? "SOL" : "BTC"}` },
      { label: "Trade Value", value: `${tradeValue.toFixed(2)} USDC` },
      { label: "Fee", value: `${fee.toFixed(8)} USDC` },
      { label: "Closed PnL", value: `${formatSignedMoney(pnl)} USDC`, tone: pnl >= 0 ? "positive" : "negative" },
    ],
  };
});

const FUNDING_HISTORY_ROWS: CardData[] = Array.from({ length: 10 }).map((_, idx) => {
  const size = Number((0.14 + idx * 0.011).toFixed(6));
  const payment = Number(((idx % 2 === 0 ? -1 : 1) * (0.0001 + idx * 0.00003)).toFixed(4));
  const rate = Number(((idx % 2 === 0 ? -1 : 1) * (0.0002 + idx * 0.00009)).toFixed(4));
  return {
    id: `funding-history-${idx}`,
    title: idx % 2 === 0 ? "SOL" : "BTC",
    subtitle: "Coin",
    summaryLeft: `${size.toFixed(6)} ${idx % 2 === 0 ? "BTC" : "SOL"}`,
    summaryRight: `${payment >= 0 ? "+" : ""}${payment.toFixed(4)}`,
    details: [
      { label: "Time", value: `${(25 - idx).toString().padStart(2, "0")}/02/2026 - ${(21 - (idx % 4)).toString().padStart(2, "0")}:30:00` },
      { label: "Coin", value: idx % 2 === 0 ? "SOL" : "BTC" },
      { label: "Size", value: `${size.toFixed(6)} ${idx % 2 === 0 ? "BTC" : "SOL"}` },
      { label: "Position Side", value: idx % 2 === 0 ? "Long" : "Short", tone: idx % 2 === 0 ? "positive" : "negative" },
      { label: "Payment", value: `${payment >= 0 ? "+" : ""}${payment.toFixed(4)}`, tone: payment >= 0 ? "positive" : "negative" },
      { label: "Rate", value: `${rate >= 0 ? "+" : ""}${rate.toFixed(4)}%`, tone: rate >= 0 ? "positive" : "negative" },
    ],
  };
});

const ORDER_HISTORY_ROWS: CardData[] = Array.from({ length: 10 }).map((_, idx) => {
  const size = Number((0.13 + idx * 0.02).toFixed(5));
  const filled = idx % 3 === 0 ? size : Number((size * 0.4).toFixed(5));
  const price = idx % 3 === 0 ? "Market" : Number((80.34 + idx * 0.77).toFixed(4)).toString();
  const status = idx % 3 === 0 ? "Filled" : idx % 3 === 1 ? "Open" : "Canceled";
  const orderValue = Number((size * (price === "Market" ? 82.5 : Number(price))).toFixed(2));
  return {
    id: `order-history-${idx}`,
    title: idx % 2 === 0 ? "SOL" : "BTC",
    subtitle: "Order",
    summaryLeft: `${idx % 3 === 0 ? "Market" : "Limit"} • ${idx % 2 === 0 ? "Long" : "Close Long"}`,
    summaryRight: status,
    details: [
      { label: "Date and Time", value: `28/02/2026 - 11:${(36 - idx).toString().padStart(2, "0")}:${(10 + idx).toString().padStart(2, "0")}` },
      { label: "Order Type", value: idx % 3 === 0 ? "Market" : "Limit" },
      { label: "Coin", value: idx % 2 === 0 ? "SOL" : "BTC" },
      { label: "Direction", value: idx % 2 === 0 ? "Long" : "Close Long", tone: idx % 2 === 0 ? "positive" : "negative" },
      { label: "Size", value: size.toFixed(5) },
      { label: "Filled Size", value: filled.toFixed(5) },
      { label: "Order Value", value: `${orderValue.toFixed(2)} USDC` },
      { label: "Price", value: price },
      { label: "Reduce Only", value: idx % 2 === 0 ? "No" : "Yes" },
      { label: "TP/SL", value: "N/A", tone: "muted" },
      {
        label: "Status",
        value: status,
        tone: status === "Filled" ? "positive" : status === "Canceled" ? "negative" : "default",
      },
      { label: "Order ID", value: `${332726884650 + idx * 913}` },
    ],
  };
});

const toneClassName = (tone: DetailTone = "default") => {
  if (tone === "positive") return "text-text-quaternary-dark";
  if (tone === "negative") return "text-text-senary-dark";
  if (tone === "muted") return "text-text-octonary-dark";
  return "text-text-primary-dark";
};

const importantSummaryTone = (value: string): DetailTone => {
  if (value.includes("-$")) return "negative";
  if (value.includes("+$")) return "positive";
  if (value.toLowerCase() === "filled" || value.toLowerCase() === "open") return "positive";
  if (value.toLowerCase() === "canceled") return "negative";
  return "default";
};

const summaryBadgeClassName = (tone: DetailTone) => {
  if (tone === "positive") return "bg-[#073b2a] border-[#1d7f5f]";
  if (tone === "negative") return "bg-[#3a1318] border-[#7f1d2b]";
  if (tone === "muted") return "bg-bg-tertiary-dark border-border-primary-dark";
  return "bg-bg-tertiary-dark border-border-primary-dark";
};

const summaryBadgeLabel = (tone: DetailTone) => {
  if (tone === "positive") return "POSITIVE";
  if (tone === "negative") return "NEGATIVE";
  if (tone === "muted") return "MUTED";
  return "NEUTRAL";
};

const summaryBadgeTextClassName = (tone: DetailTone) => {
  if (tone === "positive") return "text-[#52f2a8]";
  if (tone === "negative") return "text-[#fb7185]";
  if (tone === "muted") return "text-text-octonary-dark";
  return "text-text-tertiary-dark";
};

const TABS: TabConfig[] = [
  { key: "balances", label: "Balances", count: BALANCE_ROWS.length, rows: BALANCE_ROWS },
  { key: "positions", label: "Positions", count: POSITION_ROWS.length, rows: POSITION_ROWS },
  { key: "openOrders", label: "Open Orders", count: OPEN_ORDER_ROWS.length, rows: OPEN_ORDER_ROWS },
  { key: "tradeHistory", label: "Trade History", count: TRADE_HISTORY_ROWS.length, rows: TRADE_HISTORY_ROWS },
  {
    key: "fundingHistory",
    label: "Funding History",
    count: FUNDING_HISTORY_ROWS.length,
    rows: FUNDING_HISTORY_ROWS,
  },
  { key: "orderHistory", label: "Order History", count: ORDER_HISTORY_ROWS.length, rows: ORDER_HISTORY_ROWS },
];

const TAB_META: Record<TabKey, TabMeta> = {
  balances: {
    icon: "credit-card",
    leftLabel: "Wallet",
    rightLabel: "Value",
    description: "Spot and perps balances by wallet segment",
  },
  positions: {
    icon: "activity",
    leftLabel: "Exposure",
    rightLabel: "PnL",
    description: "Open leverage positions and unrealized return",
  },
  openOrders: {
    icon: "list",
    leftLabel: "Type / Size",
    rightLabel: "Order Value",
    description: "Working orders waiting for fill",
  },
  tradeHistory: {
    icon: "clock",
    leftLabel: "Trade",
    rightLabel: "Closed PnL",
    description: "Recently executed trades and outcomes",
  },
  fundingHistory: {
    icon: "repeat",
    leftLabel: "Position",
    rightLabel: "Payment",
    description: "Funding debits and credits over time",
  },
  orderHistory: {
    icon: "file-text",
    leftLabel: "Order",
    rightLabel: "Status",
    description: "Historical order lifecycle records",
  },
};

type MarketAccountOverviewProps = {
  activeTab: TabKey;
  expandedCards: Record<string, boolean>;
  onTabChange: (tab: TabKey) => void;
  onToggleCard: (cardId: string) => void;
  mode?: "header" | "content";
};

export const MarketAccountOverview: React.FC<MarketAccountOverviewProps> = ({
  activeTab,
  expandedCards,
  onTabChange,
  onToggleCard,
  mode = "content",
}) => {
  const activeTabData = TABS.find((tab) => tab.key === activeTab) ?? TABS[0];
  const activeMeta = TAB_META[activeTab];
  const isHistoryTab =
    activeTab === "tradeHistory" || activeTab === "fundingHistory" || activeTab === "orderHistory";
  const allRowsExpanded = activeTabData.rows.every((row) => Boolean(expandedCards[row.id]));

  if (mode === "header") {
    return (
      <View className="mx-1 -mt-[1px] rounded-xl border border-border-primary-dark/60 bg-bg-secondary-dark overflow-hidden z-20">
        <View className="px-2.5 pt-2 pb-2 border-b border-border-primary-dark/35 bg-bg-secondary-dark flex-row items-center">
          <View className="flex-1 mr-2">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 4 }}
            >
              <View className="flex-row items-center">
                {TABS.map((tab, index) => {
                  const isActive = activeTab === tab.key;
                  return (
                    <AppButton
                      key={tab.key}
                      variant={VARIANT_TYPES.NOT_SELECTED}
                      className={cn(
                        "h-9 px-2.5 rounded-lg border flex-row items-center gap-1.5",
                        index < TABS.length - 1 ? "mr-2" : "",
                        isActive
                          ? "bg-bg-primary-dark border-bg-senary-dark/70"
                          : "bg-bg-tertiary-dark/50 border-border-primary-dark/20",
                      )}
                      onPress={() => {
                        React.startTransition(() => {
                          onTabChange(tab.key);
                        });
                      }}
                    >
                      <Feather
                        name={TAB_META[tab.key].icon}
                        size={11}
                        color={isActive ? "#50fa7b" : "#64748b"}
                      />
                      <AppText
                        variant={VARIANT_TYPES.NOT_SELECTED}
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-[0.7px]",
                          isActive ? "text-text-primary-dark" : "text-text-octonary-dark",
                        )}
                      >
                        {tab.label}
                      </AppText>
                      <View className="min-w-[16px] h-4 px-1 rounded-full bg-bg-tertiary-dark border border-border-primary-dark items-center justify-center">
                        <AppText
                          variant={VARIANT_TYPES.NOT_SELECTED}
                          className="text-[9px] font-bold text-bg-senary-dark"
                        >
                          {tab.count}
                        </AppText>
                      </View>
                    </AppButton>
                  );
                })}
              </View>
            </ScrollView>
          </View>
          <AppButton
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="h-9 w-9 rounded-lg border border-border-primary-dark/40 bg-bg-tertiary-dark items-center justify-center"
            onPress={() => {
              const shouldExpand = !allRowsExpanded;
              activeTabData.rows.forEach((row) => {
                const isOpen = Boolean(expandedCards[row.id]);
                if (shouldExpand && !isOpen) onToggleCard(row.id);
                if (!shouldExpand && isOpen) onToggleCard(row.id);
              });
            }}
          >
            <Feather
              name={allRowsExpanded ? "minimize-2" : "maximize-2"}
              size={13}
              color={allRowsExpanded ? "#94a3b8" : "#50fa7b"}
            />
          </AppButton>
        </View>

        {isHistoryTab ? (
          <View className="px-2.5 py-2 border-b border-border-primary-dark/20 bg-bg-secondary-dark">
            <View className="flex-row items-center justify-end">
              <AppButton
                variant={VARIANT_TYPES.NOT_SELECTED}
                className="h-7 px-2 rounded-md bg-bg-tertiary-dark border border-border-primary-dark/70 flex-row items-center gap-1"
                onPress={() => {}}
              >
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="text-[10px] font-semibold text-text-octonary-dark"
                >
                  Filter
                </AppText>
                <Feather name="chevron-down" size={11} color="#64748b" />
              </AppButton>
            </View>
          </View>
        ) : null}

      </View>
    );
  }

  return (
    <View className="mx-1 mt-2 px-2.5 pt-2.5 gap-[10px] pb-[14px]">
      {activeTabData.rows.map((row) => {
        const isOpen = Boolean(expandedCards[row.id]);
        const rowSummaryTone = importantSummaryTone(row.summaryRight);
        return (
          <View
            key={row.id}
            className={cn(
              "rounded-xl border overflow-hidden",
              isOpen
                ? "border-bg-senary-dark/50 bg-bg-primary-dark"
                : "border-border-primary-dark/35 bg-bg-primary-dark",
            )}
          >
            <AppButton
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="px-3 py-3.5"
              onPress={() => onToggleCard(row.id)}
            >
              <View className="flex-row items-center justify-between gap-2">
                <View className="flex-1 min-w-0">
                  <View className="flex-row items-center gap-2">
                    <View className="h-5 w-5 rounded-full items-center justify-center bg-bg-tertiary-dark border border-border-primary-dark/60">
                      <Feather
                        name={activeMeta.icon}
                        size={10}
                        color="#94a3b8"
                      />
                    </View>
                    <AppText
                      variant={VARIANT_TYPES.NOT_SELECTED}
                      className="text-[13px] font-bold text-text-primary-dark"
                      numberOfLines={1}
                    >
                      {row.title}
                    </AppText>
                    {row.subtitle ? (
                      <View className="h-5 px-2 rounded-full bg-bg-tertiary-dark border border-border-primary-dark/70 items-center justify-center">
                        <AppText
                          variant={VARIANT_TYPES.NOT_SELECTED}
                          className="text-[9px] uppercase font-semibold text-text-octonary-dark tracking-[0.6px]"
                          numberOfLines={1}
                        >
                          {row.subtitle}
                        </AppText>
                      </View>
                    ) : null}
                  </View>

                  <View className="flex-row items-center justify-between mt-2">
                    <View className="flex-1 min-w-0 pr-2">
                      <AppText
                        variant={VARIANT_TYPES.NOT_SELECTED}
                        className="text-[10px] text-text-octonary-dark uppercase tracking-[0.7px]"
                      >
                        {activeMeta.leftLabel}
                      </AppText>
                      <AppText
                        variant={VARIANT_TYPES.NOT_SELECTED}
                        className="text-[12px] text-text-primary-dark font-semibold mt-[1px]"
                        numberOfLines={1}
                      >
                        {row.summaryLeft}
                      </AppText>
                    </View>
                    <View className="items-end flex-1 min-w-0">
                      <AppText
                        variant={VARIANT_TYPES.NOT_SELECTED}
                        className="text-[10px] text-text-octonary-dark uppercase tracking-[0.7px]"
                      >
                        {activeMeta.rightLabel}
                      </AppText>
                      <AppText
                        variant={VARIANT_TYPES.NOT_SELECTED}
                        className={cn(
                          "text-[13px] font-bold mt-[1px]",
                          toneClassName(rowSummaryTone),
                        )}
                        numberOfLines={1}
                      >
                        {row.summaryRight}
                      </AppText>
                      <View
                        className={cn(
                          "mt-1 h-5 px-2 rounded-full border items-center justify-center",
                          summaryBadgeClassName(rowSummaryTone),
                        )}
                      >
                        <AppText
                          variant={VARIANT_TYPES.NOT_SELECTED}
                          className={cn("text-[8px] font-bold tracking-[0.8px]", summaryBadgeTextClassName(rowSummaryTone))}
                        >
                          {summaryBadgeLabel(rowSummaryTone)}
                        </AppText>
                      </View>
                    </View>
                  </View>
                </View>

                <View
                  className={cn(
                    "w-6 h-6 rounded-full border items-center justify-center",
                    isOpen
                      ? "border-bg-senary-dark/60 bg-bg-senary-dark/10"
                      : "border-border-primary-dark/70 bg-bg-tertiary-dark",
                  )}
                >
                  <Feather
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={13}
                    color={isOpen ? "#50fa7b" : "#64748b"}
                  />
                </View>
              </View>
            </AppButton>

            {isOpen ? (
              <View className="px-3 pb-3 pt-1 border-t border-border-primary-dark/35">
                <View>
                  {row.details.map((detail, detailIndex) => (
                    <View
                      key={`${row.id}-${detail.label}`}
                      className={cn(
                        "flex-row items-start justify-between gap-3 py-2",
                        detailIndex < row.details.length - 1
                          ? "border-b border-border-primary-dark/20"
                          : "",
                      )}
                    >
                      <AppText
                        variant={VARIANT_TYPES.NOT_SELECTED}
                        className="text-[10px] uppercase tracking-[0.7px] text-text-octonary-dark font-semibold flex-1"
                      >
                        {detail.label}
                      </AppText>
                      <AppText
                        variant={VARIANT_TYPES.NOT_SELECTED}
                        className={cn(
                          "text-[11px] font-semibold text-right flex-1",
                          toneClassName(detail.tone),
                        )}
                        numberOfLines={3}
                      >
                        {detail.value}
                      </AppText>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        );
      })}

      {isHistoryTab ? (
        <AppButton
          variant={VARIANT_TYPES.NOT_SELECTED}
          className="self-start mt-1 px-1 py-1"
          onPress={() => {}}
        >
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-[10px] text-text-quaternary-dark font-semibold"
          >
            View All
          </AppText>
        </AppButton>
      ) : null}
    </View>
  );
};

export default MarketAccountOverview;
