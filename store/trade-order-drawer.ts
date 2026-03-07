import { appToast } from "@/components/ui/app-toast";
import {
  getAgentExchangeClient,
  getSymbolConverter,
  subscriptionClient,
} from "@/lib/clients/hyperliquid";
import { BUILDER_CONFIG } from "@/lib/config";
import { errorHandler } from "@/lib/utils/error-handler";
import type {
  AgentOrderRequest,
  FilledOrderStatus,
  OrderPayload,
  PlaceOrderTif,
  PlaceOrderWithAgentOkResponse,
  PlaceOrderWithAgentParams,
  RawOrderStatus,
  TimeInForceOption,
} from "@/types/trade-order-drawer";
import type { ISubscription } from "@nktkas/hyperliquid";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type TradeSide = "long" | "short";
type MarginMode = "cross" | "isolated";

const isOrderPayloadOk = (
  payload: OrderPayload,
): payload is PlaceOrderWithAgentOkResponse => payload.status === "ok";

const isFilledOrderStatus = (
  status: RawOrderStatus,
): status is FilledOrderStatus =>
  typeof status.filled?.totalSz === "string" &&
  typeof status.filled?.avgPx === "string";

const normalizeOrderPayload = (payload: unknown): OrderPayload => {
  const candidate = payload as Partial<OrderPayload> | null;
  if (
    candidate &&
    typeof candidate === "object" &&
    candidate.status === "ok" &&
    typeof candidate.response === "object" &&
    candidate.response !== null &&
    typeof (candidate.response as { data?: unknown }).data === "object" &&
    (candidate.response as { data?: unknown }).data !== null &&
    Array.isArray(
      ((candidate.response as { data: { statuses?: unknown } }).data.statuses ??
        []) as unknown[],
    )
  ) {
    return candidate as PlaceOrderWithAgentOkResponse;
  }

  return {
    status: "err",
    response: {
      type: "Unexpected order response format",
    },
  };
};

const placeOrderWithAgent = async ({
  agentPrivateKey,
  a,
  b,
  r,
  s,
  p,
  tif = "FrontendMarket",
  builderAddress = BUILDER_CONFIG.BUILDER_FEE_ADDRESS,
  desiredBps = BUILDER_CONFIG.BUILDER_FEE_RATE * 10,
  takeProfitPrice,
  stopLossPrice,
}: PlaceOrderWithAgentParams): Promise<OrderPayload> => {
  const conv = await getSymbolConverter();
  const assetId = conv.getAssetId(a);
  const agentExchangeClient = getAgentExchangeClient(
    agentPrivateKey as `0x${string}`,
  );

  const hasTpsl = takeProfitPrice !== undefined || stopLossPrice !== undefined;
  const mainOrderTif: PlaceOrderTif = hasTpsl ? "FrontendMarket" : tif;

  const orders: AgentOrderRequest["orders"] = [
    {
      a: String(assetId),
      b,
      p,
      r,
      s,
      t: { limit: { tif: mainOrderTif } },
    },
  ];

  if (hasTpsl) {
    if (stopLossPrice !== undefined) {
      orders.push({
        a: String(assetId),
        b: !b,
        p: String(stopLossPrice),
        r: true,
        s,
        t: {
          trigger: {
            isMarket: true,
            tpsl: "sl",
            triggerPx: String(stopLossPrice),
          },
        },
      });
    }

    if (takeProfitPrice !== undefined) {
      orders.push({
        a: String(assetId),
        b: !b,
        p: String(takeProfitPrice),
        r: true,
        s,
        t: {
          trigger: {
            isMarket: true,
            tpsl: "tp",
            triggerPx: String(takeProfitPrice),
          },
        },
      });
    }
  }

  const payload: AgentOrderRequest = {
    grouping: hasTpsl ? "normalTpsl" : "na",
    orders,
    ...(builderAddress && desiredBps
      ? { builder: { b: builderAddress, f: desiredBps } }
      : {}),
  };

  console.log("payload urvish", payload);
  const rawResponse = await agentExchangeClient.order(payload);
  return normalizeOrderPayload(rawResponse);
};

