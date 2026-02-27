import { infoClient } from "@/lib/clients/hyperliquid";
import { errorHandler } from "@/lib/utils/error-handler";
import { CandleInterval, ChartCandle } from "@/types/chart";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface GetCandleDataOptions {
  coin: string;
  interval: CandleInterval;
  startTime: number;
}

type ChartStore = {

  isGetCandleDataLoading: boolean;
  error: string | null;
  getCandleData: (options: GetCandleDataOptions) => Promise<ChartCandle[]>;
};

const INITIAL_STATE = {

  isGetCandleDataLoading: false,
  error: null as string | null,
};

export const useChartStore = create<ChartStore>()(
  devtools((set) => ({
    ...INITIAL_STATE,

    getCandleData: async ({
      coin,
      interval,
      startTime,
    }) => {
      set({ isGetCandleDataLoading: true, error: null });

      try {
        const endTime = Date.now();
        const timeRange = endTime - startTime;
        const maxTimeRange = 6 * 365 * 24 * 60 * 60 * 1000; // 6 years.

        if (timeRange > maxTimeRange) {
          throw new Error(
            `Time range too large. Maximum allowed: 6 years. Requested: ${Math.round(timeRange / (24 * 60 * 60 * 1000))} days. ` +
              "Please select a shorter time period.",
          );
        }

        const data = await infoClient.candleSnapshot({
          coin,
          interval,
          startTime,
          endTime,
        });

        return data 
      } catch (error: unknown) {
        const message = errorHandler(error, "Chart Data Error");
        set({ error: message});
        throw error;
      } finally {
        set({ isGetCandleDataLoading: false });
      }
    },

  })),
);
