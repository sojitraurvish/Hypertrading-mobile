export type PerpetualMarket = {
  coin: string;
  symbol: string;
  leverage: string | null;
  lastPrice: number | null;
  change24h: number | null;
  change24hPer: number | null;
  fundingPer: number | null;
  funding8hour: number | null;
  volume: number | null;
  openInterest: number | null;
  mark: number | null;
  oracle: number | null;
  volume24h: number | null;
  fundingDisplay: string | null;
  countdown: string | null;
  isFavorite: boolean;
};
