import { infoClient, subscriptionClient } from "@/lib/clients/hyperliquid";
import { addDecimals } from "@/lib/utils/decimals";
import { errorHandler } from "@/lib/utils/error-handler";
import {
  Balance,
  FundingHistory,
  HistoricalOrder,
  OpenOrder,
  Position,
  TradeHistory,
} from "@/types/bottom-pannel";
import type { ISubscription } from "@nktkas/hyperliquid";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

type BottomPannelStore = {
  isError: string | null;
  activeAccountTab:
    | "balances"
    | "positions"
    | "openOrders"
    | "tradeHistory"
    | "fundingHistory"
    | "orderHistory";
  expandedAccountCards: Record<string, boolean>;
  setActiveAccountTab: (
    tab:
      | "balances"
      | "positions"
      | "openOrders"
      | "tradeHistory"
      | "fundingHistory"
      | "orderHistory",
  ) => void;
  resetExpandedAccountCards: () => void;
  toggleExpandedAccountCard: (cardId: string) => void;

  balances: Balance[];
  setBalances: (balances: Balance[] | ((prev: Balance[]) => Balance[])) => void;
  isBalancesLoading: boolean;
  getAllBalances: ({
    publicKey,
  }: {
    publicKey: `0x${string}`;
  }) => Promise<Balance[]>;
  getLiveBalances: (
    publicKey: `0x${string}`,
    setBalances: (balances: Balance[]) => void,
  ) => Promise<ISubscription | null>;

  userPositions: Position[];
  setUserPositions: (
    positions: Position[] | ((prev: Position[]) => Position[]),
  ) => void;
  isUserPositionsLoading: boolean;
  getUserPositions: ({
    publicKey,
  }: {
    publicKey: `0x${string}`;
  }) => Promise<Position[]>;
  getLiveUserPositions: (
    publicKey: `0x${string}`,
    setUserPositions: (positions: Position[]) => void,
  ) => Promise<ISubscription | null>;

  userOpenOrders: OpenOrder[];
  isUserOpenOrdersLoading: boolean;
  getUserOpenOrders: ({
    publicKey,
  }: {
    publicKey: `0x${string}`;
  }) => Promise<OpenOrder[]>;
  getLiveUserOpenOrders: (
    publicKey: `0x${string}`,
    setOpenOrders: (orders: OpenOrder[]) => void,
  ) => Promise<ISubscription | null>;
  setOpenOrders: (
    orders: OpenOrder[] | ((prev: OpenOrder[]) => OpenOrder[]),
  ) => void;

  tradeHistory: TradeHistory[];
  isTradeHistoryLoading: boolean;
  setTradeHistory: (
    trades: TradeHistory[] | ((prev: TradeHistory[]) => TradeHistory[]),
  ) => void;
  getUserTradeHistory: ({
    publicKey,
  }: {
    publicKey: `0x${string}`;
  }) => Promise<TradeHistory[]>;
  getLiveUserTradeHistory: (
    publicKey: `0x${string}`,
    setTradeHistory: (trades: TradeHistory[]) => void,
  ) => Promise<ISubscription | null>;

  userFundings: FundingHistory[];
  isUserFundingsLoading: boolean;
  setUserFundings: (
    fundings: FundingHistory[] | ((prev: FundingHistory[]) => FundingHistory[]),
  ) => void;
  getUserFundings: ({
    publicKey,
  }: {
    publicKey: `0x${string}`;
  }) => Promise<FundingHistory[]>;
  getLiveUserFundings: (
    publicKey: `0x${string}`,
    setUserFundings: (fundings: FundingHistory[]) => void,
  ) => Promise<ISubscription | null>;

  historicalOrders: HistoricalOrder[];
  isHistoricalOrdersLoading: boolean;
  setHistoricalOrders: (
    orders:
      | HistoricalOrder[]
      | ((prev: HistoricalOrder[]) => HistoricalOrder[]),
  ) => void;
  getHistoricalOrders: ({
    publicKey,
  }: {
    publicKey: `0x${string}`;
  }) => Promise<HistoricalOrder[]>;
  getLiveHistoricalOrders: (
    publicKey: `0x${string}`,
    setHistoricalOrders: (orders: HistoricalOrder[]) => void,
  ) => Promise<ISubscription | null>;
};

