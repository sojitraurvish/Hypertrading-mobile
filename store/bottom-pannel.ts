import { infoClient, subscriptionClient } from "@/lib/clients/hyperliquid";
import { addDecimals } from "@/lib/utils/decimals";
import { errorHandler } from "@/lib/utils/error-handler";
import { Balance, OpenOrder, Position } from "@/types/bottom-pannel";
import type { ISubscription } from "@nktkas/hyperliquid";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

type BottomPannelStore = {
  isError: string | null;
  
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

  
};

const INITIAL_STATE = {
  balances: [] as Balance[],
  isBalancesLoading: false,
  userPositions: [] as Position[],
  isUserPositionsLoading: false,
  userOpenOrders: [] as OpenOrder[],
  isUserOpenOrdersLoading: false,
  isError: null as string | null,
};

export const useBottomPannelStore = create<BottomPannelStore>()(
  devtools(
    persist(
      (set) => ({
        ...INITIAL_STATE,

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
                setUserPositions(fundings?.clearinghouseState?.assetPositions ?? []);
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

        
      }),
      {
        name: "bottom-pannel-store",
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          balances: state.balances,
        }),
      },
    ),
  ),
);
