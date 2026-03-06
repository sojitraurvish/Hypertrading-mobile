import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { DATE_TIME_FORMAT, VARIANT_TYPES } from "@/lib/constants";
import { formatDateTimeAccordingToFormat } from "@/lib/utils/date-oprations";
import { addDecimals } from "@/lib/utils/decimals";
import { cn } from "@/lib/utils/tailwind-configs";
import { useMarketStore } from "@/store/markets";
import type {
  Balance,
  FundingHistory,
  HistoricalOrder,
  OpenOrder,
  Position,
  TradeHistory,
} from "@/types/bottom-pannel";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { ScrollView as GestureScrollView } from "react-native-gesture-handler";

const INITIAL_HISTORY_RENDER_COUNT = 20;
const HISTORY_RENDER_BATCH_COUNT = 50;

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
};

type TabMeta = {
  icon: keyof typeof Feather.glyphMap;
  leftLabel: string;
  rightLabel: string;
  description: string;
};

const formatMoney = (value: number) => `$${value.toFixed(2)}`;
const formatPnlMoney = (value: number) =>
  value >= 0 ? `$${value.toFixed(2)}` : `-$${Math.abs(value).toFixed(2)}`;
const formatFundingMoney = (value: number) =>
  value >= 0 ? `-$${value.toFixed(2)}` : `$${Math.abs(value).toFixed(2)}`;
