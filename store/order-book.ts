import { subscriptionClient } from "@/lib/clients/hyperliquid";
import { DATE_TIME_FORMAT } from "@/lib/constants";
import { formatDateTimeAccordingToFormat } from "@/lib/utils/date-oprations";
import { addDecimals } from "@/lib/utils/decimals";
import { errorHandler } from "@/lib/utils/error-handler";
import { CandleInterval, ChartCandle } from "@/types/chart";
import type {
  ISubscription,
  L2BookParameters,
  TradesWsParameters,
} from "@nktkas/hyperliquid";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface OrderBookData {
  price: string;
  size: string;
  total: string;
}

export interface TradeData {
  price: number;
  size: number;
  time: string;
  isBuy: boolean;
  timestamp: number;
  txnHash: string;
}

type OrderBookStore = {
  asks: OrderBookData[];
  bids: OrderBookData[];
  spread: number | null;
  spreadPercent: number | null;
  highlightedAskPrices: Set<string>;
  highlightedBidPrices: Set<string>;

  trades: TradeData[];

  setTrades: (
    trades: TradeData[] | ((prev: TradeData[]) => TradeData[]),
  ) => void;

  setAsks: (
    asks: OrderBookData[] | ((prev: OrderBookData[]) => OrderBookData[]),
  ) => void;
  setBids: (
    bids: OrderBookData[] | ((prev: OrderBookData[]) => OrderBookData[]),
  ) => void;
  setSpread: (spread: number | null) => void;
  setSpreadPercent: (spreadPercent: number | null) => void;
  setHighlightedAskPrices: (
    highlightedAskPrices: Set<string> | ((prev: Set<string>) => Set<string>),
  ) => void;
  setHighlightedBidPrices: (
    highlightedBidPrices: Set<string> | ((prev: Set<string>) => Set<string>),
  ) => void;

  isLoading: boolean;
  error: string | null;

  getLiveMarketUpdates: (
    setState: (state: OrderBookStore) => void,
  ) => Promise<ISubscription | null>;
  getLiveOrderBook: (
    currency: string,
    precision: Pick<L2BookParameters, "nSigFigs" | "mantissa">,
    setAsks: (
      asks: OrderBookData[] | ((prev: OrderBookData[]) => OrderBookData[]),
    ) => void,
    setBids: (
      bids: OrderBookData[] | ((prev: OrderBookData[]) => OrderBookData[]),
    ) => void,
    setHighlightedAskPrices: (highlightedAskPrices: Set<string>) => void,
    setHighlightedBidPrices: (highlightedBidPrices: Set<string>) => void,
    setSpread: (spread: number | null) => void,
    setSpreadPercent: (spreadPercent: number | null) => void,
  ) => Promise<ISubscription | null>;
  getLiveTrades: (
    currency: string,
    setTrades: (
      trades: TradeData[] | ((prev: TradeData[]) => TradeData[]),
    ) => void,
  ) => Promise<ISubscription | null>;
  getLiveCandleData: (
    currency: string,
    interval: CandleInterval,
    setCandleData: (
      candles: ChartCandle[] | ((prev: ChartCandle[]) => ChartCandle[]),
    ) => void,
  ) => Promise<ISubscription | null>;
};

