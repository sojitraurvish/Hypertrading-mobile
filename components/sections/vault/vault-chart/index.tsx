import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { VARIANT_TYPES } from "@/lib/constants";
import { errorHandler } from "@/lib/utils/error-handler";
import { cn } from "@/lib/utils/tailwind-configs";
import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";

export type VaultChartCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type VaultChartVolume = {
  time: number;
  value: number;
  color: string;
};

export type VaultTradeMarker = {
  time: number;
  side: "buy" | "sell";
  price?: number;
  label?: string;
};

type Props = {
  pairLabel: string;
  intervalLabel: string;
  rangeOptions: readonly string[];
  activeRange: string;
  onRangeChange: (range: string) => void;
  onIntervalChange?: (interval: string) => void;
  onInteractionChange?: (interacting: boolean) => void;
  candles: VaultChartCandle[];
  volumes: VaultChartVolume[];
  markers?: VaultTradeMarker[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
};

type ChartPayload = {
  candles: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
  }[];
  volumes: {
    time: number;
    value: number;
    color: string;
  }[];
  markers: {
    time: number;
    position: "aboveBar" | "belowBar";
    color: string;
    shape: "circle";
    text: string;
  }[];
};

type IntervalOption = {
  title: string;
  value: string;
  isFavorite: boolean;
};

type IntervalSection = {
  title: string;
  value: IntervalOption[];
};

const DEFAULT_INTERVAL_SECTIONS: IntervalSection[] = [
  {
    title: "minutes",
    value: [
      { title: "1 minute", value: "1m", isFavorite: false },
      { title: "3 minutes", value: "3m", isFavorite: true },
      { title: "5 minutes", value: "5m", isFavorite: true },
      { title: "15 minutes", value: "15m", isFavorite: true },
      { title: "30 minutes", value: "30m", isFavorite: false },
    ],
  },
  {
    title: "hours",
    value: [
      { title: "1 hour", value: "1h", isFavorite: true },
      { title: "2 hours", value: "2h", isFavorite: false },
      { title: "4 hours", value: "4h", isFavorite: false },
      { title: "8 hours", value: "8h", isFavorite: false },
      { title: "12 hours", value: "12h", isFavorite: false },
    ],
  },
  {
    title: "days",
    value: [
      { title: "1 day", value: "1d", isFavorite: false },
      { title: "3 days", value: "3d", isFavorite: false },
      { title: "1 week", value: "1w", isFavorite: false },
      { title: "1 month", value: "1M", isFavorite: false },
    ],
  },
];

const CHART_HEIGHT = 340;
const INTERVAL_FAVORITES_STORAGE_KEY = "vault-chart-interval-favorites-v1";
const EMPTY_PAYLOAD_JSON = JSON.stringify({
  candles: [],
  volumes: [],
  markers: [],
});
const webViewModule = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("react-native-webview");
  } catch {
    return null;
  }
})();
const WebViewComponent = webViewModule?.WebView as
  | React.ComponentType<any>
  | undefined;

const toUnixSeconds = (value: number) =>
  Math.floor(value > 1_000_000_000_000 ? value / 1000 : value);

