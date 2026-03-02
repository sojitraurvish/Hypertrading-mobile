import { create } from "zustand";

type TradeSide = "long" | "short";

type TradeOrderDrawerState = {
  isOpen: boolean;
  sideOpenWith?: TradeSide;
  openTradeOrderDrawer: (params?: { side?: TradeSide }) => void;
  closeTradeOrderDrawer: () => void;
};

export const useTradeOrderDrawerStore = create<TradeOrderDrawerState>((set) => ({
  isOpen: false,
  sideOpenWith: undefined,
  openTradeOrderDrawer: ({ side } = {}) => {
    set({
      isOpen: true,
      sideOpenWith: side,
    });
  },
  closeTradeOrderDrawer: () => {
    set({ isOpen: false });
  },
}));