type TradeOrderDrawerState = {
  isError: string | null;
  isOpen: boolean;
  sideOpenWith?: TradeSide;
  openTradeOrderDrawer: (params?: { side?: TradeSide }) => void;
  closeTradeOrderDrawer: () => void;
  isPlacingOrderWithAgentLoading: boolean;
  placeOrderWithAgent: (params: PlaceOrderWithAgentParams) => Promise<boolean>;
  isUpdateMarginAndLeverageLoading: boolean;
  isLoadingSzDecimals: boolean;
  sliderValue: number;
  setSliderValue: (sliderValue: number) => void;
  limitOrderPrice: string;
  setLimitOrderPrice: (limitOrderPrice: string) => void;
  timeInForce: TimeInForceOption;
  setTimeInForce: (timeInForce: TimeInForceOption) => void;
  sizeInputValue: string;
  setSizeInputValue: (sizeInputValue: string) => void;
  sizeInputValueForSelectedMarket: string;
  setSizeInputValueForSelectedMarket: (
    sizeInputValueForSelectedMarket: string,
  ) => void;

  // Margin Mode
  marginMode: MarginMode;
  setMarginMode: (marginMode: MarginMode) => void;
  maxLeverage: number;
  setMaxLeverage: (maxLeverage: number) => void;
  userLeverage: number;
  setUserLeverage: (userLeverage: number) => void;
  availableToTradeBuy: number;
  setAvailableToTradeBuy: (availableToTradeBuy: number) => void;
  availableToTradeSell: number;
  setAvailableToTradeSell: (availableToTradeSell: number) => void;
  markPrice: number;
  setMarkPrice: (markPrice: number) => void;
  marketPriceWithSlippage: number;
  setMarketPriceWithSlippage: (marketPriceWithSlippage: number) => void;
  maxSlippage: number;
  setMaxSlippage: (maxSlippage: number) => void;
  currentPosition: number;
  setCurrentPosition: (currentPosition: number) => void;
  currentUnrealizedPnl: number;
  setCurrentUnrealizedPnl: (currentUnrealizedPnl: number) => void;
  liquidationPx: number;
  setLiquidationPx: (liquidationPx: number) => void;
  crossAccountValue: number;
  setCrossAccountValue: (crossAccountValue: number) => void;
  totalCrossPositionValue: number;
  setTotalCrossPositionValue: (totalCrossPositionValue: number) => void;
  crossAccountLeverage: number;
  setCrossAccountLeverage: (crossAccountLeverage: number) => void;
  perpsBalance: number;
  setPerpsBalance: (perpsBalance: number) => void;
  szDecimals: number | null;
  setSzDecimals: (szDecimals: number) => void;
  resolveSzDecimals: (currentCurrency: string) => Promise<number>;
  getLiveActiveAssetData: (
    address: `0x${string}`,
    currentCurrency: string,
    setMarginMode: (marginMode: MarginMode) => void,
    setUserLeverage: (userLeverage: number) => void,
    setAvailableToTradeBuy: (availableToTradeBuy: number) => void,
    setAvailableToTradeSell: (availableToTradeSell: number) => void,
    setMarkPrice: (markPrice: number) => void,
  ) => Promise<ISubscription | null>;
  getLiveWebData2: (
    address: `0x${string}`,
    currentCurrency: string,
    setCurrentPosition: (currentPosition: number) => void,
    setCurrentUnrealizedPnl: (currentUnrealizedPnl: number) => void,
    setLiquidationPx: (liquidationPx: number) => void,
    setCrossAccountValue: (crossAccountValue: number) => void,
    setTotalCrossPositionValue: (totalCrossPositionValue: number) => void,
    setCrossAccountLeverage: (crossAccountLeverage: number) => void,
    setPerpsBalance: (perpsBalance: number) => void,
  ) => Promise<ISubscription | null>;
  updateMarginAndLeverage: (params: {
    currentCurrency: string;
    agentPrivateKey: `0x${string}`;
    marginMode: MarginMode;
    leverage: number;
  }) => Promise<unknown>;
};