const makePayload = (
  candles: VaultChartCandle[],
  volumes: VaultChartVolume[],
  markers: VaultTradeMarker[],
): ChartPayload => {
  const safeCandles = candles
    .map((item) => ({
      time: toUnixSeconds(Number(item.time)),
      open: Number(item.open),
      high: Number(item.high),
      low: Number(item.low),
      close: Number(item.close),
    }))
    .filter(
      (item) =>
        Number.isFinite(item.time) &&
        Number.isFinite(item.open) &&
        Number.isFinite(item.high) &&
        Number.isFinite(item.low) &&
        Number.isFinite(item.close) &&
        item.open > 0 &&
        item.high > 0 &&
        item.low > 0 &&
        item.close > 0 &&
        item.high >= item.low,
    )
    .sort((a, b) => a.time - b.time);

  // Drop obvious bad ticks that can crush autoscale and make candles appear tiny.
  const closeValues = safeCandles
    .map((item) => item.close)
    .sort((a, b) => a - b);
  const medianClose =
    closeValues.length === 0
      ? null
      : closeValues[Math.floor(closeValues.length / 2)];
  const filteredCandles =
    medianClose == null
      ? safeCandles
      : safeCandles.filter((item) => {
          const max = medianClose * 5;
          const min = medianClose * 0.2;
          return (
            item.open <= max &&
            item.high <= max &&
            item.low <= max &&
            item.close <= max &&
            item.open >= min &&
            item.high >= min &&
            item.low >= min &&
            item.close >= min
          );
        });

  const volumeByTime = new Map<number, VaultChartVolume>();
  for (const item of volumes) {
    const key = toUnixSeconds(Number(item.time));
    if (!Number.isFinite(key)) continue;
    volumeByTime.set(key, item);
  }

  const safeVolumes = filteredCandles.map((candle) => {
    const found = volumeByTime.get(candle.time);
    const candleColor = candle.close >= candle.open ? "#22c55e88" : "#ef444488";
    if (found) {
      return {
        time: candle.time,
        value: Number.isFinite(Number(found.value)) ? Number(found.value) : 0,
        // Keep volume colors synced with candle direction for consistency.
        color: candleColor,
      };
    }
    return {
      time: candle.time,
      value: 0,
      color: candleColor,
    };
  });

  const safeMarkers = markers
    .map((item) => {
      const time = toUnixSeconds(Number(item.time));
      if (!Number.isFinite(time)) return null;
      return {
        time,
        position:
          item.side === "buy" ? ("belowBar" as const) : ("aboveBar" as const),
        color: item.side === "buy" ? "#22c55e" : "#ef4444",
        shape: "circle" as const,
        text: item.label ?? (item.side === "buy" ? "B" : "S"),
      };
    })
    .filter((item): item is ChartPayload["markers"][number] => item !== null)
    .sort((a, b) => a.time - b.time);

  return {
    candles: filteredCandles,
    volumes: safeVolumes,
    markers: safeMarkers,
  };
};