const formatRoePercent = (value: number) =>
  `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

const toTitleCase = (value: string) =>
  value.length > 0
    ? value[0].toUpperCase() + value.slice(1).toLowerCase()
    : value;

const formatSignedNumber = (value: number, decimals = 2) =>
  `${value >= 0 ? "+" : ""}${addDecimals(value, decimals)}`;

const getDirectionFromSide = (side?: string) => {
  const sideCode = String(side ?? "").toUpperCase();
  if (sideCode === "B") return "Long";
  if (sideCode === "A") return "Short";
  return "Unknown";
};

const tradeHistoryToCard = (trade: TradeHistory, idx: number): CardData => {
  const coin = trade.coin ?? "--";
  const direction = trade.dir ?? getDirectionFromSide(trade.side);
  const price = Number(trade.px ?? 0);
  const size = Number(trade.sz ?? 0);
  const tradeValue =
    Number.isFinite(price) && Number.isFinite(size)
      ? price * Math.abs(size)
      : 0;
  const fee = Number(trade.fee ?? 0);
  return {
    id: `trade-history-${trade.tid}-${idx}`,
    title: direction,
    subtitle: undefined,
    summaryLeft: `${coin} @ ${Number.isFinite(price) ? addDecimals(price, 3) : "--"}`,
    summaryRight: `${addDecimals(tradeValue, 2)} USDC`,
    details: [
      {
        label: "Time",
        value: formatDateTimeAccordingToFormat({
          timeStamp: trade.time,
          format: DATE_TIME_FORMAT.DD_MM_YYYY_HH_MM_SS,
        }),
      },
      { label: "Coin", value: coin },
      {
        label: "Direction",
        value: direction,
        tone:
          direction.toLowerCase().includes("long") ||
          direction.toLowerCase().includes("buy")
            ? "positive"
            : "negative",
      },
      {
        label: "Price",
        value: Number.isFinite(price) ? `${addDecimals(price, 3)}` : "--",
      },
      { label: "Size", value: `${addDecimals(Math.abs(size), 6)} ${coin}` },
      { label: "Trade Value", value: `${addDecimals(tradeValue, 2)} USDC` },
      {
        label: "Fee",
        value: `${addDecimals(fee, 8)} ${trade.feeToken ?? "USDC"}`,
      },
    ],
  };
};

const fundingHistoryToCard = (
  funding: FundingHistory,
  idx: number,
): CardData => {
  const coin = funding.delta?.coin ?? "--";
  const payment = Number(funding.delta?.usdc ?? 0);
  const size = Number(funding.delta?.szi ?? 0);
  const rate = Number(funding.delta?.fundingRate ?? 0);
  const ratePercent = Number.isFinite(rate) ? rate * 100 : 0;
  const positionSide = size >= 0 ? "Long" : "Short";
  return {
    id: `funding-history-${funding.hash}-${idx}`,
    title: coin,
    subtitle: "Coin",
    summaryLeft: `${addDecimals(Math.abs(size), 6)} ${coin}`,
    summaryRight: formatSignedNumber(payment, 4),
    details: [
      {
        label: "Time",
        value: formatDateTimeAccordingToFormat({
          timeStamp: funding.time,
          format: DATE_TIME_FORMAT.DD_MM_YYYY_HH_MM_SS,
        }),
      },
      { label: "Coin", value: coin },
      { label: "Size", value: `${addDecimals(Math.abs(size), 6)} ${coin}` },
      {
        label: "Position Side",
        value: positionSide,
        tone: positionSide === "Long" ? "positive" : "negative",
      },
      {
        label: "Payment",
        value: formatSignedNumber(payment, 4),
        tone: payment >= 0 ? "positive" : "negative",
      },
      {
        label: "Rate",
        value: `${ratePercent.toFixed(4)}%`,
        tone: ratePercent >= 0 ? "positive" : "negative",
      },
    ],
  };
};

const orderHistoryToCard = (
  historyOrder: HistoricalOrder,
  idx: number,
): CardData => {
  const order = historyOrder.order ?? ({} as HistoricalOrder["order"]);
  const coin = order.coin ?? "--";
  const status = String(historyOrder.status ?? "--");
  const statusLower = status.toLowerCase();
  const formatOrderStatus = (rawStatus: string) =>
    rawStatus
      .replace(/([A-Z])/g, " $1")
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  const formattedStatus = formatOrderStatus(status);
  const orderTypeRaw = String(order.orderType ?? "Limit");
  const isMarketOrder = orderTypeRaw.toLowerCase().includes("market");
  const orderType = isMarketOrder ? "Market" : "Limit";
  const side = String(order.side ?? "");
  const reduceOnly = Boolean(order.reduceOnly);
  const isPositionTpsl = Boolean(order.isPositionTpsl);
  const isCloseLong = reduceOnly || (side === "A" && !isPositionTpsl);
  const positionAction = isCloseLong ? "Close Long" : "Long";
  const positionTone: DetailTone = isCloseLong ? "negative" : "positive";
  const timestamp = historyOrder.statusTimestamp || order.timestamp;
  const formattedDateTime = formatDateTimeAccordingToFormat({
    timeStamp: timestamp,
    format: DATE_TIME_FORMAT.DD_MM_YYYY_HH_MM_SS,
  });
  const limitPx = String(order.limitPx ?? "");
  const triggerPx = String(order.triggerPx ?? "");
  const sz = String(order.sz ?? "");
  const origSz = String(order.origSz ?? "");
  const parsedLimitPx = Number.parseFloat(limitPx);
  const parsedTriggerPx = Number.parseFloat(triggerPx);
  const parsedSz = Number.parseFloat(sz);
  const parsedOrigSz = Number.parseFloat(origSz);
  const value1 =
    Number.isFinite(parsedLimitPx) && parsedLimitPx > 0
      ? String(addDecimals(parsedLimitPx, 5))
      : "--";
  const value2 =
    Number.isFinite(parsedTriggerPx) && parsedTriggerPx > 0
      ? String(addDecimals(parsedTriggerPx, 5))
      : "--";
  const amountQuantity = isMarketOrder
    ? "Market"
    : Number.isFinite(parsedSz) && parsedSz > 0
      ? parsedSz.toLocaleString("en-US", { maximumFractionDigits: 0 })
      : "--";
  const confirmation =
    statusLower === "filled" || formattedStatus.toLowerCase() === "filled"
      ? "Yes"
      : "No";
  const statusTone: DetailTone =
    statusLower === "filled"
      ? "positive"
      : statusLower === "open"
        ? "default"
        : statusLower === "canceled" ||
            statusLower === "cancelled" ||
            statusLower.includes("rejected")
          ? "negative"
          : "muted";
  const formattedSize =
    Number.isFinite(parsedOrigSz) && parsedOrigSz > 0
      ? parsedOrigSz.toLocaleString("en-US", {
          maximumFractionDigits: 5,
          minimumFractionDigits: 5,
        })
      : "--";
  const filledSizeNum =
    Number.isFinite(parsedOrigSz) && parsedOrigSz > 0
      ? parsedOrigSz - (Number.isFinite(parsedSz) ? parsedSz : 0)
      : 0;
  const filledSize =
    filledSizeNum > 0
      ? filledSizeNum.toLocaleString("en-US", {
          maximumFractionDigits: 5,
          minimumFractionDigits: 5,
        })
      : "0";
  const orderValue =
    isMarketOrder || statusLower === "filled"
      ? "--"
      : Number.isFinite(parsedLimitPx) &&
          parsedLimitPx > 0 &&
          Number.isFinite(parsedOrigSz) &&
          parsedOrigSz > 0
        ? `${(parsedLimitPx * parsedOrigSz).toLocaleString("en-US", {
            maximumFractionDigits: 2,
          })} USDC`
        : "--";
  const formattedPrice = isMarketOrder
    ? "Market"
    : Number.isFinite(parsedLimitPx) && parsedLimitPx > 0
      ? parsedLimitPx.toLocaleString("en-US", {
          minimumFractionDigits: 5,
          maximumFractionDigits: 5,
        })
      : Number.isFinite(parsedTriggerPx) && parsedTriggerPx > 0
        ? parsedTriggerPx.toLocaleString("en-US", {
            minimumFractionDigits: 5,
            maximumFractionDigits: 5,
          })
        : "--";
  const reduceOnlyText = reduceOnly ? "Yes" : "No";
  return {
    id: `order-history-${order.oid}-${idx}`,
    title: positionAction,
    subtitle: "Direction",
    summaryLeft: `${coin} • ${orderType}`,
    summaryRight: formattedStatus,
    details: [
      {
        label: "Date and Time",
        value: formattedDateTime,
      },
      {
        label: "Direction",
        value: positionAction,
        tone: positionTone,
      },
      { label: "Coin", value: coin },
      { label: "Order Type", value: orderType },
      { label: "Amount/Quantity", value: amountQuantity },
      { label: "Size", value: formattedSize },
      { label: "Filled Size", value: filledSize },
      {
        label: "Value 1",
        value: value1,
      },
      {
        label: "Value 2",
        value: value2,
      },
      { label: "Order Value", value: orderValue },
      { label: "Price", value: formattedPrice },
      { label: "Reduce Only", value: reduceOnlyText },
      { label: "Confirmation", value: confirmation },
      {
        label: "Status",
        value: formattedStatus,
        tone: statusTone,
      },
      { label: "Order ID", value: String(order.oid ?? "--") },
    ],
  };
};

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
  },
  {
    key: "positions",
    label: "Positions",
    count: 0,
  },
  {
    key: "openOrders",
    label: "Open Orders",
    count: 0,
  },
  {
    key: "tradeHistory",
    label: "Trade History",
    count: 0,
  },
  {
    key: "fundingHistory",
    label: "Funding History",
    count: 0,
  },
  {
    key: "orderHistory",
    label: "Order History",
    count: 0,
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
    rightLabel: "Notional",
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
  tradeHistory?: TradeHistory[];
  userFundings?: FundingHistory[];
  historicalOrders?: HistoricalOrder[];
  isBalancesLoading?: boolean;
  isPositionsLoading?: boolean;
  isOpenOrdersLoading?: boolean;
  isTradeHistoryLoading?: boolean;
  isUserFundingsLoading?: boolean;
  isHistoricalOrdersLoading?: boolean;
  balancesError?: string | null;
  positionsError?: string | null;
  openOrdersError?: string | null;
  tradeHistoryError?: string | null;
  fundingHistoryError?: string | null;
  orderHistoryError?: string | null;
  onTabChange: (tab: TabKey) => void;
  onToggleCard: (cardId: string) => void;
  onBalanceTransfer?: (direction: "toPerp" | "toSpot") => void;
  onOpenOrderCancel?: (params: {
    oid: number;
    coin: string;
    agentPrivateKey: `0x${string}`;
  }) => void;
  onClosePositionLimit?: (position: Position) => Promise<void> | void;
  onClosePositionMarket?: (position: Position) => Promise<void> | void;
  onReversePositionMarket?: (position: Position) => Promise<void> | void;
  onOpenOrdersCancelAll?: () => void;
  isOpenOrdersCancelLoading?: boolean;
  agentPrivateKey?: string;
  mode?: "header" | "content";
};

export const MarketAccountOverview: React.FC<MarketAccountOverviewProps> = ({
  activeTab,
  expandedCards,
  balances = [],
  positions = [],
  openOrders = [],
  tradeHistory = [],
  userFundings = [],
  historicalOrders = [],
  isBalancesLoading = false,
  isPositionsLoading = false,
  isOpenOrdersLoading = false,
  isTradeHistoryLoading = false,
  isUserFundingsLoading = false,
  isHistoricalOrdersLoading = false,
  balancesError = null,
  positionsError = null,
  openOrdersError = null,
  tradeHistoryError = null,
  fundingHistoryError = null,
  orderHistoryError = null,
  onTabChange,
  onToggleCard,
  onBalanceTransfer,
  onOpenOrderCancel,
  onClosePositionLimit,
  onClosePositionMarket,
  onReversePositionMarket,
  onOpenOrdersCancelAll,
  isOpenOrdersCancelLoading = false,
  agentPrivateKey,
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
      BASE_TABS.map((tab) => ({
        ...tab,
        count:
          tab.key === "balances"
            ? balances.length
            : tab.key === "positions"
              ? positions.length
              : tab.key === "openOrders"
                ? openOrders.length
                : tab.key === "tradeHistory"
                  ? tradeHistory.length
                  : tab.key === "fundingHistory"
                    ? userFundings.length
                    : historicalOrders.length,
      })),
    [
      balances.length,
      historicalOrders.length,
      openOrders.length,
      positions.length,
      tradeHistory.length,
      userFundings.length,
    ],
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
  const activeTabCount = activeTabData.count;
  const activeMeta = TAB_META[activeTab];
  const isHistoryTab =
    activeTab === "tradeHistory" ||
    activeTab === "fundingHistory" ||
    activeTab === "orderHistory";
  const [visibleHistoryCount, setVisibleHistoryCount] = React.useState(
    INITIAL_HISTORY_RENDER_COUNT,
  );
  React.useEffect(() => {
    if (isHistoryTab) {
      setVisibleHistoryCount(INITIAL_HISTORY_RENDER_COUNT);
    }
  }, [isHistoryTab, activeTab]);
  const activeTabItems = React.useMemo(() => {
    if (activeTab === "balances") return balances;
    if (activeTab === "positions") return positions;
    if (activeTab === "openOrders") return openOrders;
    // In header mode, expand/collapse all should apply to full history arrays
    // so cards revealed later in content mode inherit expanded state.
    if (mode === "header") {
      if (activeTab === "tradeHistory") return tradeHistory;
      if (activeTab === "fundingHistory") return userFundings;
      return historicalOrders;
    }
    if (activeTab === "tradeHistory")
      return tradeHistory.slice(0, visibleHistoryCount);
    if (activeTab === "fundingHistory")
      return userFundings.slice(0, visibleHistoryCount);
    return historicalOrders.slice(0, visibleHistoryCount);
  }, [
    activeTab,
    balances,
    historicalOrders,
    openOrders,
    positions,
    tradeHistory,
    userFundings,
    visibleHistoryCount,
    mode,
  ]);
  const activeHistoryCardIds = React.useMemo(() => {
    if (activeTab === "tradeHistory") {
      return (activeTabItems as TradeHistory[]).map(
        (trade, idx) => `trade-history-${trade.tid}-${idx}`,
      );
    }
    if (activeTab === "fundingHistory") {
      return (activeTabItems as FundingHistory[]).map(
        (funding, idx) => `funding-history-${funding.hash}-${idx}`,
      );
    }
    if (activeTab === "orderHistory") {
      return (activeTabItems as HistoricalOrder[]).map((historyOrder, idx) => {
        const orderId = historyOrder.order?.oid ?? "--";
        return `order-history-${orderId}-${idx}`;
      });
    }
    return [];
  }, [activeTab, activeTabItems]);
  const hasMoreHistoryRows =
    isHistoryTab && activeTabItems.length < activeTabCount;
  const loadedHistoryPercent =
    activeTabCount > 0
      ? Math.min(
          100,
          Math.round((activeTabItems.length / activeTabCount) * 100),
        )
      : 0;
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
          : activeHistoryCardIds.length > 0 &&
            activeHistoryCardIds.every((id) => Boolean(expandedCards[id]));

  if (mode === "header") {
    return (
      <View className="mx-1 -mt-[1px] rounded-xl border border-border-primary-dark/60 bg-bg-secondary-dark overflow-hidden z-20">
        <View className="px-2.5 pt-2 pb-2 border-b border-border-primary-dark/35 bg-bg-secondary-dark flex-row items-center">
          <View className="flex-1 mr-2">
            <GestureScrollView
              horizontal
              nestedScrollEnabled
              directionalLockEnabled
              keyboardShouldPersistTaps="handled"
              scrollEventThrottle={16}
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
                        onTabChange(tab.key);
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
            </GestureScrollView>
          </View>
          <View className="flex-row items-center gap-2">
            {activeTab === "openOrders" &&
            openOrders.length > 0 &&
            onOpenOrdersCancelAll ? (
              <AppButton
                variant={VARIANT_TYPES.NOT_SELECTED}
                className="h-9 px-2.5 rounded-lg border border-[#7f1d2b] bg-[#251217] flex-row items-center justify-center"
                isLoading={isOpenOrdersCancelLoading}
                isDisabled={isOpenOrdersLoading}
                onPress={onOpenOrdersCancelAll}
              >
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="text-[10px] font-semibold text-[#fb7185] uppercase tracking-[0.6px]"
                >
                  Cancel All
                </AppText>
              </AppButton>
            ) : null}
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
                activeHistoryCardIds.forEach((id) => {
                  const isOpen = Boolean(expandedCards[id]);
                  if (shouldExpand && !isOpen) onToggleCard(id);
                  if (!shouldExpand && isOpen) onToggleCard(id);
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
        </View>
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

      {activeTab === "tradeHistory" &&
      isTradeHistoryLoading &&
      activeTabCount === 0 ? (
        <View className="rounded-xl border border-border-primary-dark/35 bg-bg-primary-dark px-4 py-6 items-center">
          <ActivityIndicator size="small" color="#50fa7b" />
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-[11px] text-text-octonary-dark mt-2"
          >
            Loading trade history...
          </AppText>
        </View>
      ) : null}

      {activeTab === "fundingHistory" &&
      isUserFundingsLoading &&
      activeTabCount === 0 ? (
        <View className="rounded-xl border border-border-primary-dark/35 bg-bg-primary-dark px-4 py-6 items-center">
          <ActivityIndicator size="small" color="#50fa7b" />
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-[11px] text-text-octonary-dark mt-2"
          >
            Loading funding history...
          </AppText>
        </View>
      ) : null}

      {activeTab === "orderHistory" &&
      isHistoricalOrdersLoading &&
      activeTabCount === 0 ? (
        <View className="rounded-xl border border-border-primary-dark/35 bg-bg-primary-dark px-4 py-6 items-center">
          <ActivityIndicator size="small" color="#50fa7b" />
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-[11px] text-text-octonary-dark mt-2"
          >
            Loading order history...
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

      {activeTab === "tradeHistory" &&
      !isTradeHistoryLoading &&
      activeTabCount === 0 ? (
        <View className="rounded-xl border border-border-primary-dark/35 bg-bg-primary-dark px-4 py-6 items-center">
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-[12px] font-semibold text-text-primary-dark"
          >
            {tradeHistoryError
              ? "Unable to load trade history"
              : "No trade history found"}
          </AppText>
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-[10px] text-text-octonary-dark mt-1 text-center"
          >
            {tradeHistoryError ?? "No trade history available yet."}
          </AppText>
        </View>
      ) : null}

      {activeTab === "fundingHistory" &&
      !isUserFundingsLoading &&
      activeTabCount === 0 ? (
        <View className="rounded-xl border border-border-primary-dark/35 bg-bg-primary-dark px-4 py-6 items-center">
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-[12px] font-semibold text-text-primary-dark"
          >
            {fundingHistoryError
              ? "Unable to load funding history"
              : "No funding history found"}
          </AppText>
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-[10px] text-text-octonary-dark mt-1 text-center"
          >
            {fundingHistoryError ?? "No funding history available yet."}
          </AppText>
        </View>
      ) : null}

      {activeTab === "orderHistory" &&
      !isHistoricalOrdersLoading &&
      activeTabCount === 0 ? (
        <View className="rounded-xl border border-border-primary-dark/35 bg-bg-primary-dark px-4 py-6 items-center">
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-[12px] font-semibold text-text-primary-dark"
          >
            {orderHistoryError
              ? "Unable to load order history"
              : "No order history found"}
          </AppText>
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-[10px] text-text-octonary-dark mt-1 text-center"
          >
            {orderHistoryError ?? "No order history available yet."}
          </AppText>
        </View>
      ) : null}

      {!(
        (activeTab === "balances" &&
          (isBalancesLoading || balances.length === 0)) ||
        (activeTab === "positions" &&
          (isPositionsLoading || positions.length === 0)) ||
        (activeTab === "openOrders" &&
          (isOpenOrdersLoading || openOrders.length === 0)) ||
        (activeTab === "tradeHistory" && activeTabCount === 0) ||
        (activeTab === "fundingHistory" && activeTabCount === 0) ||
        (activeTab === "orderHistory" && activeTabCount === 0)
      ) &&
        activeTabItems.map((item, idx) => {
          const isBalance = activeTab === "balances";
          const isPosition = activeTab === "positions";
          const isOpenOrder = activeTab === "openOrders";
          const isTradeHistory = activeTab === "tradeHistory";
          const isFundingHistory = activeTab === "fundingHistory";
          const isOrderHistory = activeTab === "orderHistory";
          const row = isTradeHistory
            ? tradeHistoryToCard(item as TradeHistory, idx)
            : isFundingHistory
              ? fundingHistoryToCard(item as FundingHistory, idx)
              : isOrderHistory
                ? orderHistoryToCard(item as HistoricalOrder, idx)
                : null;
          const balance = isBalance ? (item as Balance) : null;
          const balanceCoin = String(balance?.coin ?? "").toLowerCase();
          const transferDirection = isBalance
            ? balanceCoin.includes("perps")
              ? ("toSpot" as const)
              : balanceCoin.includes("spot")
                ? ("toPerp" as const)
                : null
            : null;
          const transferLabel =
            transferDirection === "toSpot"
              ? "Transfer to Spot"
              : transferDirection === "toPerp"
                ? "Transfer to Perps"
                : null;
          const positionItem = isPosition ? (item as Position) : null;
          const openOrder = isOpenOrder ? (item as OpenOrder) : null;
          const openOrderData = isOpenOrder
            ? ((openOrder ?? {}) as Record<string, unknown>)
            : null;
          const openOrderType = isOpenOrder
            ? String(openOrderData?.orderType ?? "Limit")
            : "Limit";
          const openOrderTimestamp = isOpenOrder
            ? openOrderData?.timestamp
            : null;
          const formattedOpenOrderDateTime = isOpenOrder
            ? formatDateTimeAccordingToFormat({
                timeStamp:
                  typeof openOrderTimestamp === "number" ||
                  typeof openOrderTimestamp === "string" ||
                  openOrderTimestamp instanceof Date
                    ? openOrderTimestamp
                    : null,
                format: DATE_TIME_FORMAT.DD_MM_YYYY_HH_MM_SS,
              })
            : "--";
          const openOrderSideCode = isOpenOrder
            ? String(openOrderData?.side ?? "").toUpperCase()
            : "";
          const openOrderDirection =
            openOrderSideCode === "B"
              ? "Long"
              : openOrderSideCode === "A"
                ? "Short"
                : "Short";
          const openOrderSize = isOpenOrder
            ? Number.parseFloat(String(openOrderData?.sz ?? "0"))
            : 0;
          const openOrderFormattedSize = Number.isFinite(openOrderSize)
            ? openOrderSize.toFixed(5)
            : "--";
          const openOrderOriginalSize = isOpenOrder
            ? Number.parseFloat(String(openOrderData?.origSz ?? "0"))
            : 0;
          const openOrderFormattedOriginalSize = Number.isFinite(
            openOrderOriginalSize,
          )
            ? openOrderOriginalSize.toFixed(5)
            : "--";
          const openOrderLimitPrice = isOpenOrder
            ? Number.parseFloat(String(openOrderData?.limitPx ?? "0"))
            : 0;
          const openOrderOrderValue =
            Number.isFinite(openOrderLimitPrice) &&
            openOrderLimitPrice > 0 &&
            Number.isFinite(openOrderSize) &&
            openOrderSize > 0
              ? `${(openOrderLimitPrice * openOrderSize).toLocaleString(
                  "en-US",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  },
                )} USDC`
              : "--";
          const openOrderPriceValue =
            Number.isFinite(openOrderLimitPrice) && openOrderLimitPrice > 0
              ? openOrderLimitPrice.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })
              : "--";
          const openOrderReduceOnly = Boolean(openOrderData?.reduceOnly);
          const openOrderTriggerConditions = String(
            openOrderData?.triggerCondition ?? "N/A",
          );
          const openOrderTpSl = "--";
          const openOrderId = String(
            openOrderData?.oid ?? openOrderData?.orderId ?? idx,
          );
          const openOrderOid = Number(
            openOrderData?.oid ?? openOrderData?.orderId ?? Number.NaN,
          );
          const openOrderCoin = String(
            openOrderData?.coin ?? openOrder?.coin ?? "",
          );
          const canCancelOpenOrder =
            isOpenOrder &&
            Number.isFinite(openOrderOid) &&
            openOrderOid > 0 &&
            openOrderCoin.length > 0 &&
            Boolean(onOpenOrderCancel);
          const canClosePositionMarket =
            isPosition &&
            Boolean(positionItem?.position?.coin) &&
            Boolean(onClosePositionMarket);
          const canClosePositionLimit =
            isPosition &&
            Boolean(positionItem?.position?.coin) &&
            Boolean(onClosePositionLimit);
          const canReversePositionMarket =
            isPosition &&
            Boolean(positionItem?.position?.coin) &&
            Boolean(onReversePositionMarket);
          const position = positionItem?.position;
          const positionCoin = isPosition
            ? (position?.coin ?? "Unknown")
            : "--";
          const positionLeverageLabel =
            isPosition && position?.leverage?.value != null
              ? `${position.leverage.value}x`
              : "--";
          const positionSize = isPosition ? Number(position?.szi ?? 0) : 0;
          const positionAbsSize = Math.abs(positionSize);
          const rawPositionSizeDecimals =
            isPosition && position?.szi?.includes(".")
              ? (position.szi.split(".")[1]?.replace(/0+$/, "").length ?? 0)
              : 0;
          const positionSizeDecimals = Math.min(
            Math.max(rawPositionSizeDecimals, 2),
            6,
          );
          const formattedPositionSize = `${addDecimals(positionAbsSize, positionSizeDecimals)} ${positionCoin}`;
          const positionEntryPrice = isPosition
            ? Number(position?.entryPx ?? 0)
            : 0;
          const formattedEntryPrice =
            Number.isFinite(positionEntryPrice) && positionEntryPrice > 0
              ? `${addDecimals(positionEntryPrice, 3)}`
              : "--";
          const positionValue = isPosition
            ? Number(position?.positionValue ?? 0)
            : 0;
          const formattedPositionValue = `$${addDecimals(positionValue, 2)} USDC`;
          const positionUnrealizedPnl = isPosition
            ? Number(position?.unrealizedPnl ?? 0)
            : 0;
          const positionMarginUsed = isPosition
            ? Number(position?.marginUsed ?? 0)
            : 0;
          const formattedMargin = `$${addDecimals(positionMarginUsed, 2)}`;
          const positionRoePercent = isPosition
            ? Number(position?.returnOnEquity ?? 0) * 100
            : 0;
          const positionLeverageType = position?.leverage?.type ?? "cross";
          const positionLeverageTypeLabel =
            positionLeverageType === "isolated" ? "Isolated" : "Cross";
          const positionFunding = isPosition
            ? Number(position?.cumFunding?.sinceOpen ?? 0)
            : 0;
          const positionSide = positionSize >= 0 ? "Long" : "Short";
          const positionWithMark = isPosition
            ? (position as
                | (Position["position"] & {
                    markPx?: string;
                    markPrice?: string;
                  })
                | undefined)
            : undefined;
          const positionMarkPrice = isPosition
            ? (positionWithMark?.markPx ??
              positionWithMark?.markPrice ??
              markPriceByCoin.get(positionCoin))
            : "--";
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
          const liquidationPrice = isPosition
            ? Number(position?.liquidationPx ?? NaN)
            : NaN;
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
                    {
                      label: "Date and Time",
                      value: formattedOpenOrderDateTime,
                    },
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
                    {
                      label: "Original Size",
                      value: openOrderFormattedOriginalSize,
                    },
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
                        ? "border-bg-senary-dark/60 bg-bg-primary-dark"
                        : "border-border-primary-dark/50 bg-bg-primary-dark",
                "shadow-sm shadow-black/20",
              )}
            >
              <AppButton
                variant={VARIANT_TYPES.NOT_SELECTED}
                className={cn(
                  "px-3 py-3.5",
                  isBalance || isPosition || isOpenOrder ? "py-3" : "px-3.5",
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
                          size={
                            isBalance || isPosition || isOpenOrder ? 11 : 10
                          }
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
                                : "text-[14px]",
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
                      {isBalance &&
                      transferDirection &&
                      transferLabel &&
                      onBalanceTransfer ? (
                        <AppButton
                          variant={VARIANT_TYPES.NOT_SELECTED}
                          className="h-6 px-2 rounded-md border border-[#2d815f] bg-[#0a3a2a] items-center justify-center"
                          onPress={() => onBalanceTransfer(transferDirection)}
                        >
                          <AppText
                            variant={VARIANT_TYPES.NOT_SELECTED}
                            className="text-[9px] font-semibold text-[#52f2a8] uppercase tracking-[0.6px]"
                          >
                            {transferLabel}
                          </AppText>
                        </AppButton>
                      ) : null}
                      {isOpenOrder ? (
                        <AppButton
                          variant={VARIANT_TYPES.NOT_SELECTED}
                          className="h-6 px-2 rounded-md border border-[#7f1d2b] bg-[#251217] items-center justify-center"
                          isDisabled={
                            !canCancelOpenOrder || isOpenOrdersCancelLoading
                          }
                          onPress={() => {
                            if (agentPrivateKey) {
                              onOpenOrderCancel?.({
                                oid: openOrderOid,
                                coin: openOrderCoin,
                                agentPrivateKey:
                                  agentPrivateKey as `0x${string}`,
                              });
                            }
                          }}
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

                  {isPosition ? (
                    <View className="mt-2.5 flex-row items-center gap-2">
                      <AppButton
                        variant={VARIANT_TYPES.NOT_SELECTED}
                        className="h-7 flex-1 flex-row rounded-md border border-border-primary-dark/40 bg-bg-tertiary-dark items-center justify-center"
                        isDisabled={!canClosePositionLimit}
                        onPress={() => {
                          if (positionItem) {
                            void onClosePositionLimit?.(positionItem);
                          }
                        }}
                      >
                        <AppText
                          variant={VARIANT_TYPES.NOT_SELECTED}
                          className="text-[10px] font-semibold uppercase tracking-[0.7px] text-text-secondary-dark"
                        >
                          Limit
                        </AppText>
                      </AppButton>
                      <AppButton
                        variant={VARIANT_TYPES.NOT_SELECTED}
                        className="h-7 flex-1 flex-row rounded-md border border-border-primary-dark/40 bg-bg-tertiary-dark items-center justify-center"
                        isDisabled={!canClosePositionMarket}
                        onPress={() => {
                          if (positionItem) {
                            void onClosePositionMarket?.(positionItem);
                          }
                        }}
                      >
                        <AppText
                          variant={VARIANT_TYPES.NOT_SELECTED}
                          className="text-[10px] font-semibold uppercase tracking-[0.7px] text-text-secondary-dark"
                        >
                          Market
                        </AppText>
                      </AppButton>
                      <AppButton
                        variant={VARIANT_TYPES.NOT_SELECTED}
                        className="h-7 flex-1 flex-row rounded-md border border-border-primary-dark/40 bg-bg-tertiary-dark items-center justify-center"
                        isDisabled={!canReversePositionMarket}
                        onPress={() => {
                          if (positionItem) {
                            void onReversePositionMarket?.(positionItem);
                          }
                        }}
                      >
                        <AppText
                          variant={VARIANT_TYPES.NOT_SELECTED}
                          className="text-[10px] font-semibold uppercase tracking-[0.7px] text-text-secondary-dark"
                        >
                          Reverse
                        </AppText>
                      </AppButton>
                      <AppButton
                        variant={VARIANT_TYPES.NOT_SELECTED}
                        className="h-7 flex-1 flex-row rounded-md border border-border-primary-dark/40 bg-bg-tertiary-dark items-center justify-center"
                        onPress={() => {}}
                      >
                        <AppText
                          variant={VARIANT_TYPES.NOT_SELECTED}
                          className="text-[10px] font-semibold uppercase tracking-[0.7px] text-text-secondary-dark"
                        >
                          TP/SL
                        </AppText>
                      </AppButton>
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
        <View className="mt-2 rounded-xl border border-border-primary-dark/55 bg-bg-secondary-dark px-3 py-3">
          <View className="flex-row items-center justify-between mb-2.5">
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="text-[10px] uppercase tracking-[0.8px] text-text-tertiary-dark font-semibold"
            >
              Showing {activeTabItems.length} of {activeTabCount}
            </AppText>
            <View className="h-6 px-2.5 rounded-full border border-bg-senary-dark/40 bg-bg-senary-dark/10 items-center justify-center">
              <AppText
                variant={VARIANT_TYPES.NOT_SELECTED}
                className="text-[9px] font-bold uppercase tracking-[0.7px] text-text-quaternary-dark"
              >
                {loadedHistoryPercent}%
              </AppText>
            </View>
          </View>

          <View className="h-2 rounded-full bg-bg-quaternary-dark overflow-hidden border border-border-primary-dark/50">
            <View
              className="h-full rounded-full bg-bg-senary-dark"
              style={{ width: `${loadedHistoryPercent}%` }}
            />
          </View>

          <View className="mt-2.5 flex-row items-center gap-2">
            {hasMoreHistoryRows ? (
              <AppButton
                variant={VARIANT_TYPES.NOT_SELECTED}
                className="flex-1 h-9 px-2 rounded-lg bg-bg-senary-dark/15 border border-bg-senary-dark/55 items-center justify-center"
                onPress={() => {
                  setVisibleHistoryCount((previousCount) =>
                    Math.min(
                      previousCount + HISTORY_RENDER_BATCH_COUNT,
                      activeTabCount,
                    ),
                  );
                }}
              >
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="text-[10px] font-bold text-text-quaternary-dark uppercase tracking-[0.6px]"
                >
                  Load More (+
                  {Math.min(
                    HISTORY_RENDER_BATCH_COUNT,
                    activeTabCount - activeTabItems.length,
                  )}
                  )
                </AppText>
              </AppButton>
            ) : (
              <View className="flex-1 h-9 px-2 rounded-lg border border-border-primary-dark/60 bg-bg-tertiary-dark items-center justify-center">
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="text-[10px] font-semibold uppercase tracking-[0.6px] text-text-secondary-dark"
                >
                  All Loaded
                </AppText>
              </View>
            )}
          </View>
        </View>
      ) : null}
    </View>
  );
};

export default MarketAccountOverview;