export const useTradeOrderDrawerStore = create<TradeOrderDrawerState>()(
  persist(
    (set) => ({
      isError: null,

      isOpen: false,
      sideOpenWith: undefined,
      isPlacingOrderWithAgentLoading: false,
      marginMode: "cross",
      maxLeverage: 0,
      userLeverage: 0,
      availableToTradeBuy: 0,
      availableToTradeSell: 0,
      markPrice: 0,
      marketPriceWithSlippage: 0,
      maxSlippage: 2,
      currentPosition: 0,
      currentUnrealizedPnl: 0,
      liquidationPx: 0,
      crossAccountValue: 0,
      totalCrossPositionValue: 0,
      crossAccountLeverage: 0,
      perpsBalance: 0,
      szDecimals: null,
      isLoadingSzDecimals: false,
      sliderValue: 0,
      limitOrderPrice: "",
      timeInForce: "GTC",
      sizeInputValue: "0.00",
      sizeInputValueForSelectedMarket: "0.00",

      openTradeOrderDrawer: ({ side } = {}) => {
        set({
          isOpen: true,
          sideOpenWith: side,
        });
      },
      closeTradeOrderDrawer: () => {
        set({ isOpen: false });
      },
      placeOrderWithAgent: async ({
        agentPrivateKey,
        a,
        b,
        s,
        p,
        r,
        tif = "FrontendMarket",
        takeProfitPrice,
        stopLossPrice,
      }) => {
        set({ isPlacingOrderWithAgentLoading: true });
        const loadingToastId = appToast.loading({
          title: "Order Submitted...",
        });
        try {
          const resp = await placeOrderWithAgent({
            agentPrivateKey,
            a,
            b,
            s,
            p,
            r,
            tif,
            takeProfitPrice,
            stopLossPrice,
          });
          if (isOrderPayloadOk(resp)) {
            appToast.dismiss(loadingToastId);
            resp.response.data.statuses.forEach((status) => {
              if (isFilledOrderStatus(status)) {
                appToast.success({
                  title: `${status.filled.totalSz} assert ${b ? "bought" : "sold"} at average price ${status.filled.avgPx}`,
                });
              } else if (tif === "Gtc" || tif === "Ioc" || tif === "Alo") {
                appToast.success({ title: "Limit Order placed successfully" });
              } else {
                appToast.success({ title: "Order placed successfully" });
              }
            });
            set({ isPlacingOrderWithAgentLoading: false });
            return true;
          }
          appToast.dismiss(loadingToastId);
          appToast.error({
            title: "Order Failed",
            message: resp.response.type || "Failed to place order",
          });
          set({
            isError: resp.response.type,
            isPlacingOrderWithAgentLoading: false,
          });
          return false;
        } catch (error) {
          appToast.dismiss(loadingToastId);
          const errorMessage = errorHandler(error);
          appToast.error({ title: "Order Failed", message: errorMessage });
          set({ isError: errorMessage, isPlacingOrderWithAgentLoading: false });
          return false;
        } finally {
          set({ isPlacingOrderWithAgentLoading: false });
        }
      },

      setMarginMode: (marginMode) => {
        set({ marginMode });
      },
      setMaxLeverage: (maxLeverage) => {
        set({ maxLeverage });
      },
      setUserLeverage: (userLeverage) => {
        set({ userLeverage });
      },
      setAvailableToTradeBuy: (availableToTradeBuy) => {
        set({ availableToTradeBuy });
      },
      setAvailableToTradeSell: (availableToTradeSell) => {
        set({ availableToTradeSell });
      },
      setMarkPrice: (markPrice) => {
        set({ markPrice });
      },
      setMarketPriceWithSlippage: (marketPriceWithSlippage) => {
        set({ marketPriceWithSlippage });
      },
      setMaxSlippage: (maxSlippage) => {
        set({ maxSlippage });
      },
      setCurrentPosition: (currentPosition) => {
        set({ currentPosition });
      },
      setCurrentUnrealizedPnl: (currentUnrealizedPnl) => {
        set({ currentUnrealizedPnl });
      },
      setLiquidationPx: (liquidationPx) => {
        set({ liquidationPx });
      },
      setCrossAccountValue: (crossAccountValue) => {
        set({ crossAccountValue });
      },
      setTotalCrossPositionValue: (totalCrossPositionValue) => {
        set({ totalCrossPositionValue });
      },
      setCrossAccountLeverage: (crossAccountLeverage) => {
        set({ crossAccountLeverage });
      },
      setPerpsBalance: (perpsBalance) => {
        set({ perpsBalance });
      },
      setSzDecimals: (szDecimals) => {
        set({ szDecimals });
      },
      setSliderValue: (sliderValue) => {
        set({ sliderValue });
      },
      setLimitOrderPrice: (limitOrderPrice) => {
        set({ limitOrderPrice });
      },
      setTimeInForce: (timeInForce) => {
        set({ timeInForce });
      },
      setSizeInputValue: (sizeInputValue) => {
        set({ sizeInputValue });
      },
      setSizeInputValueForSelectedMarket: (sizeInputValueForSelectedMarket) => {
        set({ sizeInputValueForSelectedMarket });
      },
      resolveSzDecimals: async (currentCurrency) => {
        set({ isLoadingSzDecimals: true });
        try {
          const converter = await getSymbolConverter();
          const decimals = converter.getSzDecimals(currentCurrency);
          const normalizedDecimals =
            typeof decimals === "number" && Number.isFinite(decimals)
              ? decimals
              : 4;
          return normalizedDecimals;
        } catch (error) {
          errorHandler(error, "Resolve Size Decimals Error");
          set({ szDecimals: 4 });
          return 4;
        } finally {
          set({ isLoadingSzDecimals: false });
        }
      },

      getLiveActiveAssetData: async (
        address,
        currentCurrency,
        setMarginMode,
        setUserLeverage,
        setAvailableToTradeBuy,
        setAvailableToTradeSell,
        setMarkPrice,
      ) => {
        try {
          const subscription = await subscriptionClient.activeAssetData(
            { user: address as `0x${string}`, coin: currentCurrency },
            (data) => {
              console.log("data", data);
              setMarginMode(
                data?.leverage.type === "isolated" ? "isolated" : "cross",
              );
              setUserLeverage(Number(data?.leverage.value) || 0);
              setAvailableToTradeBuy(
                Number(data?.availableToTrade?.[0]) > 0
                  ? Number(data.availableToTrade[0])
                  : 0,
              );
              setAvailableToTradeSell(
                Number(data?.availableToTrade?.[1]) > 0
                  ? Number(data.availableToTrade[1])
                  : 0,
              );
              setMarkPrice(Number(data?.markPx) || 0);
            },
          );

          return subscription;
        } catch (error) {
          errorHandler(error, "Active Asset Data Stream Error");
          return null;
        }
      },
      getLiveWebData2: async (
        address,
        currentCurrency,
        setCurrentPosition,
        setCurrentUnrealizedPnl,
        setLiquidationPx,
        setCrossAccountValue,
        setTotalCrossPositionValue,
        setCrossAccountLeverage,
        setPerpsBalance,
      ) => {
        try {
          const subscription = await subscriptionClient.webData2(
            { user: address as `0x${string}` },
            (data) => {
              const assetPositions =
                data?.clearinghouseState?.assetPositions ?? [];

              const positionData = assetPositions.filter(
                (position) => position?.position?.coin === currentCurrency,
              )[0];
              const positionValue = positionData
                ? Number(positionData.position.szi)
                : 0;
              setCurrentPosition(positionValue);

              const unrealizedPnlValue = data?.clearinghouseState
                ?.assetPositions?.[0]?.position?.unrealizedPnl
                ? Number(
                    data?.clearinghouseState?.assetPositions?.[0]?.position
                      ?.unrealizedPnl,
                  )
                : 0;
              setCurrentUnrealizedPnl(
                Number.isFinite(unrealizedPnlValue) ? unrealizedPnlValue : 0,
              );
              const liquidationPxValue = positionData?.position?.liquidationPx;
              setLiquidationPx(Number(liquidationPxValue ?? 0));
              const crossAccountValue = Number(
                data?.clearinghouseState?.marginSummary?.accountValue ?? 0,
              );
              const totalCrossPositionValue = assetPositions.reduce(
                (sum, position) => {
                  const isCross =
                    position?.position?.leverage?.type === "cross";
                  if (!isCross) return sum;
                  const notional = Math.abs(
                    Number(position?.position?.positionValue ?? 0),
                  );
                  return sum + (Number.isFinite(notional) ? notional : 0);
                },
                0,
              );
              const crossAccountLeverage =
                Number.isFinite(crossAccountValue) && crossAccountValue > 0
                  ? totalCrossPositionValue / crossAccountValue
                  : 0;
              const totalUnrealizedPnl = assetPositions.reduce(
                (sum, position) => {
                  const unrealizedPnl = Number(
                    position?.position?.unrealizedPnl ?? 0,
                  );
                  return (
                    sum + (Number.isFinite(unrealizedPnl) ? unrealizedPnl : 0)
                  );
                },
                0,
              );
              const perpsBalance = crossAccountValue - totalUnrealizedPnl;
              setCrossAccountValue(
                Number.isFinite(crossAccountValue) ? crossAccountValue : 0,
              );
              setTotalCrossPositionValue(
                Number.isFinite(totalCrossPositionValue)
                  ? totalCrossPositionValue
                  : 0,
              );
              setCrossAccountLeverage(
                Number.isFinite(crossAccountLeverage)
                  ? crossAccountLeverage
                  : 0,
              );
              setPerpsBalance(Number.isFinite(perpsBalance) ? perpsBalance : 0);
            },
          );

          return subscription;
        } catch (error) {
          errorHandler(error, "WebData2 Stream Error");
          return null;
        }
      },

      isUpdateMarginAndLeverageLoading: false,
      updateMarginAndLeverage: async ({
        currentCurrency,
        agentPrivateKey,
        marginMode,
        leverage,
      }) => {
        set({ isUpdateMarginAndLeverageLoading: true });

        try {
          const conv = await getSymbolConverter();
          const assetId = conv.getAssetId(currentCurrency);
          const exchange = getAgentExchangeClient(agentPrivateKey);

          const resp = await exchange.updateLeverage({
            asset: assetId as number,
            isCross: marginMode === "cross",
            leverage,
          });

          if (resp.status === "ok") {
            return resp;
          } else {
            set({
              isError: resp.response.type,
              isUpdateMarginAndLeverageLoading: false,
            });
            return false;
          }
        } catch (error) {
          set({
            isError: errorHandler(error, "Update Margin And Leverage Error"),
            isUpdateMarginAndLeverageLoading: false,
          });
          return null;
        } finally {
          set({ isUpdateMarginAndLeverageLoading: false });
        }
      },
    }),
    {
      name: "trade-order-drawer-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        maxSlippage: state.maxSlippage,
      }),
    },
  ),
);
