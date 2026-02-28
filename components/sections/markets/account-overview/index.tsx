import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { DATE_TIME_FORMAT, VARIANT_TYPES } from "@/lib/constants";
import { addDecimals } from "@/lib/utils/decimals";
import { formatDateTimeAccordingToFormat } from "@/lib/utils/date-oprations";
import { cn } from "@/lib/utils/tailwind-configs";
import { useMarketStore } from "@/store/markets";
import type { Balance, OpenOrder, Position } from "@/types/bottom-pannel";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";

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
const formatSignedMoney = (value: number) =>
  `${value >= 0 ? "+" : "-"}$${Math.abs(value).toFixed(2)}`;
const formatPnlMoney = (value: number) =>
  value >= 0 ? `$${value.toFixed(2)}` : `-$${Math.abs(value).toFixed(2)}`;
const formatFundingMoney = (value: number) =>
  value >= 0 ? `-$${value.toFixed(2)}` : `$${Math.abs(value).toFixed(2)}`;
const formatSignedPercent = (value: number) =>
  `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
const formatRoePercent = (value: number) =>
  `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

const toTitleCase = (value: string) =>
  value.length > 0 ? value[0].toUpperCase() + value.slice(1).toLowerCase() : value;

const TRADE_HISTORY_ROWS: CardData[] = Array.from({ length: 10 }).map(
  (_, idx) => {
    const price = Number((81.34 + idx * 0.18).toFixed(3));
    const size = Number((0.13 + idx * 0.04).toFixed(6));
    const tradeValue = Number((price * size).toFixed(2));
    const fee = Number((tradeValue * 0.0015).toFixed(8));
    const pnl = Number(
      ((idx % 2 === 0 ? -1 : 1) * (tradeValue * 0.003)).toFixed(2),
    );
    return {
      id: `trade-history-${idx}`,
      title: idx % 2 === 0 ? "Close Short" : "Open Long",
      subtitle: "Direction",
      summaryLeft: `${idx % 2 === 0 ? "SOL" : "BTC"} @ ${price}`,
      summaryRight: `${formatSignedMoney(pnl)} USDC`,
      details: [
        {
          label: "Time",
          value: `28/02/2026 - 11:${(36 - idx).toString().padStart(2, "0")}:1${idx % 10}`,
        },
        { label: "Coin", value: idx % 2 === 0 ? "SOL" : "BTC" },
        {
          label: "Direction",
          value: idx % 2 === 0 ? "Close Short" : "Open Long",
          tone: idx % 2 === 0 ? "negative" : "positive",
        },
        { label: "Price", value: price.toString() },
        {
          label: "Size",
          value: `${size.toFixed(6)} ${idx % 2 === 0 ? "SOL" : "BTC"}`,
        },
        { label: "Trade Value", value: `${tradeValue.toFixed(2)} USDC` },
        { label: "Fee", value: `${fee.toFixed(8)} USDC` },
        {
          label: "Closed PnL",
          value: `${formatSignedMoney(pnl)} USDC`,
          tone: pnl >= 0 ? "positive" : "negative",
        },
      ],
    };
  },
);

const FUNDING_HISTORY_ROWS: CardData[] = Array.from({ length: 10 }).map(
  (_, idx) => {
    const size = Number((0.14 + idx * 0.011).toFixed(6));
    const payment = Number(
      ((idx % 2 === 0 ? -1 : 1) * (0.0001 + idx * 0.00003)).toFixed(4),
    );
    const rate = Number(
      ((idx % 2 === 0 ? -1 : 1) * (0.0002 + idx * 0.00009)).toFixed(4),
    );
    return {
      id: `funding-history-${idx}`,
      title: idx % 2 === 0 ? "SOL" : "BTC",
      subtitle: "Coin",
      summaryLeft: `${size.toFixed(6)} ${idx % 2 === 0 ? "BTC" : "SOL"}`,
      summaryRight: `${payment >= 0 ? "+" : ""}${payment.toFixed(4)}`,
      details: [
        {
          label: "Time",
          value: `${(25 - idx).toString().padStart(2, "0")}/02/2026 - ${(21 - (idx % 4)).toString().padStart(2, "0")}:30:00`,
        },
        { label: "Coin", value: idx % 2 === 0 ? "SOL" : "BTC" },
        {
          label: "Size",
          value: `${size.toFixed(6)} ${idx % 2 === 0 ? "BTC" : "SOL"}`,
        },
        {
          label: "Position Side",
          value: idx % 2 === 0 ? "Long" : "Short",
          tone: idx % 2 === 0 ? "positive" : "negative",
        },
        {
          label: "Payment",
          value: `${payment >= 0 ? "+" : ""}${payment.toFixed(4)}`,
          tone: payment >= 0 ? "positive" : "negative",
        },
        {
          label: "Rate",
          value: `${rate >= 0 ? "+" : ""}${rate.toFixed(4)}%`,
          tone: rate >= 0 ? "positive" : "negative",
        },
      ],
    };
  },
);

