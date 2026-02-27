export type OrderBookRawLevel =
  | [number | string, number | string]
  | {
      px?: number | string;
      sz?: number | string;
      price?: number | string;
      size?: number | string;
    };

export type OrderBookResponse = {
  coin?: string;
  levels?: [OrderBookRawLevel[], OrderBookRawLevel[]];
  time?: number;
};

export type OrderBookLevel = {
  price: number;
  size: number;
  total: number;
};

export type OrderBookSnapshot = {
  coin: string;
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number | null;
  spreadPercent: number | null;
  timestamp: number | null;
};