const makeChartHtml = (initialPayloadJson: string) => `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width,initial-scale=1"
    />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #050c1a;
      }
      #container {
        width: 100%;
        height: 100%;
        touch-action: none;
      }
      /* Hide Lightweight Charts attribution/logo anchor when present. */
      #container a[href*="tradingview"],
      #container a[class*="tv"],
      #container a[title*="TradingView"] {
        display: none !important;
        opacity: 0 !important;
        pointer-events: none !important;
        visibility: hidden !important;
      }
      #error {
        display: none;
        color: #ef4444;
        font-family: Arial, sans-serif;
        font-size: 12px;
        padding: 8px;
      }
    </style>
  </head>
  <body>
    <div id="container"></div>
    <div id="error">Failed to load chart library.</div>
    <script>
      const INITIAL_PAYLOAD = ${initialPayloadJson};
      const container = document.getElementById("container");
      const errorBox = document.getElementById("error");
      let chart = null;
      let candleSeries = null;
      let volumeSeries = null;
      let markerPrimitive = null;
      let lastCrosshairTime = null;

      const notifyNative = (payload) => {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      };

      const loadScript = (src) =>
        new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = src;
          script.async = true;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });

      const ensureLibrary = async () => {
        if (window.LightweightCharts) return;
        try {
          await loadScript("https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js");
          return;
        } catch (_) {}
        await loadScript("https://cdn.jsdelivr.net/npm/lightweight-charts/dist/lightweight-charts.standalone.production.js");
      };

      const createChartInstance = () => {
        const LWC = window.LightweightCharts;
        chart = LWC.createChart(container, {
          layout: {
            background: { type: "solid", color: "#050c1a" },
            textColor: "#94a3b8",
            fontSize: 9,
            attributionLogo: false,
          },
          grid: {
            vertLines: { color: "#1e293b" },
            horzLines: { color: "#1e293b" },
          },
          rightPriceScale: {
            borderVisible: true,
            borderColor: "#1e293b",
            autoScale: true,
            minimumWidth: 36,
            entireTextOnly: true,
            alignLabels: true,
            scaleMargins: {
              top: 0.08,
              bottom: 0.12,
            },
          },
          leftPriceScale: {
            visible: false,
          },
          crosshair: {
            mode: LWC.CrosshairMode.Normal,
            vertLine: {
              color: "#334155",
              width: 1,
              style: LWC.LineStyle.Dotted,
              labelBackgroundColor: "#0f172a",
            },
            horzLine: {
              color: "#334155",
              width: 1,
              style: LWC.LineStyle.Dotted,
              labelBackgroundColor: "#0f172a",
            },
          },
          timeScale: {
            borderVisible: true,
            borderColor: "#1e293b",
            timeVisible: true,
            secondsVisible: false,
            rightOffset: 0,
            barSpacing: 8,
            minBarSpacing: 2,
            fixLeftEdge: false,
            fixRightEdge: false,
            lockVisibleTimeRangeOnResize: false,
            rightBarStaysOnScroll: true,
          },
          handleScale: {
            pinch: true,
            mouseWheel: true,
            axisPressedMouseMove: true,
            axisDoubleClickReset: true,
          },
          handleScroll: {
            horzTouchDrag: true,
            vertTouchDrag: true,
            mouseWheel: true,
            pressedMouseMove: true,
          },
          kineticScroll: {
            touch: true,
            mouse: false,
          },
          localization: {
            priceFormatter: (price) => {
              const value = Number(price);
              if (!Number.isFinite(value)) return "";
              const abs = Math.abs(value);
              const fractionDigits =
                abs >= 1000 ? 0 : abs >= 1 ? 2 : 4;
              return value.toLocaleString(undefined, {
                useGrouping: false,
                minimumFractionDigits: fractionDigits,
                maximumFractionDigits: fractionDigits,
              });
            },
          },
        });

        candleSeries = chart.addSeries(LWC.CandlestickSeries, {
          upColor: "#22c55e",
          downColor: "#ef4444",
          borderUpColor: "#22c55e",
          borderDownColor: "#ef4444",
          wickUpColor: "#22c55e",
          wickDownColor: "#ef4444",
          priceLineColor: "#ef4444",
          priceLineStyle: LWC.LineStyle.Dotted,
          priceFormat: {
            type: "price",
            precision: 2,
            minMove: 0.1,
          },
        });

        volumeSeries = chart.addSeries(LWC.HistogramSeries, {
          priceFormat: { type: "volume" },
          priceLineVisible: false,
          lastValueVisible: false,
          priceScaleId: "",
        });
        volumeSeries.priceScale().applyOptions({
          scaleMargins: {
            top: 0.82,
            bottom: 0,
          },
        });

        const resize = () => {
          chart.resize(container.clientWidth, container.clientHeight);
        };
        window.addEventListener("resize", resize);
        resize();
      };

      const setMarkers = (markers) => {
        const LWC = window.LightweightCharts;
        if (!candleSeries) return;
        if (typeof LWC.createSeriesMarkers === "function") {
          if (!markerPrimitive) {
            markerPrimitive = LWC.createSeriesMarkers(candleSeries, markers);
          } else {
            markerPrimitive.setMarkers(markers);
          }
          return;
        }
        if (typeof candleSeries.setMarkers === "function") {
          candleSeries.setMarkers(markers);
        }
      };

      const applyPayload = (payload, fit) => {
        if (!chart || !candleSeries || !volumeSeries) return;
        const candles = payload.candles || [];
        candleSeries.setData(candles);
        volumeSeries.setData(payload.volumes || []);
        setMarkers(payload.markers || []);

        const latestCandle = candles[candles.length - 1];
        if (latestCandle) {
          const isUp = Number(latestCandle.close) >= Number(latestCandle.open);
          candleSeries.applyOptions({
            priceLineColor: isUp ? "#22c55e" : "#ef4444",
          });
        }

        if (fit) {
          chart.timeScale().fitContent();
        }
      };

      window.__updateChartData = (payload, fit = false) => {
        try {
          applyPayload(payload, Boolean(fit));
          notifyNative({ type: "updated" });
        } catch (error) {
          notifyNative({ type: "error", message: String(error) });
        }
      };

      const bootstrap = async () => {
        try {
          await ensureLibrary();
          createChartInstance();
          applyPayload(INITIAL_PAYLOAD, true);
          chart.subscribeCrosshairMove((param) => {
            if (!param || !param.time || !param.seriesData) {
              if (lastCrosshairTime !== null) {
                lastCrosshairTime = null;
                notifyNative({ type: "crosshair", candle: null });
              }
              return;
            }
            const candle = param.seriesData.get(candleSeries);
            if (!candle || candle.open == null) {
              if (lastCrosshairTime !== null) {
                lastCrosshairTime = null;
                notifyNative({ type: "crosshair", candle: null });
              }
              return;
            }
            const time = Number(candle.time);
            if (Number.isFinite(time) && lastCrosshairTime !== time) {
              lastCrosshairTime = time;
              notifyNative({
                type: "crosshair",
                candle: {
                  time,
                  open: Number(candle.open),
                  high: Number(candle.high),
                  low: Number(candle.low),
                  close: Number(candle.close),
                },
              });
            }
          });
          const beginGesture = () => notifyNative({ type: "gesture", active: true });
          const endGesture = () => notifyNative({ type: "gesture", active: false });
          container.addEventListener("touchstart", beginGesture, { passive: true });
          container.addEventListener("touchend", endGesture, { passive: true });
          container.addEventListener("touchcancel", endGesture, { passive: true });
          container.addEventListener("pointerdown", beginGesture);
          container.addEventListener("pointerup", endGesture);
          container.addEventListener("pointercancel", endGesture);
          notifyNative({ type: "ready" });
        } catch (error) {
          errorBox.style.display = "block";
          notifyNative({ type: "error", message: String(error) });
        }
      };

      bootstrap();
    </script>
  </body>
</html>
`;