const ORDER_HISTORY_ROWS: CardData[] = Array.from({ length: 10 }).map(
  (_, idx) => {
    const size = Number((0.13 + idx * 0.02).toFixed(5));
    const filled = idx % 3 === 0 ? size : Number((size * 0.4).toFixed(5));
    const price =
      idx % 3 === 0
        ? "Market"
        : Number((80.34 + idx * 0.77).toFixed(4)).toString();
    const status =
      idx % 3 === 0 ? "Filled" : idx % 3 === 1 ? "Open" : "Canceled";
    const orderValue = Number(
      (size * (price === "Market" ? 82.5 : Number(price))).toFixed(2),
    );
    return {
      id: `order-history-${idx}`,
      title: idx % 2 === 0 ? "SOL" : "BTC",
      subtitle: "Order",
      summaryLeft: `${idx % 3 === 0 ? "Market" : "Limit"} • ${idx % 2 === 0 ? "Long" : "Close Long"}`,
      summaryRight: status,
      details: [
        {
          label: "Date and Time",
          value: `28/02/2026 - 11:${(36 - idx).toString().padStart(2, "0")}:${(10 + idx).toString().padStart(2, "0")}`,
        },
        { label: "Order Type", value: idx % 3 === 0 ? "Market" : "Limit" },
        { label: "Coin", value: idx % 2 === 0 ? "SOL" : "BTC" },
        {
          label: "Direction",
          value: idx % 2 === 0 ? "Long" : "Close Long",
          tone: idx % 2 === 0 ? "positive" : "negative",
        },
        { label: "Size", value: size.toFixed(5) },
        { label: "Filled Size", value: filled.toFixed(5) },
        { label: "Order Value", value: `${orderValue.toFixed(2)} USDC` },
        { label: "Price", value: price },
        { label: "Reduce Only", value: idx % 2 === 0 ? "No" : "Yes" },
        { label: "TP/SL", value: "N/A", tone: "muted" },
        {
          label: "Status",
          value: status,
          tone:
            status === "Filled"
              ? "positive"
              : status === "Canceled"
                ? "negative"
                : "default",
        },
        { label: "Order ID", value: `${332726884650 + idx * 913}` },
      ],
    };
  },
);

const toneClassName = (tone: DetailTone = "default") => {
  if (tone === "positive") return "text-text-quaternary-dark";
  if (tone === "negative") return "text-text-senary-dark";
  if (tone === "muted") return "text-text-octonary-dark";
  return "text-text-primary-dark";
};