export const useOrderBookStore = create<OrderBookStore>()(
  devtools((set) => ({
    asks: [],
    bids: [],
    spread: null,
    spreadPercent: null,
    highlightedAskPrices: new Set<string>(),
    highlightedBidPrices: new Set<string>(),
    trades: [],
    isLoading: false,
    error: null,

    setAsks: (asks) => {
      if (typeof asks === "function") {
        set((state) => ({ asks: asks(state.asks) }));
      } else {
        set({ asks });
      }
    },
    setBids: (bids) => {
      if (typeof bids === "function") {
        set((state) => ({ bids: bids(state.bids) }));
      } else {
        set({ bids });
      }
    },
    setSpread: (spread) => set({ spread }),
    setSpreadPercent: (spreadPercent) => set({ spreadPercent }),
    setHighlightedAskPrices: (highlightedAskPrices) => {
      if (typeof highlightedAskPrices === "function") {
        set((state) => ({
          highlightedAskPrices: highlightedAskPrices(
            state.highlightedAskPrices,
          ),
        }));
      } else {
        set({ highlightedAskPrices });
      }
    },
    setHighlightedBidPrices: (highlightedBidPrices) => {
      if (typeof highlightedBidPrices === "function") {
        set((state) => ({
          highlightedBidPrices: highlightedBidPrices(
            state.highlightedBidPrices,
          ),
        }));
      } else {
        set({ highlightedBidPrices });
      }
    },
    setTrades: (trades) => {
      if (typeof trades === "function") {
        set((state) => ({ trades: trades(state.trades) }));
      } else {
        set({ trades });
      }
    },

    getLiveOrderBook: async (
      currency,
      precision,
      setAsks,
      setBids,
      setHighlightedAskPrices,
      setHighlightedBidPrices,
      setSpread,
      setSpreadPercent,
    ) => {
      try {
        const config: L2BookParameters = { coin: currency, ...precision };
        const subscription = await subscriptionClient.l2Book(config, (book) => {
          
          const bestBid = book.levels[0];
          const bestAsk = book.levels[1];
          const spread =
            parseFloat(bestAsk[0]?.px) - parseFloat(bestBid[0]?.px);
          const spreadPercent = (spread / parseFloat(bestAsk[0]?.px)) * 100;
          setSpread(spread);
          setSpreadPercent(spreadPercent);

          setAsks((prev: OrderBookData[]) => {
            let currentAsks = [...(prev || [])];

            // Create a Map of prices from bestAsk for efficient lookup
            const bestAskMap = new Map<string, { sz: string; n?: number }>();
            bestAsk.forEach((ask) => {
              bestAskMap.set(ask.px, { sz: ask.sz, n: ask.n });
            });

            // Create a Set of prices from bestAsk to check removals
            const bestAskPrices = new Set(bestAsk.map((ask) => ask.px));

            // Track prices that are updated or newly added for highlighting
            const newOrUpdatedPrices = new Set<string>();

            // Step 1: Update existing prices and mark which ones exist
            const updatedPrices = new Set<string>();
            for (let i = 0; i < currentAsks.length; i++) {
              const price = currentAsks[i].price;
              const bestAskData = bestAskMap.get(price);

              if (bestAskData) {
                // Check if size changed (update) or if it's a new entry
                const oldSize = currentAsks[i].size;
                if (oldSize !== bestAskData.sz) {
                  newOrUpdatedPrices.add(price);
                }
                // Update existing price
                currentAsks[i] = {
                  price: price,
                  size: bestAskData.sz,
                  total: bestAskData.n?.toString() || "0",
                };
                updatedPrices.add(price);
              }
            }

            // Step 2: Remove prices that are no longer in bestAsk
            currentAsks = currentAsks.filter((ask) =>
              bestAskPrices.has(ask.price),
            );

            // Step 3: Insert new prices from bestAsk
            for (let j = 0; j < bestAsk.length; j++) {
              const price = bestAsk[j].px;
              if (!updatedPrices.has(price)) {
                currentAsks.push({
                  price: price,
                  size: bestAsk[j].sz,
                  total: bestAsk[j]?.n?.toString() || "0",
                });
                newOrUpdatedPrices.add(price);
              }
            }

            // Step 4: Sort by price (ascending for asks - lowest ask first)
            currentAsks.sort((x, y) => Number(x.price) - Number(y.price));

            // Step 5: Recalculate cumulative total based on size
            let cumulativeTotal = 0;
            currentAsks = currentAsks.map((ask) => {
              const sizeNum = parseFloat(ask.size) || 0;
              cumulativeTotal += sizeNum;
              return {
                ...ask,
                total: addDecimals(cumulativeTotal).toString(),
              };
            });

            // Update highlighted prices
            if (newOrUpdatedPrices.size > 0) {
              setHighlightedAskPrices(new Set(newOrUpdatedPrices));
            }

            return currentAsks?.slice(0, 11);
          });

          setBids((prev: OrderBookData[]) => {
            let currentBids = [...(prev || [])];

            // Create a Map of prices from bestBid for efficient lookup
            const bestBidMap = new Map<string, { sz: string; n?: number }>();
            bestBid.forEach((bid) => {
              bestBidMap.set(bid.px, { sz: bid.sz, n: bid.n });
            });

            // Create a Set of prices from bestBid to check removals
            const bestBidPrices = new Set(bestBid.map((bid) => bid.px));

            // Track prices that are updated or newly added for highlighting
            const newOrUpdatedPrices = new Set<string>();

            // Step 1: Update existing prices and mark which ones exist
            const updatedPrices = new Set<string>();
            for (let i = 0; i < currentBids.length; i++) {
              const price = currentBids[i].price;
              const bestBidData = bestBidMap.get(price);

              if (bestBidData) {
                // Check if size changed (update) or if it's a new entry
                const oldSize = currentBids[i].size;
                if (oldSize !== bestBidData.sz) {
                  newOrUpdatedPrices.add(price);
                }
                // Update existing price
                currentBids[i] = {
                  price: price,
                  size: bestBidData.sz,
                  total: bestBidData.n?.toString() || "0",
                };
                updatedPrices.add(price);
              }
            }

            // Step 2: Remove prices that are no longer in bestBid
            currentBids = currentBids.filter((bid) =>
              bestBidPrices.has(bid.price),
            );

            // Step 3: Insert new prices from bestBid
            for (let j = 0; j < bestBid.length; j++) {
              const price = bestBid[j].px;
              if (!updatedPrices.has(price)) {
                currentBids.push({
                  price: price,
                  size: bestBid[j].sz,
                  total: bestBid[j]?.n?.toString() || "0",
                });
                newOrUpdatedPrices.add(price);
              }
            }

            // Step 4: Sort by price (descending for bids - highest bid first)
            currentBids.sort((x, y) => Number(y.price) - Number(x.price));

            // Step 5: Recalculate cumulative total based on size
            let cumulativeTotal = 0;
            currentBids = currentBids.map((bid) => {
              const sizeNum = parseFloat(bid.size) || 0;
              cumulativeTotal += sizeNum;
              return {
                ...bid,
                total: addDecimals(cumulativeTotal).toString(),
              };
            });

            // Update highlighted prices
            if (newOrUpdatedPrices.size > 0) {
              setHighlightedBidPrices(new Set(newOrUpdatedPrices));
            }

            return currentBids?.slice(0, 11);
          });
        });

        return subscription;
      } catch (err) {
        errorHandler(err, "Order Book Error");
        return null;
      }
    },
    getLiveTrades: async (currency, setTrades) => {
      try {
        const config: TradesWsParameters = { coin: currency };
        const subscription = await subscriptionClient.trades(
          config,
          (trades) => {
            // trades is an array of trade objects
            if (trades.length > 0) {
              const newTrades: TradeData[] = trades.map((trade) => {
                const tradeTime = new Date(trade.time);
                return {
                  price: parseFloat(trade.px),
                  size: addDecimals(Number(trade.sz), 4),
                  time: formatDateTimeAccordingToFormat({
                    timeStamp: tradeTime,
                    format: DATE_TIME_FORMAT.HH_mm_ss,
                  }),
                  isBuy: trade.side === "B", // "B" = buy, "A" = sell
                  timestamp: tradeTime.getTime(), // Store timestamp for sorting
                  txnHash: trade.hash,
                };
              });

              // Prepend new trades, sort by date, and keep only the latest 50
              setTrades((currentTrades) => {
                const updatedTrades = [...newTrades, ...currentTrades];
                updatedTrades.sort((a, b) => b.timestamp - a.timestamp);
                return updatedTrades.slice(0, 50);
              });
            }
          },
        );
        return subscription;
      } catch (err) {
        errorHandler(err, "Trades Stream Error");
        return null;
      }
    },
    getLiveCandleData: async (currency, interval, setCandleData) => {
      try {
        const subscription = await subscriptionClient.candle(
          { coin: currency, interval },
          (data: ChartCandle) => {
            if (data.s !== currency || data.i !== interval) return;

            setCandleData((prev) => {
              const newData = [...(prev || [])];
              const existingIndex = newData.findIndex((candle) => {
                return candle.t === data.t;
              });

              if (existingIndex >= 0) {
                newData[existingIndex] = data;
              } else {
                newData.push(data);
              }

              newData.sort((a, b) => a.t - b.t);
              return newData;
            });
          },
        );

        return subscription;
      } catch (err) {
        errorHandler(err, "Candle Stream Error");
        return null;
      }
    },
  })),
);