const ChartCanvas: React.FC<{
  initialHtml: string;
  payloadJson: string;
  fitToken: string;
  chartHeight: number;
  fill?: boolean;
  onChartEvent?: (payload: any) => void;
}> = ({
  initialHtml,
  payloadJson,
  fitToken,
  chartHeight,
  fill = false,
  onChartEvent,
}) => {
  const webViewRef = useRef<any>(null);
  const [webViewReady, setWebViewReady] = useState(false);
  const lastFitTokenRef = useRef<string>("");

  useEffect(() => {
    if (!webViewReady) return;
    const shouldFit = lastFitTokenRef.current !== fitToken;
    lastFitTokenRef.current = fitToken;
    const script = `window.__updateChartData(${payloadJson}, ${shouldFit}); true;`;
    webViewRef.current?.injectJavaScript(script);
  }, [fitToken, payloadJson, webViewReady]);

  const onWebMessage = (event: any) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      onChartEvent?.(payload);
      if (payload?.type === "ready") {
        setWebViewReady(true);
      }
    } catch {
      // ignore non-JSON messages
    }
  };

  if (!WebViewComponent) {
    return (
      <View className="flex-1 items-center justify-center px-4">
        <AppText
          variant={VARIANT_TYPES.NOT_SELECTED}
          className="text-text-tertiary-dark text-center text-[12px]"
        >
          Chart requires a dev build with `react-native-webview`.
        </AppText>
      </View>
    );
  }

  return (
    <View style={fill ? { flex: 1 } : { height: chartHeight }}>
      <WebViewComponent
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html: initialHtml }}
        onMessage={onWebMessage}
        javaScriptEnabled
        domStorageEnabled
        bounces={false}
        scrollEnabled
        nestedScrollEnabled
        androidLayerType="hardware"
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: "#050c1a", flex: 1 }}
      />
    </View>
  );
};

