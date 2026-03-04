import {
  getAgentExchangeClient,
  getSymbolConverter,
  subscriptionClient,
} from "@/lib/clients/hyperliquid";
import { errorHandler } from "@/lib/utils/error-handler";
import type { ISubscription } from "@nktkas/hyperliquid";
import { create } from "zustand";

type TradeSide = "long" | "short";
type MarginMode = "cross" | "isolated";

type TradeOrderDrawerState = {
  isError: string | null;
  isOpen: boolean;
  sideOpenWith?: TradeSide;
  openTradeOrderDrawer: (params?: { side?: TradeSide }) => void;
  closeTradeOrderDrawer: () => void;
  isUpdateMarginAndLeverageLoading: boolean;
  isLoadingSzDecimals: boolean;
  sliderValue: number;
  setSliderValue: (sliderValue: number) => void;
  sizeInputValue: string;
  setSizeInputValue: (sizeInputValue: string) => void;

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
  currentPosition: number;
  setCurrentPosition: (currentPosition: number) => void;
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
  ) => Promise<ISubscription | null>;
  updateMarginAndLeverage: (params: {
    currentCurrency: string;
    agentPrivateKey: `0x${string}`;
    marginMode: MarginMode;
    leverage: number;
  }) => Promise<unknown>;
};

export const useTradeOrderDrawerStore = create<TradeOrderDrawerState>(
  (set) => ({
    isError: null,

    isOpen: false,
    sideOpenWith: undefined,
    marginMode: "cross",
    maxLeverage: 0,
    userLeverage: 0,
    availableToTradeBuy: 0,
    availableToTradeSell: 0,
    markPrice: 0,
    currentPosition: 0,
    szDecimals: null,
    isLoadingSzDecimals: false,
    sliderValue: 0,
    sizeInputValue: "0.00",

    openTradeOrderDrawer: ({ side } = {}) => {
      set({
        isOpen: true,
        sideOpenWith: side,
      });
    },
    closeTradeOrderDrawer: () => {
      set({ isOpen: false });
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
    setCurrentPosition: (currentPosition) => {
      set({ currentPosition });
    },
    setSzDecimals: (szDecimals) => {
      set({ szDecimals });
    },
    setSliderValue: (sliderValue) => {
      set({ sliderValue });
    },
    setSizeInputValue: (sizeInputValue) => {
      set({ sizeInputValue });
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
    getLiveWebData2: async (address, currentCurrency, setCurrentPosition) => {
      try {
        const subscription = await subscriptionClient.webData2(
          { user: address as `0x${string}` },
          (data) => {
            const positionData = data?.clearinghouseState?.assetPositions?.find(
              (position) => position?.position?.coin === currentCurrency,
            );
            const positionValue = positionData
              ? Number(positionData.position.szi)
              : 0;
            setCurrentPosition(positionValue);
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
);