const importantSummaryTone = (value: string): DetailTone => {
  if (value.includes("-$")) return "negative";
  if (value.includes("+$")) return "positive";
  if (value.toLowerCase() === "filled" || value.toLowerCase() === "open")
    return "positive";
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

const BASE_TABS: TabConfig[] = [
  {
    key: "balances",
    label: "Balances",
    count: 0,
    rows: [],
  },
  {
    key: "positions",
    label: "Positions",
    count: 0,
    rows: [],
  },
  {
    key: "openOrders",
    label: "Open Orders",
    count: 0,
    rows: [],
  },
  {
    key: "tradeHistory",
    label: "Trade History",
    count: TRADE_HISTORY_ROWS.length,
    rows: TRADE_HISTORY_ROWS,
  },
  {
    key: "fundingHistory",
    label: "Funding History",
    count: FUNDING_HISTORY_ROWS.length,
    rows: FUNDING_HISTORY_ROWS,
  },
  {
    key: "orderHistory",
    label: "Order History",
    count: ORDER_HISTORY_ROWS.length,
    rows: ORDER_HISTORY_ROWS,
  },
];

const TAB_META: Record<TabKey, TabMeta> = {
  balances: {
    icon: "credit-card",
    leftLabel: "Total",
    rightLabel: "USDC Value",
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
  balances?: Balance[];
  positions?: Position[];
  openOrders?: OpenOrder[];
  isBalancesLoading?: boolean;
  isPositionsLoading?: boolean;
  isOpenOrdersLoading?: boolean;
  balancesError?: string | null;
  positionsError?: string | null;
  openOrdersError?: string | null;
  onTabChange: (tab: TabKey) => void;
  onToggleCard: (cardId: string) => void;
  mode?: "header" | "content";
};

export const MarketAccountOverview: React.FC<MarketAccountOverviewProps> = ({
  activeTab,
  expandedCards,
  balances = [],
  positions = [],
  openOrders = [],
  isBalancesLoading = false,
  isPositionsLoading = false,
  isOpenOrdersLoading = false,
  balancesError = null,
  positionsError = null,
  openOrdersError = null,
  onTabChange,
  onToggleCard,
  mode = "content",
}) => {
  const markets = useMarketStore((state) => state.markets);
  const markPriceByCoin = React.useMemo(() => {
    const map = new Map<string, string>();
    markets.forEach((market) => {
      const rawMark = market.mark ?? market.lastPrice;
      map.set(market.coin, rawMark != null ? rawMark.toString() : "--");
    });
    return map;
  }, [markets]);
  const tabs = React.useMemo(
    () =>
      BASE_TABS.map((tab) =>
        tab.key === "balances"
          ? {
              ...tab,
              count: balances.length,
            }
          : tab.key === "positions"
            ? {
                ...tab,
                count: positions.length,
                rows: [],
              }
            : tab.key === "openOrders"
              ? {
                  ...tab,
                  count: openOrders.length,
                  rows: [],
                }
            : tab,
      ),
    [balances, openOrders, positions.length],
  );
  const balanceCardIds = React.useMemo(
    () => balances.map((balance, idx) => `balance-${idx}-${balance.coin}`),
    [balances],
  );
  const positionCardIds = React.useMemo(
    () =>
      positions.map((item, idx) => {
        const coin = item.position?.coin ?? "Unknown";
        return `position-${coin}-${idx}`;
      }),
    [positions],
  );
  const openOrderCardIds = React.useMemo(
    () =>
      openOrders.map((order, idx) => {
        const orderData = order as Record<string, unknown>;
        const orderId = String(orderData.oid ?? orderData.orderId ?? idx);
        return `open-order-${orderId}-${idx}`;
      }),
    [openOrders],
  );
  const activeTabData = tabs.find((tab) => tab.key === activeTab) ?? tabs[0];
  const activeMeta = TAB_META[activeTab];
  const isHistoryTab =
    activeTab === "tradeHistory" ||
    activeTab === "fundingHistory" ||
    activeTab === "orderHistory";
  const allRowsExpanded =
    activeTab === "balances"
      ? balanceCardIds.length > 0 &&
        balanceCardIds.every((id) => Boolean(expandedCards[id]))
      : activeTab === "positions"
        ? positionCardIds.length > 0 &&
          positionCardIds.every((id) => Boolean(expandedCards[id]))
        : activeTab === "openOrders"
          ? openOrderCardIds.length > 0 &&
            openOrderCardIds.every((id) => Boolean(expandedCards[id]))
        : activeTabData.rows.length > 0 &&
          activeTabData.rows.every((row) => Boolean(expandedCards[row.id]));

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
                {tabs.map((tab, index) => {
                  const isActive = activeTab === tab.key;
                  return (
                    <AppButton
                      key={tab.key}
                      variant={VARIANT_TYPES.NOT_SELECTED}
                      className={cn(
                        "h-9 px-2.5 rounded-lg border flex-row items-center gap-1.5",
                        index < tabs.length - 1 ? "mr-2" : "",
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
                          isActive
                            ? "text-text-primary-dark"
                            : "text-text-octonary-dark",
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
              if (activeTab === "balances") {
                balanceCardIds.forEach((id) => {
                  const isOpen = Boolean(expandedCards[id]);
                  if (shouldExpand && !isOpen) onToggleCard(id);
                  if (!shouldExpand && isOpen) onToggleCard(id);
                });
                return;
              }
              if (activeTab === "positions") {
                positionCardIds.forEach((id) => {
                  const isOpen = Boolean(expandedCards[id]);
                  if (shouldExpand && !isOpen) onToggleCard(id);
                  if (!shouldExpand && isOpen) onToggleCard(id);
                });
                return;
              }
              if (activeTab === "openOrders") {
                openOrderCardIds.forEach((id) => {
                  const isOpen = Boolean(expandedCards[id]);
                  if (shouldExpand && !isOpen) onToggleCard(id);
                  if (!shouldExpand && isOpen) onToggleCard(id);
                });
                return;
              }
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
      {activeTab === "balances" && isBalancesLoading ? (
        <View className="rounded-xl border border-border-primary-dark/35 bg-bg-primary-dark px-4 py-6 items-center">
          <ActivityIndicator size="small" color="#50fa7b" />
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-[11px] text-text-octonary-dark mt-2"
          >
            Loading balances...
          </AppText>
        </View>
      ) : null}

      {activeTab === "positions" && isPositionsLoading ? (
        <View className="rounded-xl border border-border-primary-dark/35 bg-bg-primary-dark px-4 py-6 items-center">
          <ActivityIndicator size="small" color="#50fa7b" />
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-[11px] text-text-octonary-dark mt-2"
          >
            Loading positions...
          </AppText>
        </View>
      ) : null}

      {activeTab === "openOrders" && isOpenOrdersLoading ? (
        <View className="rounded-xl border border-border-primary-dark/35 bg-bg-primary-dark px-4 py-6 items-center">
          <ActivityIndicator size="small" color="#50fa7b" />
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-[11px] text-text-octonary-dark mt-2"
          >
            Loading open orders...
          </AppText>
        </View>
      ) : null}

      {activeTab === "balances" &&
      !isBalancesLoading &&
      balances.length === 0 ? (
        <View className="rounded-xl border border-border-primary-dark/35 bg-bg-primary-dark px-4 py-6 items-center">
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-[12px] font-semibold text-text-primary-dark"
          >
            {balancesError ? "Unable to load balances" : "No balances found"}
          </AppText>
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-[10px] text-text-octonary-dark mt-1 text-center"
          >
            {balancesError ?? "Connect wallet and try again."}
          </AppText>
        </View>
      ) : null}

      {activeTab === "positions" &&
      !isPositionsLoading &&
      positions.length === 0 ? (
        <View className="rounded-xl border border-border-primary-dark/35 bg-bg-primary-dark px-4 py-6 items-center">
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-[12px] font-semibold text-text-primary-dark"
          >
            {positionsError ? "Unable to load positions" : "No positions found"}
          </AppText>
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-[10px] text-text-octonary-dark mt-1 text-center"
          >
            {positionsError ?? "Open a position to see it here."}
          </AppText>
        </View>
      ) : null}

      {activeTab === "openOrders" &&
      !isOpenOrdersLoading &&
      openOrders.length === 0 ? (
        <View className="rounded-xl border border-border-primary-dark/35 bg-bg-primary-dark px-4 py-6 items-center">
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-[12px] font-semibold text-text-primary-dark"
          >
            {openOrdersError
              ? "Unable to load open orders"
              : "No open orders found"}
          </AppText>
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-[10px] text-text-octonary-dark mt-1 text-center"
          >
            {openOrdersError ?? "Place an order to see it here."}
          </AppText>
        </View>
      ) : null}

      {!(
        (activeTab === "balances" &&
          (isBalancesLoading || balances.length === 0)) ||
        (activeTab === "positions" &&
          (isPositionsLoading || positions.length === 0)) ||
        (activeTab === "openOrders" &&
          (isOpenOrdersLoading || openOrders.length === 0))
      ) &&
        (activeTab === "balances"
          ? balances
          : activeTab === "positions"
            ? positions
            : activeTab === "openOrders"
              ? openOrders
              : activeTabData.rows
        ).map((item, idx) => {
          const isBalance = activeTab === "balances";
          const isPosition = activeTab === "positions";
          const isOpenOrder = activeTab === "openOrders";
          const row = !isBalance && !isPosition && !isOpenOrder ? (item as CardData) : null;
          const balance = isBalance ? (item as Balance) : null;
          const positionItem = isPosition ? (item as Position) : null;
          const openOrder = isOpenOrder ? (item as OpenOrder) : null;
          const openOrderData = (openOrder ?? {}) as Record<string, unknown>;
          const openOrderType = String(openOrderData.orderType ?? "Limit");
          const openOrderTimestamp = openOrderData.timestamp;
          const formattedOpenOrderDateTime = formatDateTimeAccordingToFormat({
            timeStamp:
              typeof openOrderTimestamp === "number" ||
              typeof openOrderTimestamp === "string" ||
              openOrderTimestamp instanceof Date
                ? openOrderTimestamp
                : null,
            format: DATE_TIME_FORMAT.DD_MM_YYYY_HH_MM_SS,
          });
          const openOrderSideCode = String(openOrderData.side ?? "").toUpperCase();
          const openOrderDirection =
            openOrderSideCode === "B"
              ? "Long"
              : openOrderSideCode === "A"
                ? "Short"
                : "Short";
          const openOrderSize = Number.parseFloat(String(openOrderData.sz ?? "0"));
          const openOrderFormattedSize = Number.isFinite(openOrderSize)
            ? openOrderSize.toFixed(5)
            : "--";
          const openOrderOriginalSize = Number.parseFloat(
            String(openOrderData.origSz ?? "0"),
          );
          const openOrderFormattedOriginalSize = Number.isFinite(openOrderOriginalSize)
            ? openOrderOriginalSize.toFixed(5)
            : "--";
          const openOrderLimitPrice = Number.parseFloat(
            String(openOrderData.limitPx ?? "0"),
          );
          const openOrderOrderValue =
            Number.isFinite(openOrderLimitPrice) &&
            openOrderLimitPrice > 0 &&
            Number.isFinite(openOrderSize) &&
            openOrderSize > 0
              ? `${(openOrderLimitPrice * openOrderSize).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} USDC`
              : "--";
          const openOrderPriceValue =
            Number.isFinite(openOrderLimitPrice) && openOrderLimitPrice > 0
              ? openOrderLimitPrice.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })
              : "--";
          const openOrderReduceOnly = Boolean(openOrderData.reduceOnly);
          const openOrderTriggerConditions = String(
            openOrderData.triggerCondition ?? "N/A",
          );
          const openOrderTpSl = "--";
          const openOrderId = String(
            openOrderData.oid ?? openOrderData.orderId ?? idx,
          );
          const position = positionItem?.position;
          const positionCoin = position?.coin ?? "Unknown";
          const positionLeverageLabel =
            position?.leverage?.value != null
              ? `${position.leverage.value}x`
              : "--";
          const positionSize = Number(position?.szi ?? 0);
          const positionAbsSize = Math.abs(positionSize);
          const rawPositionSizeDecimals = position?.szi?.includes(".")
            ? (position.szi.split(".")[1]?.replace(/0+$/, "").length ?? 0)
            : 0;
          const positionSizeDecimals = Math.min(
            Math.max(rawPositionSizeDecimals, 2),
            6,
          );
          const formattedPositionSize = `${addDecimals(positionAbsSize, positionSizeDecimals)} ${positionCoin}`;
          const positionEntryPrice = Number(position?.entryPx ?? 0);
          const formattedEntryPrice =
            Number.isFinite(positionEntryPrice) && positionEntryPrice > 0
              ? `${addDecimals(positionEntryPrice, 3)}`
              : "--";
          const positionValue = Number(position?.positionValue ?? 0);
          const formattedPositionValue = `$${addDecimals(positionValue, 2)} USDC`;
          const positionUnrealizedPnl = Number(position?.unrealizedPnl ?? 0);
          const positionMarginUsed = Number(position?.marginUsed ?? 0);
          const formattedMargin = `$${addDecimals(positionMarginUsed, 2)}`;
          const positionRoePercent =
            Number(position?.returnOnEquity ?? 0) * 100;
          const positionLeverageType = position?.leverage?.type ?? "cross";
          const positionLeverageTypeLabel =
            positionLeverageType === "isolated" ? "Isolated" : "Cross";
          const positionFunding = Number(position?.cumFunding?.sinceOpen ?? 0);
          const positionSide = positionSize >= 0 ? "Long" : "Short";
          const positionWithMark = position as
            | (Position["position"] & {
                markPx?: string;
                markPrice?: string;
              })
            | undefined;
          const positionMarkPrice =
            positionWithMark?.markPx ??
            positionWithMark?.markPrice ??
            markPriceByCoin.get(positionCoin);
          const computedMarkPrice =
            positionAbsSize > 0
              ? `${addDecimals(positionValue / positionAbsSize, 3)}`
              : "--";
          const parsedMarkPrice = Number(positionMarkPrice);
          const formattedMarkPrice =
            positionMarkPrice != null &&
            positionMarkPrice !== "--" &&
            Number.isFinite(parsedMarkPrice)
              ? `${addDecimals(parsedMarkPrice, 3)}`
              : computedMarkPrice;
          const liquidationPrice = Number(position?.liquidationPx ?? NaN);
          const formattedLiqPrice =
            Number.isFinite(liquidationPrice) && liquidationPrice > 0
              ? `${addDecimals(liquidationPrice, 3)}`
              : "--";
          const rowId = isBalance
            ? `balance-${idx}-${balance?.coin ?? ""}`
            : isPosition
              ? `position-${positionCoin}-${idx}`
              : isOpenOrder
                ? `open-order-${openOrderId}-${idx}`
                : (row?.id ?? "");
          const rowTitle = isBalance
            ? (balance?.coin ?? "")
            : isPosition
              ? `${positionCoin} ${positionLeverageLabel}`
              : isOpenOrder
                ? `${openOrder?.coin ?? ""} ${openOrderDirection}`
                : (row?.title ?? "");
          const rowSubtitle = isBalance
            ? undefined
            : isPosition
              ? positionSide
              : isOpenOrder
                ? openOrderDirection
                : row?.subtitle;
          const rowSummaryLeft = isBalance
            ? (balance?.total_balance ?? "")
            : isPosition
              ? formattedPositionSize
              : isOpenOrder
                ? `${toTitleCase(openOrderType)} • ${openOrderFormattedSize}`
                : (row?.summaryLeft ?? "");
          const rowSummaryRight = isBalance
            ? (balance?.available_balance ?? "")
            : isPosition
              ? `${formatPnlMoney(positionUnrealizedPnl)} (${formatRoePercent(positionRoePercent)})`
              : isOpenOrder
                ? openOrderOrderValue
                : (row?.summaryRight ?? "");
          const rowSummaryLeftLabel = isBalance
            ? "Total"
            : activeMeta.leftLabel;
          const rowSummaryRightLabel = isBalance
            ? "Available"
            : activeMeta.rightLabel;
          const openOrderCompactMetrics: DetailItem[] = isOpenOrder
            ? [
                { label: "Type", value: toTitleCase(openOrderType) },
                { label: "Size", value: openOrderFormattedSize },
                {
                  label: "Order Value",
                  value: openOrderOrderValue,
                },
                { label: "Price", value: String(openOrderPriceValue) },
                {
                  label: "Reduce Only",
                  value: openOrderReduceOnly ? "Yes" : "No",
                },
                {
                  label: "Trigger",
                  value: openOrderTriggerConditions,
                },
              ]
            : [];
          const positionCompactMetrics: DetailItem[] = isPosition
            ? [
                { label: "Size", value: formattedPositionSize },
                {
                  label: "Pos Value",
                  value: formattedPositionValue,
                },
                {
                  label: "Entry",
                  value: formattedEntryPrice,
                },
                { label: "Mark", value: formattedMarkPrice },
                {
                  label: "PnL",
                  value: `${formatPnlMoney(positionUnrealizedPnl)} (${formatRoePercent(positionRoePercent)})`,
                  tone: positionUnrealizedPnl >= 0 ? "positive" : "negative",
                },
                { label: "Liq", value: formattedLiqPrice },
                {
                  label: "Margin",
                  value: `${formattedMargin} (${positionLeverageTypeLabel})`,
                },
                {
                  label: "Funding",
                  value: formatFundingMoney(positionFunding),
                  tone: positionFunding <= 0 ? "positive" : "negative",
                },
              ]
            : [];
          const rowDetails: DetailItem[] = isBalance
            ? [
                { label: "Coin", value: balance?.coin ?? "" },
                {
                  label: "Total Balance",
                  value: balance?.total_balance ?? "",
                },
                {
                  label: "Available Balance",
                  value: balance?.available_balance ?? "",
                },
                {
                  label: "USDC Value",
                  value: formatMoney(balance?.usdc_value ?? 0),
                },
              ]
            : isPosition
              ? [
                  {
                    label: "Coin",
                    value: `${positionCoin} ${positionLeverageLabel}`,
                  },
                  {
                    label: "Direction",
                    value: positionSide,
                    tone: positionSize >= 0 ? "positive" : "negative",
                  },
                  { label: "Size", value: formattedPositionSize },
                  {
                    label: "Position Value",
                    value: formattedPositionValue,
                  },
                  {
                    label: "Entry Price",
                    value: formattedEntryPrice,
                  },
                  {
                    label: "Mark Price",
                    value: formattedMarkPrice,
                  },
                  {
                    label: "PnL (ROE %)",
                    value: `${formatPnlMoney(positionUnrealizedPnl)} (${formatRoePercent(positionRoePercent)})`,
                    tone: positionUnrealizedPnl >= 0 ? "positive" : "negative",
                  },
                  { label: "Liq. Price", value: formattedLiqPrice },
                  {
                    label: "Margin",
                    value: `${formattedMargin} (${positionLeverageTypeLabel})`,
                  },
                  {
                    label: "Funding",
                    value: formatFundingMoney(positionFunding),
                    tone: positionFunding <= 0 ? "positive" : "negative",
                  },
                ]
              : isOpenOrder
                ? [
                    { label: "Date and Time", value: formattedOpenOrderDateTime },
                    { label: "Order Type", value: toTitleCase(openOrderType) },
                    { label: "Coin", value: openOrder?.coin ?? "" },
                    {
                      label: "Direction",
                      value: openOrderDirection,
                      tone:
                        openOrderDirection.toLowerCase() === "long"
                          ? "positive"
                          : "negative",
                    },
                    { label: "Size", value: openOrderFormattedSize },
                    { label: "Original Size", value: openOrderFormattedOriginalSize },
                    {
                      label: "Order Value",
                      value: openOrderOrderValue,
                    },
                    { label: "Price", value: String(openOrderPriceValue) },
                    {
                      label: "Reduce Only",
                      value: openOrderReduceOnly ? "Yes" : "No",
                    },
                    {
                      label: "Trigger Conditions",
                      value: openOrderTriggerConditions,
                    },
                    { label: "TP/SL", value: openOrderTpSl },
                    {
                      label: "Order ID",
                      value: openOrderId,
                    },
                  ]
              : (row?.details ?? []);
          const isOpen = Boolean(expandedCards[rowId]);
          const rowSummaryTone: DetailTone = isBalance
            ? "default"
            : isPosition
              ? positionUnrealizedPnl >= 0
                ? "positive"
                : "negative"
              : importantSummaryTone(rowSummaryRight);
          const shouldShowSummaryBadge =
            !isBalance && rowSummaryTone !== "default";
          return (
            <View
              key={rowId}
              className={cn(
                "rounded-xl border overflow-hidden",
                isBalance
                  ? isOpen
                    ? "border-border-secondary-dark bg-bg-secondary-dark"
                    : "border-border-secondary-dark bg-bg-secondary-dark"
                  : isPosition
                    ? isOpen
                      ? "border-bg-senary-dark/60 bg-bg-secondary-dark"
                      : "border-border-secondary-dark bg-bg-secondary-dark"
                    : isOpenOrder
                      ? isOpen
                        ? "border-bg-senary-dark/60 bg-bg-secondary-dark"
                        : "border-border-secondary-dark bg-bg-secondary-dark"
                    : isOpen
                      ? "border-bg-senary-dark/50 bg-bg-primary-dark"
                      : "border-border-primary-dark/35 bg-bg-primary-dark",
                isBalance || isPosition || isOpenOrder ? "shadow-sm shadow-black/20" : "",
              )}
            >
              <AppButton
                variant={VARIANT_TYPES.NOT_SELECTED}
                className={cn(
                  "px-3 py-3.5",
                  isBalance || isPosition || isOpenOrder ? "py-3" : "",
                )}
                onPress={() => onToggleCard(rowId)}
              >
                <View className="gap-2">
                  <View className="flex-row items-center justify-between gap-2">
                    <View className="flex-row items-center gap-2 flex-1 min-w-0">
                      <View
                        className={cn(
                          "rounded-full items-center justify-center border",
                          isBalance
                            ? "h-6 w-6 bg-bg-quaternary-dark border-border-primary-dark/80"
                            : isPosition
                              ? "h-6 w-6 bg-bg-quaternary-dark border-border-primary-dark/80"
                              : isOpenOrder
                                ? "h-6 w-6 bg-bg-quaternary-dark border-border-primary-dark/80"
                              : "h-5 w-5 bg-bg-tertiary-dark border-border-primary-dark/60",
                        )}
                      >
                        <Feather
                          name={activeMeta.icon}
                          size={isBalance || isPosition || isOpenOrder ? 11 : 10}
                          color={
                            isBalance
                              ? "#cbd5e1"
                              : isPosition
                                ? "#86efac"
                                : isOpenOrder
                                  ? "#86efac"
                                : "#94a3b8"
                          }
                        />
                      </View>
                      <AppText
                        variant={VARIANT_TYPES.NOT_SELECTED}
                        className={cn(
                          "font-bold text-text-primary-dark",
                          isBalance
                            ? "text-[16px]"
                            : isPosition
                              ? "text-[15px]"
                              : isOpenOrder
                                ? "text-[15px]"
                              : "text-[13px]",
                        )}
                        numberOfLines={1}
                      >
                        {rowTitle}
                      </AppText>
                      {rowSubtitle ? (
                        <View
                          className={cn(
                            "h-5 px-2 rounded-full border items-center justify-center",
                            isPosition
                              ? rowSubtitle.toLowerCase() === "long"
                                ? "bg-[#073b2a] border-[#1d7f5f]"
                                : "bg-[#3a1318] border-[#7f1d2b]"
                              : isOpenOrder
                                ? rowSubtitle.toLowerCase() === "long"
                                  ? "bg-[#073b2a] border-[#1d7f5f]"
                                  : "bg-[#3a1318] border-[#7f1d2b]"
                              : "bg-bg-tertiary-dark border-border-primary-dark/70",
                          )}
                        >
                          <AppText
                            variant={VARIANT_TYPES.NOT_SELECTED}
                            className={cn(
                              "text-[9px] uppercase font-semibold tracking-[0.6px]",
                              isPosition
                                ? rowSubtitle.toLowerCase() === "long"
                                  ? "text-[#52f2a8]"
                                  : "text-[#fb7185]"
                                : isOpenOrder
                                  ? rowSubtitle.toLowerCase() === "long"
                                    ? "text-[#52f2a8]"
                                    : "text-[#fb7185]"
                                : "text-text-octonary-dark",
                            )}
                            numberOfLines={1}
                          >
                            {rowSubtitle}
                          </AppText>
                        </View>
                      ) : null}
                    </View>
                    <View className="flex-row items-center gap-1.5">
                      {isOpenOrder ? (
                        <AppButton
                          variant={VARIANT_TYPES.NOT_SELECTED}
                          className="h-6 px-2 rounded-md border border-[#7f1d2b] bg-[#251217] items-center justify-center"
                          onPress={() => {}}
                        >
                          <AppText
                            variant={VARIANT_TYPES.NOT_SELECTED}
                            className="text-[9px] font-semibold text-[#fb7185] uppercase tracking-[0.6px]"
                          >
                            Cancel
                          </AppText>
                        </AppButton>
                      ) : null}
                      <View
                        className={cn(
                          "w-6 h-6 rounded-full border items-center justify-center",
                          isBalance
                            ? isOpen
                              ? "border-border-primary-dark/80 bg-bg-quaternary-dark"
                              : "border-border-primary-dark/80 bg-bg-quaternary-dark"
                            : isPosition
                              ? isOpen
                                ? "border-bg-senary-dark/60 bg-bg-senary-dark/10"
                                : "border-border-primary-dark/80 bg-bg-quaternary-dark"
                              : isOpen
                                ? "border-bg-senary-dark/60 bg-bg-senary-dark/10"
                                : "border-border-primary-dark/70 bg-bg-tertiary-dark",
                        )}
                      >
                        <Feather
                          name={isOpen ? "chevron-up" : "chevron-down"}
                          size={13}
                          color={
                            isBalance
                              ? isOpen
                                ? "#e2e8f0"
                                : "#cbd5e1"
                              : isPosition
                                ? isOpen
                                  ? "#50fa7b"
                                  : "#cbd5e1"
                                : isOpen
                                  ? "#50fa7b"
                                  : "#64748b"
                          }
                        />
                      </View>
                    </View>
                  </View>

                  {isPosition && !isOpen ? (
                      <View className="mt-2 rounded-lg bg-bg-quaternary-dark px-2.5 py-2 border border-border-primary-dark/80">
                        <View className="flex-row flex-wrap">
                          {positionCompactMetrics.map((metric) => (
                            <View
                              key={`${rowId}-${metric.label}`}
                              className="w-1/2 pr-2 mb-2"
                            >
                              <AppText
                                variant={VARIANT_TYPES.NOT_SELECTED}
                                className="text-[9px] uppercase tracking-[0.7px] text-text-secondary-dark font-semibold"
                                numberOfLines={1}
                              >
                                {metric.label}
                              </AppText>
                              <AppText
                                variant={VARIANT_TYPES.NOT_SELECTED}
                                className={cn(
                                  "text-[12px] font-semibold mt-[1px]",
                                  toneClassName(metric.tone),
                                )}
                                numberOfLines={1}
                              >
                                {metric.value}
                              </AppText>
                            </View>
                          ))}
                        </View>
                      </View>
                    ) : isOpenOrder && !isOpen ? (
                      <View className="mt-2 rounded-lg bg-bg-quaternary-dark px-2.5 py-2.5 border border-border-primary-dark/80">
                        <View className="flex-row flex-wrap">
                          {openOrderCompactMetrics.map((metric, metricIdx) => (
                            <View
                              key={`${rowId}-${metric.label}`}
                              className={cn(
                                "w-1/2 pr-2 pb-2",
                                metricIdx < openOrderCompactMetrics.length - 2
                                  ? "mb-1 border-b border-border-primary-dark/40"
                                  : "mb-0",
                              )}
                            >
                              <AppText
                                variant={VARIANT_TYPES.NOT_SELECTED}
                                className="text-[9px] uppercase tracking-[0.7px] text-text-secondary-dark font-semibold"
                                numberOfLines={1}
                              >
                                {metric.label}
                              </AppText>
                              <AppText
                                variant={VARIANT_TYPES.NOT_SELECTED}
                                className={cn(
                                  "text-[12px] font-semibold mt-[1px]",
                                  toneClassName(metric.tone),
                                )}
                                numberOfLines={1}
                              >
                                {metric.value}
                              </AppText>
                            </View>
                          ))}
                        </View>
                      </View>
                    ) : !isPosition ? (
                      <View
                        className={cn(
                          "flex-row items-center justify-between mt-2",
                          isBalance ? "gap-2.5" : "",
                        )}
                      >
                        <View
                          className={cn(
                            "flex-1 min-w-0",
                            isBalance
                              ? "rounded-lg bg-bg-quaternary-dark px-2.5 py-2 border border-border-primary-dark/80"
                              : "pr-2",
                          )}
                        >
                          <AppText
                            variant={VARIANT_TYPES.NOT_SELECTED}
                            className={cn(
                              "text-[10px] uppercase tracking-[0.7px]",
                              isBalance
                                ? "text-text-secondary-dark font-semibold"
                                : "text-text-octonary-dark",
                            )}
                          >
                            {rowSummaryLeftLabel}
                          </AppText>
                          <AppText
                            variant={VARIANT_TYPES.NOT_SELECTED}
                            className={cn(
                              "text-text-primary-dark font-semibold mt-[1px]",
                              isBalance ? "text-[14px]" : "text-[12px]",
                            )}
                            numberOfLines={1}
                          >
                            {rowSummaryLeft}
                          </AppText>
                        </View>
                        <View
                          className={cn(
                            "items-end flex-1 min-w-0",
                            isBalance
                              ? "rounded-lg bg-bg-quaternary-dark px-2.5 py-2 border border-border-primary-dark/80"
                              : "",
                          )}
                        >
                          <AppText
                            variant={VARIANT_TYPES.NOT_SELECTED}
                            className={cn(
                              "text-[10px] uppercase tracking-[0.7px]",
                              isBalance
                                ? "text-text-secondary-dark font-semibold"
                                : "text-text-octonary-dark",
                            )}
                          >
                            {rowSummaryRightLabel}
                          </AppText>
                          <AppText
                            variant={VARIANT_TYPES.NOT_SELECTED}
                            className={cn(
                              "font-semibold mt-[1px]",
                              isBalance
                                ? "text-[14px] text-text-primary-dark"
                                : "text-[12px] text-text-primary-dark",
                            )}
                            numberOfLines={1}
                          >
                            {rowSummaryRight}
                          </AppText>
                          {shouldShowSummaryBadge ? (
                            <View
                              className={cn(
                                "mt-1 h-5 px-2 rounded-full border items-center justify-center",
                                summaryBadgeClassName(rowSummaryTone),
                              )}
                            >
                              <AppText
                                variant={VARIANT_TYPES.NOT_SELECTED}
                                className={cn(
                                  "text-[8px] font-bold tracking-[0.8px]",
                                  summaryBadgeTextClassName(rowSummaryTone),
                                )}
                              >
                                {summaryBadgeLabel(rowSummaryTone)}
                              </AppText>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    ) : null}
                </View>
              </AppButton>

              {isOpen ? (
                <View
                  className={cn(
                    "px-3 pb-3 pt-1",
                    isBalance
                      ? "border-t border-border-primary-dark/70"
                      : isPosition
                        ? "border-t border-border-primary-dark/70"
                        : "border-t border-border-primary-dark/35",
                  )}
                >
                  <View>
                    {rowDetails.map((detail, detailIndex) => (
                      <View
                        key={`${rowId}-${detail.label}`}
                        className={cn(
                          "flex-row items-start justify-between gap-3 py-2",
                          detailIndex < rowDetails.length - 1
                            ? isBalance
                              ? "border-b border-border-primary-dark/40"
                              : isPosition
                                ? "border-b border-border-primary-dark/40"
                                : "border-b border-border-primary-dark/20"
                            : "",
                        )}
                      >
                        <AppText
                          variant={VARIANT_TYPES.NOT_SELECTED}
                          className={cn(
                            "text-[10px] uppercase tracking-[0.7px] font-semibold flex-1",
                            isBalance
                              ? "text-text-secondary-dark"
                              : isPosition
                                ? "text-text-secondary-dark"
                                : "text-text-octonary-dark",
                          )}
                        >
                          {detail.label}
                        </AppText>
                        <AppText
                          variant={VARIANT_TYPES.NOT_SELECTED}
                          className={cn(
                            "text-[11px] font-semibold text-right flex-1",
                            isPosition ? "text-[12px]" : "",
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