const INITIAL_STATE = {
  balances: [] as Balance[],
  isBalancesLoading: false,
  userPositions: [] as Position[],
  isUserPositionsLoading: false,
  userOpenOrders: [] as OpenOrder[],
  isUserOpenOrdersLoading: false,
  tradeHistory: [] as TradeHistory[],
  isTradeHistoryLoading: false,
  userFundings: [] as FundingHistory[],
  isUserFundingsLoading: false,
  historicalOrders: [] as HistoricalOrder[],
  isHistoricalOrdersLoading: false,
  isError: null as string | null,
  activeAccountTab: "balances" as const,
  expandedAccountCards: {} as Record<string, boolean>,
};

export const useBottomPannelStore = create<BottomPannelStore>()(
  devtools(
    persist(
      (set) => ({
        ...INITIAL_STATE,
        setActiveAccountTab: (tab) => {
          set({ activeAccountTab: tab });
        },
        resetExpandedAccountCards: () => {
          set({ expandedAccountCards: {} });
        },
        toggleExpandedAccountCard: (cardId) => {
          set((state) => ({
            expandedAccountCards: {
              ...state.expandedAccountCards,
              [cardId]: !state.expandedAccountCards[cardId],
            },
          }));
        },

        setBalances: (balances) => {
          if (typeof balances === "function") {
            set((state) => ({ balances: balances(state.balances) }));
          } else {
            set({ balances });
          }
        },
        getAllBalances: async ({ publicKey }: { publicKey: `0x${string}` }) => {
          try {
            set({ isBalancesLoading: true, isError: null });
            const resp = await infoClient.webData2({
              user: publicKey as string,
            });

            const ch = resp?.clearinghouseState ?? {};
            const marginSummary = ch?.marginSummary ?? {};

            // Extract spot USDC balance from spotState.balances
            const spotBalances = (resp as any)?.spotState?.balances ?? [];
            const spotUsdc = spotBalances.find(
              (b: { coin: string }) => b.coin === "USDC",
            );
            const spotTotal = spotUsdc ? parseFloat(spotUsdc.total ?? "0") : 0;
            const spotHold = spotUsdc ? parseFloat(spotUsdc.hold ?? "0") : 0;
            const spotAvailable = spotTotal - spotHold;

            const rows: Balance[] = [
              {
                coin: "USDC (Perps)",
                total_balance: `${addDecimals(Number(marginSummary?.accountValue ?? 0))} USDC`,
                available_balance: `${addDecimals(Number(ch?.withdrawable ?? 0))} USDC`,
                usdc_value: addDecimals(
                  Number(marginSummary?.accountValue ?? 0),
                ),
              },
            ];

            // if (spotTotal > 0) {
            //   rows.push({
            //     coin: "USDC (Spot)",
            //     total_balance: `${addDecimals(spotTotal)} USDC`,
            //     available_balance: `${addDecimals(spotAvailable)} USDC`,
            //     usdc_value: addDecimals(spotTotal),
            //   });
            // }

            return rows;
          } catch (error) {
            set({ isError: errorHandler(error), isBalancesLoading: false });
            return [];
          } finally {
            set({ isBalancesLoading: false });
          }
        },
        getLiveBalances: async (publicKey, setBalances) => {
          try {
            const subscription = await subscriptionClient.webData2(
              { user: publicKey as `0x${string}` },
              (resp) => {
                const ch = resp?.clearinghouseState ?? {};
                const marginSummary = ch?.marginSummary ?? {};

                // Extract spot USDC balance from spotState
                const spotBalances = (resp as any)?.spotState?.balances ?? [];
                const spotUsdc = spotBalances.find(
                  (b: { coin: string }) => b.coin === "USDC",
                );
                const spotTotal = spotUsdc
                  ? parseFloat(spotUsdc.total ?? "0")
                  : 0;
                const spotHold = spotUsdc
                  ? parseFloat(spotUsdc.hold ?? "0")
                  : 0;
                const spotAvailable = spotTotal - spotHold;

                const rows: Balance[] = [
                  {
                    coin: "USDC (Perps)",
                    total_balance: `${addDecimals(Number(marginSummary?.accountValue ?? 0))} USDC`,
                    available_balance: `${addDecimals(Number(marginSummary.accountValue) - Number(marginSummary.totalMarginUsed) - 0.01 || 0)} USDC`,
                    usdc_value: addDecimals(
                      Number(marginSummary?.accountValue ?? 0),
                    ),
                  },
                ];

                // if (spotTotal > 0) {
                //   rows.push({
                //     coin: "USDC (Spot)",
                //     total_balance: `${addDecimals(spotTotal)} USDC`,
                //     available_balance: `${addDecimals(spotAvailable)} USDC`,
                //     usdc_value: addDecimals(spotTotal),
                //   });
                // }

                setBalances(rows);
              },
            );

            return subscription;
          } catch (error) {
            errorHandler(error, "Balances Stream Error");
            return null;
          }
        },

        setUserPositions: (positions) => {
          if (typeof positions === "function") {
            set((state) => ({ userPositions: positions(state.userPositions) }));
          } else {
            set({ userPositions: positions });
          }
        },
        getUserPositions: async ({
          publicKey,
        }: {
          publicKey: `0x${string}`;
        }) => {
          try {
            set({ isUserPositionsLoading: true, isError: null });
            const resp = await infoClient.clearinghouseState({
              user: publicKey as string,
            });
            return resp?.assetPositions ?? [];
          } catch (error) {
            set({
              isError: errorHandler(error),
              isUserPositionsLoading: false,
            });
            return [];
          } finally {
            set({ isUserPositionsLoading: false });
          }
        },
        getLiveUserPositions: async (publicKey, setUserPositions) => {
          try {
            const subscription = await subscriptionClient.clearinghouseState(
              { user: publicKey as `0x${string}` },
              (fundings) => {
                setUserPositions(
                  fundings?.clearinghouseState?.assetPositions ?? [],
                );
              },
            );

            return subscription;
          } catch (error) {
            errorHandler(error, "User Positions Stream Error");
            return null;
          }
        },

        userOpenOrders: [],
        isUserOpenOrdersLoading: false,
        getUserOpenOrders: async ({
          publicKey,
        }: {
          publicKey: `0x${string}`;
        }) => {
          try {
            set({ isUserOpenOrdersLoading: true, isError: null });
            const resp = await infoClient.frontendOpenOrders({
              user: publicKey as string,
            });
            const filteredOpenOrders = (resp ?? []).filter(
              (order) => !order.coin.startsWith("@"),
            ) as OpenOrder[];

            return filteredOpenOrders;
          } catch (error) {
            set({
              isError: errorHandler(error),
              isUserOpenOrdersLoading: false,
            });
            return [];
          } finally {
            set({ isUserOpenOrdersLoading: false });
          }
        },
        getLiveUserOpenOrders: async (publicKey, setOpenOrders) => {
          try {
            const subscription = await subscriptionClient.openOrders(
              { user: publicKey as `0x${string}` },
              (orders) => {
                setOpenOrders(orders?.orders ?? []);
              },
            );

            return subscription;
          } catch (error) {
            errorHandler(error, "Open Orders Stream Error");
            return null;
          }
        },
        setOpenOrders: (orders) => {
          if (typeof orders === "function") {
            set((state) => ({ userOpenOrders: orders(state.userOpenOrders) }));
          } else {
            set({ userOpenOrders: orders });
          }
        },

        setTradeHistory: (trades) => {
          if (typeof trades === "function") {
            set((state) => ({ tradeHistory: trades(state.tradeHistory) }));
          } else {
            set({ tradeHistory: trades });
          }
        },
        getUserTradeHistory: async ({ publicKey }) => {
          try {
            set({ isTradeHistoryLoading: true, isError: null });
            const resp = await infoClient.userFillsByTime({
              user: publicKey as string,
              startTime: 0,
            });

            const trades = (resp ?? []).filter(
              (r) => !r.coin.startsWith("@"),
            ) as TradeHistory[];
            return trades.sort(
              (a, b) => Number(b.time ?? 0) - Number(a.time ?? 0),
            );
          } catch (error) {
            set({ isError: errorHandler(error), isTradeHistoryLoading: false });
            return [];
          } finally {
            set({ isTradeHistoryLoading: false });
          }
        },
        getLiveUserTradeHistory: async (publicKey, setTradeHistory) => {
          try {
            const subscription = await subscriptionClient.userFills(
              { user: publicKey as `0x${string}` },
              (tradeUpdates) => {
                const trades = (tradeUpdates?.fills ?? []).filter(
                  (r) => !r.coin.startsWith("@"),
                ) as TradeHistory[];
                setTradeHistory(trades);
              },
            );

            return subscription;
          } catch (error) {
            errorHandler(error, "Trade History Stream Error");
            return null;
          }
        },

        setUserFundings: (fundings) => {
          if (typeof fundings === "function") {
            set((state) => ({ userFundings: fundings(state.userFundings) }));
          } else {
            set({ userFundings: fundings });
          }
        },
        getUserFundings: async ({ publicKey }) => {
          try {
            set({ isUserFundingsLoading: true, isError: null });
            const resp = await infoClient.userFunding({
              user: publicKey as string,
            });

            return (resp ?? []).filter(
              (r) => !(r.delta?.coin ?? "").startsWith("@"),
            ) as FundingHistory[];
          } catch (error) {
            set({ isError: errorHandler(error), isUserFundingsLoading: false });
            return [];
          } finally {
            set({ isUserFundingsLoading: false });
          }
        },
        getLiveUserFundings: async (publicKey, setUserFundings) => {
          try {
            const subscription = await subscriptionClient.userFundings(
              { user: publicKey as `0x${string}` },
              (fundingUpdates) => {
                const fundings = (fundingUpdates?.fundings ?? [])
                  .filter((r) => !(r.coin ?? "").startsWith("@"))
                  .map(
                    (r) =>
                      ({
                        time: r.time,
                        hash: "live-funding-update",
                        delta: {
                          type: "funding",
                          coin: r.coin,
                          usdc: r.usdc,
                          szi: r.szi,
                          fundingRate: r.fundingRate,
                          nSamples: r.nSamples,
                        },
                      }) as FundingHistory,
                  );
                setUserFundings(fundings);
              },
            );

            return subscription;
          } catch (error) {
            errorHandler(error, "User Fundings Stream Error");
            return null;
          }
        },

        setHistoricalOrders: (orders) => {
          if (typeof orders === "function") {
            set((state) => ({
              historicalOrders: orders(state.historicalOrders),
            }));
          } else {
            set({ historicalOrders: orders });
          }
        },
        getHistoricalOrders: async ({ publicKey }) => {
          try {
            set({ isHistoricalOrdersLoading: true, isError: null });
            const resp = await infoClient.historicalOrders({
              user: publicKey as string,
            });

            return (resp ?? []).filter(
              (r) => !String(r?.order?.coin ?? "").startsWith("@"),
            ) as HistoricalOrder[];
          } catch (error) {
            set({
              isError: errorHandler(error),
              isHistoricalOrdersLoading: false,
            });
            return [];
          } finally {
            set({ isHistoricalOrdersLoading: false });
          }
        },
        getLiveHistoricalOrders: async (publicKey, setHistoricalOrders) => {
          try {
            const subscription = await subscriptionClient.userHistoricalOrders(
              { user: publicKey as `0x${string}` },
              (orderUpdates) => {
                const orders = (orderUpdates?.orderHistory ?? []).filter(
                  (r) => !String(r?.order?.coin ?? "").startsWith("@"),
                ) as HistoricalOrder[];
                setHistoricalOrders(orders);
              },
            );

            return subscription;
          } catch (error) {
            errorHandler(error, "Historical Orders Stream Error");
            return null;
          }
        },
      }),
      {
        name: "bottom-pannel-store",
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          balances: state.balances,
          tradeHistory: state.tradeHistory,
          userFundings: state.userFundings,
          historicalOrders: state.historicalOrders,
        }),
      },
    ),
  ),
);
