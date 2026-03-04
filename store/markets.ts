import { infoClient, subscriptionClient } from "@/lib/clients/hyperliquid";
import { errorHandler } from "@/lib/utils/error-handler";
import type { MarketItem, PerpetualMarket } from "@/types/markets";
import type { ISubscription } from "@nktkas/hyperliquid";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

const FAVORITES_STORAGE_KEY = "market-favorites";

type MarketStore = {
  markets: Map<string, PerpetualMarket>;
  favoriteSymbols: string[];
  selectedMarket: MarketItem | null;
  isLoading: boolean;

  fetchMarkets: () => Promise<Map<string, PerpetualMarket>>;
  setMarkets: (markets: Map<string, PerpetualMarket>) => void;
  setSelectedMarket: (market: MarketItem | null) => void;
  addToFavorite: (symbol: string) => void;
  removeFromFavorite: (symbol: string) => void;
  getLiveMarketUpdates: (
    setState: (markets: Map<string, PerpetualMarket>) => void,
  ) => Promise<ISubscription | null>;
};

export const useMarketStore = create<MarketStore>()(
  devtools(
    persist(
      (set, get) => ({
        markets: new Map(),
        favoriteSymbols: [],
        selectedMarket: null,
        isLoading: false,

        fetchMarkets: async () => {
          set({ isLoading: true });

          try {
            const fetchPerpetualMarkets = async () =>
              infoClient.webData2({
                user: "0x0000000000000000000000000000000000000000",
              });

            const resp = await fetchPerpetualMarkets();
            const universe = resp.meta?.universe || [];
            const assetCtxs = resp.assetCtxs || [];

            function formatPct(n: number | null, digits = 4): string {
              if (n == null || !isFinite(n)) return "—";
              return `${n >= 0 ? "+" : ""}${n.toFixed(digits)}%`;
            }

            function formatCountdown(ms: number): string {
              const s = Math.max(0, Math.floor(ms / 1000));
              const hh = Math.floor(s / 3600)
                .toString()
                .padStart(2, "0");
              const mm = Math.floor((s % 3600) / 60)
                .toString()
                .padStart(2, "0");
              const ss = (s % 60).toString().padStart(2, "0");
              return `${hh}:${mm}:${ss}`;
            }

            const savedFavorites = new Set(get().favoriteSymbols);
            const marketsMap = new Map<string, PerpetualMarket>();
            universe.map((u, index) => {
              const coin = u.name;
              const symbol = `${coin}-USDC`;
              const ctx = assetCtxs[index];

              if (!ctx) {
                const market: PerpetualMarket = {
                  coin,
                  symbol,
                  leverage: u.maxLeverage ? `${u.maxLeverage}x` : null,
                  lastPrice: null,
                  change24h: null,
                  change24hPer: null,
                  fundingPer: null,
                  funding8hour: null,
                  volume: null,
                  openInterest: null,
                  mark: null,
                  oracle: null,
                  volume24h: null,
                  fundingDisplay: null,
                  countdown: null,
                  isFavorite: savedFavorites.has(symbol),
                };
                marketsMap.set(market.symbol, market);
                return market;
              }

              const last = ctx.markPx ?? ctx.midPx ?? null;
              const prevDay = ctx.prevDayPx ?? null;

              const lastPrice = last != null ? Number(last) : null;
              const prevPrice = prevDay != null ? Number(prevDay) : null;

              const change24 =
                lastPrice != null && prevPrice != null
                  ? lastPrice - prevPrice
                  : null;
              const changePct =
                change24 != null && prevPrice != null && prevPrice !== 0
                  ? (change24 / prevPrice) * 100
                  : null;

              const fundingPct =
                ctx.funding != null ? Number(ctx.funding) * 100 : null;
              const volume =
                ctx.dayNtlVlm != null ? Number(ctx.dayNtlVlm) : null;

              const openInterestSize =
                ctx.openInterest != null ? Number(ctx.openInterest) : null;
              const openInterestUsd =
                openInterestSize != null && lastPrice != null
                  ? openInterestSize * lastPrice
                  : null;

              const markStr =
                ctx.markPx != null
                  ? Number(ctx.markPx)
                  : ctx.midPx != null
                    ? Number(ctx.midPx)
                    : null;
              const oracleStr =
                ctx.oraclePx != null ? Number(ctx.oraclePx) : null;

              const volumeStr = ctx.dayNtlVlm ?? null;
              const volume24h = volumeStr != null ? Number(volumeStr) : null;

              const fundingRaw =
                ctx.funding != null ? Number(ctx.funding) : null;
              const fundingHourlyPct =
                fundingRaw != null ? fundingRaw * 100 : null;
              const funding8hPct =
                fundingRaw != null ? fundingRaw * 8 * 100 : null;
              const funding8hour =
                fundingHourlyPct != null ? fundingHourlyPct * 8 : null;

              const now =
                typeof (resp as any).time === "number"
                  ? (resp as any).time
                  : Date.now();
              const msUntilNextHour = 3_600_000 - (now % 3_600_000);
              const countdown = formatCountdown(msUntilNextHour);

              const market: PerpetualMarket = {
                coin,
                symbol,
                leverage: u.maxLeverage ? `${u.maxLeverage}x` : null,
                lastPrice,
                change24h: change24,
                change24hPer: changePct,
                fundingPer: fundingPct,
                funding8hour,
                volume,
                openInterest: openInterestUsd,
                mark: markStr,
                oracle: oracleStr,
                volume24h,
                fundingDisplay: formatPct(fundingHourlyPct ?? funding8hPct, 4),
                countdown,
                isFavorite: savedFavorites.has(symbol),
              };
              marketsMap.set(market.symbol, market);
              return market;
            });

            set({ isLoading: false });
            return marketsMap;
          } catch (error) {
            set({ isLoading: false });
            errorHandler(error, "Markets Fetch Error");
            throw error;
          }
        },

        setMarkets: (markets: Map<string, PerpetualMarket>) => {
          set({ markets });
        },

        setSelectedMarket: (market) => {
          set({ selectedMarket: market });
        },

        addToFavorite: (symbol) => {
          const { favoriteSymbols } = get();
          if (favoriteSymbols.includes(symbol)) return;

          set({
            favoriteSymbols: [...favoriteSymbols, symbol],
          });
        },

        removeFromFavorite: (symbol) => {
          const { favoriteSymbols } = get();

          set({
            favoriteSymbols: favoriteSymbols.filter((s) => s !== symbol),
          });
        },

        getLiveMarketUpdates: async (setState) => {
          const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
          type WebData2Callback = Parameters<
            typeof subscriptionClient.webData2
          >[1];
          type WebData2Response = Parameters<WebData2Callback>[0];

          const formatPct = (n: number | null, digits = 4): string => {
            if (n == null || !isFinite(n)) return "—";
            return `${n >= 0 ? "+" : ""}${n.toFixed(digits)}%`;
          };

          const formatCountdown = (ms: number): string => {
            const s = Math.max(0, Math.floor(ms / 1000));
            const hh = Math.floor(s / 3600)
              .toString()
              .padStart(2, "0");
            const mm = Math.floor((s % 3600) / 60)
              .toString()
              .padStart(2, "0");
            const ss = (s % 60).toString().padStart(2, "0");
            return `${hh}:${mm}:${ss}`;
          };

          try {
            const subscription = await subscriptionClient.webData2(
              { user: ZERO_ADDRESS },
              (resp: WebData2Response) => {
                const universe = resp.meta?.universe || [];
                const assetCtxs = resp.assetCtxs || [];

                const now =
                  "time" in resp &&
                  typeof (resp as { time?: number }).time === "number"
                    ? (resp as { time: number }).time
                    : Date.now();
                const msUntilNextHour = 3_600_000 - (now % 3_600_000);
                const countdown = formatCountdown(msUntilNextHour);

                const state = get();
                const savedFavorites = new Set(state.favoriteSymbols);
                const updated = new Map<string, PerpetualMarket>();

                for (let i = 0; i < universe.length; i++) {
                  const u = universe[i];
                  const ctx = assetCtxs[i];
                  const coin = u?.name ?? "UNKNOWN";
                  const symbol = `${coin}-USDC`;
                  const existingMarket = state.markets.get(symbol);
                  const isFavorite =
                    existingMarket?.isFavorite ?? savedFavorites.has(symbol);

                  let marketData: PerpetualMarket;

                  if (!ctx) {
                    marketData = {
                      coin,
                      symbol,
                      leverage: u?.maxLeverage ? `${u.maxLeverage}x` : null,
                      lastPrice: null,
                      change24h: null,
                      change24hPer: null,
                      fundingPer: null,
                      funding8hour: null,
                      volume: null,
                      openInterest: null,
                      mark: null,
                      oracle: null,
                      volume24h: null,
                      fundingDisplay: null,
                      countdown,
                      isFavorite,
                    };
                  } else {
                    const last = ctx.markPx ?? ctx.midPx ?? null;
                    const prevDay = ctx.prevDayPx ?? null;
                    const lastPrice = last != null ? Number(last) : null;
                    const prevPrice = prevDay != null ? Number(prevDay) : null;

                    const change24h =
                      lastPrice != null && prevPrice != null
                        ? lastPrice - prevPrice
                        : null;
                    const change24hPer =
                      change24h != null && prevPrice != null && prevPrice !== 0
                        ? (change24h / prevPrice) * 100
                        : null;

                    const fundingRaw =
                      ctx.funding != null ? Number(ctx.funding) : null;
                    const fundingHourlyPct =
                      fundingRaw != null ? fundingRaw * 100 : null;
                    const funding8hPct =
                      fundingRaw != null ? fundingRaw * 8 * 100 : null;
                    const funding8hour =
                      fundingHourlyPct != null ? fundingHourlyPct * 8 : null;

                    const volume =
                      ctx.dayNtlVlm != null ? Number(ctx.dayNtlVlm) : null;

                    const openInterestSize =
                      ctx.openInterest != null
                        ? Number(ctx.openInterest)
                        : null;
                    const openInterest =
                      openInterestSize != null && lastPrice != null
                        ? openInterestSize * lastPrice
                        : null;

                    const mark =
                      ctx.markPx != null
                        ? Number(ctx.markPx)
                        : ctx.midPx != null
                          ? Number(ctx.midPx)
                          : null;
                    const oracle =
                      ctx.oraclePx != null ? Number(ctx.oraclePx) : null;

                    marketData = {
                      coin,
                      symbol,
                      leverage: u?.maxLeverage ? `${u.maxLeverage}x` : null,
                      lastPrice,
                      change24h,
                      change24hPer,
                      fundingPer: fundingHourlyPct,
                      funding8hour,
                      volume,
                      openInterest,
                      mark,
                      oracle,
                      volume24h: volume,
                      fundingDisplay: formatPct(
                        fundingHourlyPct ?? funding8hPct,
                        4,
                      ),
                      countdown,
                      isFavorite,
                    };
                  }

                  updated.set(symbol, marketData);
                }

                setState(updated);
              },
            );

            return subscription;
          } catch (err) {
            errorHandler(err, "Market Updates Error");
            return null;
          }
        },
      }),
      {
        name: "market-store",
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          favoriteSymbols: state.favoriteSymbols,
          markets: Array.from(state.markets.entries()),
        }),
        merge: (persistedState, currentState) => {
          type PersistedState = {
            favoriteSymbols?: string[];
            markets?: [string, PerpetualMarket][];
          };

          const persisted = persistedState as PersistedState;

          return {
            ...currentState,
            favoriteSymbols:
              persisted.favoriteSymbols ?? currentState.favoriteSymbols,
            markets: new Map(persisted.markets ?? []),
          };
        },
      },
    ),
  ),
);