export const VaultChart: React.FC<Props> = ({
  pairLabel,
  intervalLabel,
  rangeOptions,
  activeRange,
  onRangeChange,
  onIntervalChange,
  onInteractionChange,
  candles,
  volumes,
  markers = [],
  isLoading,
  error,
  onRetry,
}) => {
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isIntervalMenuOpen, setIsIntervalMenuOpen] = useState(false);
  const hasHydratedFavoritesRef = useRef(false);
  const inlineIntervalTriggerRef = useRef<View>(null);
  const fullscreenIntervalTriggerRef = useRef<View>(null);
  const [intervalMenuPosition, setIntervalMenuPosition] = useState<{
    top: number;
    left: number;
    width: number;
  }>({
    top: 0,
    left: 0,
    width: 210,
  });
  const [intervalSections, setIntervalSections] = useState<IntervalSection[]>(
    DEFAULT_INTERVAL_SECTIONS,
  );
  const [selectedInterval, setSelectedInterval] = useState(intervalLabel);
  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >({
    minutes: false,
    hours: false,
    days: false,
  });
  const [hoveredCandle, setHoveredCandle] = useState<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
  } | null>(null);
  const payload = useMemo(
    () => makePayload(candles, volumes, markers),
    [candles, volumes, markers],
  );
  const payloadJson = useMemo(() => JSON.stringify(payload), [payload]);
  const initialHtml = useMemo(() => makeChartHtml(EMPTY_PAYLOAD_JSON), []);
  const fitToken = useMemo(
    () => `${pairLabel}:${activeRange}:${intervalLabel}`,
    [activeRange, intervalLabel, pairLabel],
  );
  const inlineChartHeight = useMemo(
    () => Math.max(CHART_HEIGHT, Math.min(540, Math.floor(screenHeight * 0.5))),
    [screenHeight],
  );

  useEffect(() => {
    setIsIntervalMenuOpen(false);
  }, [isFullscreen]);

  useEffect(() => {
    setHoveredCandle(null);
  }, [activeRange, payload.candles.length]);

  useEffect(() => {
    setSelectedInterval(intervalLabel);
  }, [intervalLabel]);

  useEffect(() => {
    const hydrateFavorites = async () => {
      try {
        const raw = await AsyncStorage.getItem(INTERVAL_FAVORITES_STORAGE_KEY);
        if (!raw) {
          return;
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
          return;
        }
        const favoriteValues = new Set(
          parsed.filter((value): value is string => typeof value === "string"),
        );
        setIntervalSections((prev) =>
          prev.map((section) => ({
            ...section,
            value: section.value.map((option) => ({
              ...option,
              isFavorite: favoriteValues.has(option.value),
            })),
          })),
        );
      } catch (error) {
        errorHandler(error, "Chart Settings Error");
        // Ignore storage parse/read failures and keep defaults.
      } finally {
        hasHydratedFavoritesRef.current = true;
      }
    };

    void hydrateFavorites();
  }, []);

  useEffect(() => {
    if (!hasHydratedFavoritesRef.current) {
      return;
    }
    const favoriteValues = intervalSections
      .flatMap((section) => section.value)
      .filter((option) => option.isFavorite)
      .map((option) => option.value);
    void AsyncStorage.setItem(
      INTERVAL_FAVORITES_STORAGE_KEY,
      JSON.stringify(favoriteValues),
    );
  }, [intervalSections]);

  useEffect(() => {
    return () => {
      onInteractionChange?.(false);
    };
  }, [onInteractionChange]);

  const precision = useMemo(() => {
    const sample =
      hoveredCandle?.close ??
      payload.candles[payload.candles.length - 1]?.close;
    if (sample == null) return 2;
    return sample >= 1000 ? 2 : sample >= 1 ? 4 : 6;
  }, [hoveredCandle?.close, payload.candles]);

  const latest = hoveredCandle ?? payload.candles[payload.candles.length - 1];
  const favoriteIntervals = useMemo(
    () =>
      intervalSections
        .flatMap((section) => section.value)
        .filter((item) => item.isFavorite),
    [intervalSections],
  );
  const selectedIntervalTitle = useMemo(() => {
    const matched = intervalSections
      .flatMap((section) => section.value)
      .find((item) => item.value === selectedInterval);
    return matched?.value ?? selectedInterval;
  }, [intervalSections, selectedInterval]);
  const priceDelta = useMemo(() => {
    if (payload.candles.length < 2) return null;
    const current = payload.candles[payload.candles.length - 1];
    const previous = payload.candles[payload.candles.length - 2];
    const change = current.close - previous.close;
    const pct = previous.close === 0 ? 0 : (change / previous.close) * 100;
    return { change, pct };
  }, [payload.candles]);
  const isUp = latest ? latest.close >= latest.open : true;

  const renderRangeRow = () => (
    <View className="px-3 pb-3 pt-2 border-t border-border-primary-dark">
      <View className="flex-row flex-wrap gap-2">
        {rangeOptions.map((range) => {
          const isActive = activeRange === range;
          return (
            <AppButton
              key={range}
              variant={VARIANT_TYPES.NOT_SELECTED}
              className={cn(
                "px-3 py-1 rounded-md border",
                isActive
                  ? "bg-bg-senary-dark border-bg-senary-dark"
                  : "bg-bg-tertiary-dark border-border-primary-dark",
              )}
              onPress={() => onRangeChange(range)}
            >
              <AppText
                variant={VARIANT_TYPES.NOT_SELECTED}
                className={cn(
                  "text-[10px] font-semibold",
                  isActive ? "text-black" : "text-text-tertiary-dark",
                )}
              >
                {range}
              </AppText>
            </AppButton>
          );
        })}
      </View>
    </View>
  );

  const toggleFavoriteInterval = (value: string) => {
    setIntervalSections((prev) =>
      prev.map((section) => ({
        ...section,
        value: section.value.map((option) =>
          option.value === value
            ? { ...option, isFavorite: !option.isFavorite }
            : option,
        ),
      })),
    );
  };

  const selectInterval = (value: string) => {
    setSelectedInterval(value);
    setIsIntervalMenuOpen(false);
    onIntervalChange?.(value);
  };

  const toggleSectionCollapse = (sectionTitle: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  const openIntervalMenu = () => {
    const targetRef = isFullscreen
      ? fullscreenIntervalTriggerRef.current
      : inlineIntervalTriggerRef.current;
    if (!targetRef) {
      setIsIntervalMenuOpen(true);
      return;
    }
    targetRef.measureInWindow((x, y, width, height) => {
      const menuWidth = 210;
      const left = Math.max(
        8,
        Math.min(x + width - menuWidth, screenWidth - menuWidth - 8),
      );
      const top = y + height + 4;
      setIntervalMenuPosition({ top, left, width: menuWidth });
      setIsIntervalMenuOpen(true);
    });
  };

  const renderIntervalFavorites = () => (
    <View className="w-[190px]">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 6, paddingRight: 6 }}
      >
        {favoriteIntervals.map((item) => {
          const isActive = selectedInterval === item.value;
          return (
            <AppButton
              key={`favorite-${item.value}`}
              variant={VARIANT_TYPES.NOT_SELECTED}
              className={cn(
                "w-[36px] py-1 rounded-md items-center justify-center",
                isActive ? "bg-bg-senary-dark" : "bg-transparent",
              )}
              onPress={() => selectInterval(item.value)}
            >
              <AppText
                variant={VARIANT_TYPES.NOT_SELECTED}
                className={cn(
                  "text-[10px] font-semibold",
                  isActive ? "text-black" : "text-text-tertiary-dark",
                )}
              >
                {item.value}
              </AppText>
            </AppButton>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderIntervalDropdown = () => (
    <View className="w-full max-h-[340px] rounded-xl border border-border-primary-dark bg-[#0a1222] overflow-hidden">
      <ScrollView
        className="px-2 py-2"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {intervalSections.map((section) => {
          const isCollapsed = collapsedSections[section.title] ?? false;
          return (
            <View key={section.title} className="mb-2">
              <AppButton
                variant={VARIANT_TYPES.NOT_SELECTED}
                className="flex-row items-center justify-between py-1"
                onPress={() => toggleSectionCollapse(section.title)}
              >
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="text-[10px] font-bold uppercase tracking-[1px] text-text-octonary-dark"
                >
                  {section.title}
                </AppText>
                <Feather
                  name={isCollapsed ? "chevron-down" : "chevron-up"}
                  size={12}
                  color="#64748b"
                />
              </AppButton>
              {!isCollapsed &&
                section.value.map((option) => {
                  const isActive = selectedInterval === option.value;
                  return (
                    <View
                      key={option.value}
                      className={cn(
                        "mt-1 rounded-md border border-transparent flex-row items-center justify-between",
                        isActive ? "bg-[#124436]" : "bg-transparent",
                      )}
                    >
                      <AppButton
                        variant={VARIANT_TYPES.NOT_SELECTED}
                        className="flex-1 py-1.5 px-2 items-start"
                        onPress={() => selectInterval(option.value)}
                      >
                        <AppText
                          variant={VARIANT_TYPES.NOT_SELECTED}
                          className={cn(
                            "text-[12px]",
                            isActive
                              ? "text-[#52f2a8] font-semibold"
                              : "text-text-primary-dark",
                          )}
                        >
                          {option.title}
                        </AppText>
                      </AppButton>
                      <AppButton
                        variant={VARIANT_TYPES.NOT_SELECTED}
                        className="px-2 py-1"
                        onPress={() => toggleFavoriteInterval(option.value)}
                      >
                        <Ionicons
                          name={option.isFavorite ? "star" : "star-outline"}
                          size={12}
                          color={option.isFavorite ? "#facc15" : "#64748b"}
                        />
                      </AppButton>
                    </View>
                  );
                })}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View className="mx-2 mt-4 rounded-2xl border border-border-primary-dark bg-bg-secondary-dark overflow-hidden">
      <View className="px-3 py-2 border-b border-border-primary-dark flex-row items-center justify-between gap-2">
        <View className="flex-row items-center gap-2">
          {renderIntervalFavorites()}
          <AppButton
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="px-2 py-1 rounded-md bg-bg-tertiary-dark border border-border-primary-dark"
            onPress={() => {}}
          >
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="text-[10px] text-text-tertiary-dark"
            >
              Indicators
            </AppText>
          </AppButton>
        </View>
        <View className="flex-row items-center gap-2">
          <View ref={inlineIntervalTriggerRef} collapsable={false}>
            <AppButton
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="px-2 py-1 rounded-md bg-bg-tertiary-dark border border-border-primary-dark flex-row items-center gap-1"
              onPress={() =>
                isIntervalMenuOpen
                  ? setIsIntervalMenuOpen(false)
                  : openIntervalMenu()
              }
            >
              <AppText
                variant={VARIANT_TYPES.NOT_SELECTED}
                className="text-[10px] text-text-tertiary-dark"
              >
                {selectedIntervalTitle}
              </AppText>
              <Feather
                name={isIntervalMenuOpen ? "chevron-up" : "chevron-down"}
                size={12}
                color="#94a3b8"
              />
            </AppButton>
          </View>
          <AppButton
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="px-2 py-1 rounded-md bg-bg-tertiary-dark border border-border-primary-dark"
            onPress={() => setIsFullscreen(true)}
          >
            <Feather name="maximize-2" size={12} color="#e2e8f0" />
          </AppButton>
        </View>
      </View>

      <View className="px-3 py-2 border-b border-border-primary-dark flex-row items-center gap-2 flex-wrap">
        <AppText
          variant={VARIANT_TYPES.NOT_SELECTED}
          className="text-[10px] text-text-tertiary-dark"
        >
          {pairLabel} · {intervalLabel} · Hyperliquid
        </AppText>
        <View className="w-1.5 h-1.5 rounded-full bg-green-500" />
        <AppText
          variant={VARIANT_TYPES.NOT_SELECTED}
          className={cn(
            "text-[10px]",
            isUp ? "text-green-500" : "text-text-senary-dark",
          )}
        >
          O {latest ? latest.open.toFixed(precision) : "--"}
        </AppText>
        <AppText
          variant={VARIANT_TYPES.NOT_SELECTED}
          className={cn(
            "text-[10px]",
            isUp ? "text-green-500" : "text-text-senary-dark",
          )}
        >
          H {latest ? latest.high.toFixed(precision) : "--"}
        </AppText>
        <AppText
          variant={VARIANT_TYPES.NOT_SELECTED}
          className={cn(
            "text-[10px]",
            isUp ? "text-green-500" : "text-text-senary-dark",
          )}
        >
          L {latest ? latest.low.toFixed(precision) : "--"}
        </AppText>
        <AppText
          variant={VARIANT_TYPES.NOT_SELECTED}
          className={cn(
            "text-[10px]",
            isUp ? "text-green-500" : "text-text-senary-dark",
          )}
        >
          C {latest ? latest.close.toFixed(precision) : "--"}
        </AppText>
        {priceDelta ? (
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className={cn(
              "text-[10px] font-semibold",
              priceDelta.change >= 0
                ? "text-green-500"
                : "text-text-senary-dark",
            )}
          >
            {priceDelta.change >= 0 ? "+" : ""}
            {priceDelta.change.toFixed(precision)} (
            {priceDelta.pct >= 0 ? "+" : ""}
            {priceDelta.pct.toFixed(2)}%)
          </AppText>
        ) : null}
      </View>

      {error && !payload.candles.length ? (
        <View className="h-[340px] items-center justify-center px-4">
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-text-senary-dark text-center text-[12px]"
          >
            {error}
          </AppText>
          <AppButton
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="mt-3 px-4 py-2 rounded-full bg-bg-tertiary-dark border border-border-primary-dark"
            onPress={onRetry}
          >
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="text-text-primary-dark text-[12px] font-semibold"
            >
              Retry
            </AppText>
          </AppButton>
        </View>
      ) : !isLoading && !payload.candles.length ? (
        <View className="h-[340px] items-center justify-center px-4">
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-text-tertiary-dark text-[12px]"
          >
            No chart data available.
          </AppText>
        </View>
      ) : (
        <View className="px-1 pb-2 relative">
          <View className="rounded-xl overflow-hidden border border-border-primary-dark">
            <ChartCanvas
              initialHtml={initialHtml}
              payloadJson={payloadJson}
              fitToken={fitToken}
              chartHeight={inlineChartHeight}
              onChartEvent={(eventPayload) => {
                if (eventPayload?.type === "crosshair") {
                  setHoveredCandle(eventPayload.candle ?? null);
                }
                if (eventPayload?.type === "gesture") {
                  onInteractionChange?.(Boolean(eventPayload.active));
                }
              }}
            />
          </View>
          {isLoading ? (
            <View className="absolute inset-0 items-center justify-center bg-bg-primary-dark/35">
              <ActivityIndicator size="small" color="#50fa7b" />
              <AppText
                variant={VARIANT_TYPES.NOT_SELECTED}
                className="text-text-tertiary-dark text-[12px] mt-2"
              >
                Updating chart...
              </AppText>
            </View>
          ) : null}

          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-text-tertiary-dark text-[10px] mt-2 px-1"
          >
            Pinch to zoom. Drag left/right to scroll candles.
          </AppText>
        </View>
      )}
      {renderRangeRow()}

      <Modal
        visible={isFullscreen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsFullscreen(false)}
      >
        <View className="flex-1 bg-bg-primary-dark pt-12">
          <View className="px-3 py-2 border-b border-border-primary-dark flex-row items-center justify-between gap-2">
            <View className="flex-row items-center gap-2">
              {renderIntervalFavorites()}
              <AppButton
                variant={VARIANT_TYPES.NOT_SELECTED}
                className="px-2 py-1 rounded-md bg-bg-tertiary-dark border border-border-primary-dark"
                onPress={() => {}}
              >
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="text-[10px] text-text-tertiary-dark"
                >
                  Indicators
                </AppText>
              </AppButton>
            </View>
            <View className="flex-row items-center gap-2">
              <View ref={fullscreenIntervalTriggerRef} collapsable={false}>
                <AppButton
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="px-2 py-1 rounded-md bg-bg-tertiary-dark border border-border-primary-dark flex-row items-center gap-1"
                  onPress={() =>
                    isIntervalMenuOpen
                      ? setIsIntervalMenuOpen(false)
                      : openIntervalMenu()
                  }
                >
                  <AppText
                    variant={VARIANT_TYPES.NOT_SELECTED}
                    className="text-[10px] text-text-tertiary-dark"
                  >
                    {selectedIntervalTitle}
                  </AppText>
                  <Feather
                    name={isIntervalMenuOpen ? "chevron-up" : "chevron-down"}
                    size={12}
                    color="#94a3b8"
                  />
                </AppButton>
              </View>
              <AppButton
                variant={VARIANT_TYPES.NOT_SELECTED}
                className="px-2 py-1 rounded-md bg-bg-tertiary-dark border border-border-primary-dark"
                onPress={() => setIsFullscreen(false)}
              >
                <Feather name="minimize-2" size={12} color="#e2e8f0" />
              </AppButton>
            </View>
          </View>

          <View className="px-3 py-2 border-b border-border-primary-dark flex-row items-center gap-2 flex-wrap">
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="text-[10px] text-text-tertiary-dark"
            >
              {pairLabel} · {intervalLabel} · Hyperliquid
            </AppText>
            <View className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className={cn(
                "text-[10px]",
                isUp ? "text-green-500" : "text-text-senary-dark",
              )}
            >
              O {latest ? latest.open.toFixed(precision) : "--"}
            </AppText>
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className={cn(
                "text-[10px]",
                isUp ? "text-green-500" : "text-text-senary-dark",
              )}
            >
              H {latest ? latest.high.toFixed(precision) : "--"}
            </AppText>
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className={cn(
                "text-[10px]",
                isUp ? "text-green-500" : "text-text-senary-dark",
              )}
            >
              L {latest ? latest.low.toFixed(precision) : "--"}
            </AppText>
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className={cn(
                "text-[10px]",
                isUp ? "text-green-500" : "text-text-senary-dark",
              )}
            >
              C {latest ? latest.close.toFixed(precision) : "--"}
            </AppText>
            {priceDelta ? (
              <AppText
                variant={VARIANT_TYPES.NOT_SELECTED}
                className={cn(
                  "text-[10px] font-semibold",
                  priceDelta.change >= 0
                    ? "text-green-500"
                    : "text-text-senary-dark",
                )}
              >
                {priceDelta.change >= 0 ? "+" : ""}
                {priceDelta.change.toFixed(precision)} (
                {priceDelta.pct >= 0 ? "+" : ""}
                {priceDelta.pct.toFixed(2)}%)
              </AppText>
            ) : null}
          </View>

          <View className="flex-1 px-1 pb-2">
            <View className="flex-1 rounded-xl overflow-hidden border border-border-primary-dark">
              <ChartCanvas
                initialHtml={initialHtml}
                payloadJson={payloadJson}
                fitToken={fitToken}
                chartHeight={inlineChartHeight}
                fill
                onChartEvent={(eventPayload) => {
                  if (eventPayload?.type === "crosshair") {
                    setHoveredCandle(eventPayload.candle ?? null);
                  }
                  if (eventPayload?.type === "gesture") {
                    onInteractionChange?.(Boolean(eventPayload.active));
                  }
                }}
              />
            </View>
          </View>
          {renderRangeRow()}
        </View>
      </Modal>
      <Modal
        transparent
        visible={isIntervalMenuOpen}
        animationType="none"
        onRequestClose={() => setIsIntervalMenuOpen(false)}
      >
        <Pressable
          style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
          onPress={() => setIsIntervalMenuOpen(false)}
        />
        <View
          style={{
            position: "absolute",
            top: intervalMenuPosition.top,
            left: intervalMenuPosition.left,
            width: intervalMenuPosition.width,
          }}
        >
          {renderIntervalDropdown()}
        </View>
      </Modal>
    </View>
  );
};

export default VaultChart;
