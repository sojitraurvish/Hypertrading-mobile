import LeverageDialog from "@/components/sections/markets/trade-order-drawer/leverage-dialog";
import LimitPriceInput from "@/components/sections/markets/trade-order-drawer/limit-price-input";
import MarginModeDialog from "@/components/sections/markets/trade-order-drawer/margin-mode-dialog";
import MaxSlippageDialog from "@/components/sections/markets/trade-order-drawer/max-slippage-dialog";
import SizeInput from "@/components/sections/markets/trade-order-drawer/size-input";
import SizeSlider from "@/components/sections/markets/trade-order-drawer/size-slider";
import { TakeProfitStopLossInputs } from "@/components/sections/markets/trade-order-drawer/take-profit-stop-loss-inputs";
import TIFDropdown from "@/components/sections/markets/trade-order-drawer/tif-dropdown";
import { AppButton } from "@/components/ui/app-button";
import AppDrawer from "@/components/ui/app-drawer";
import AppModal from "@/components/ui/app-modal";
import { AppText } from "@/components/ui/app-text";
import { appToast } from "@/components/ui/app-toast";
import { MarketsContainer } from "@/containers/markets";
import { useBuilderFee } from "@/hooks/useBuilderFees";
import { useApiWallet } from "@/hooks/useWallet";
import { VARIANT_TYPES } from "@/lib/constants";
import { addDecimals } from "@/lib/utils/decimals";
import { cn } from "@/lib/utils/tailwind-configs";
import { useBottomPannelStore } from "@/store/bottom-pannel";
import { useMarketStore } from "@/store/markets";
import { useTradeOrderDrawerStore } from "@/store/trade-order-drawer";
import { ORDER_DIRECTION, type TpSlValidationError } from "@/types/tpsl";
import type { PlaceOrderWithAgentParams } from "@/types/trade-order-drawer";
import { Feather } from "@expo/vector-icons";
import type { ISubscription } from "@nktkas/hyperliquid";
import { useAccount } from "@reown/appkit-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";

type TradeSide = "long" | "short";
type OrderType = "market" | "limit";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  coin: string;
  side?: TradeSide;
};

type ToggleButtonProps = {
  label: string;
  isActive: boolean;
  onPress: () => void;
  activeClassName: string;
  inactiveClassName?: string;
  activeTextClassName?: string;
  inactiveTextClassName?: string;
};

const ToggleButton: React.FC<ToggleButtonProps> = ({
  label,
  isActive,
  onPress,
  activeClassName,
  inactiveClassName = "",
  activeTextClassName = "text-text-primary-dark",
  inactiveTextClassName = "text-text-octonary-dark",
}) => (
  <AppButton
    variant={VARIANT_TYPES.NOT_SELECTED}
    className={cn(
      "h-11 flex-1 rounded-2xl border items-center justify-center",
      isActive
        ? activeClassName
        : cn(
            "bg-bg-secondary-dark/90 border-border-primary-dark/60",
            inactiveClassName,
          ),
    )}
    onPress={onPress}
  >
    <AppText
      variant={VARIANT_TYPES.NOT_SELECTED}
      className={cn(
        "text-[13px] leading-[16px] font-bold",
        isActive ? activeTextClassName : inactiveTextClassName,
      )}
    >
      {label}
    </AppText>
  </AppButton>
);

type StatRowProps = {
  label: string;
  value: string;
  valueClassName?: string;
  labelClassName?: string;
};

const StatRow: React.FC<StatRowProps> = ({
  label,
  value,
  valueClassName = "",
  labelClassName = "",
}) => (
  <View className="flex-row items-center justify-between py-1.5">
    <AppText
      variant={VARIANT_TYPES.NOT_SELECTED}
      className={cn(
        "text-[13px] leading-[17px] text-text-octonary-dark font-medium",
        labelClassName,
      )}
    >
      {label}
    </AppText>
    <AppText
      variant={VARIANT_TYPES.NOT_SELECTED}
      className={cn(
        "text-[14px] leading-[18px] text-text-primary-dark font-bold",
        valueClassName,
      )}
    >
      {value}
    </AppText>
  </View>
);

export const TradeOrderDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  coin,
  side,
}) => {
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [selectedSide, setSelectedSide] = useState<TradeSide>(side ?? "long");
  const [currency, setCurrency] = useState("USDC");
  const [isManualSizeInput, setIsManualSizeInput] = useState(false);
  const [isTpSlEnabled, setIsTpSlEnabled] = useState(false);
  const [isMarketSelectorOpen, setIsMarketSelectorOpen] = useState(false);
  const [isMarginModeDialogOpen, setIsMarginModeDialogOpen] = useState(false);
  const [isLeverageDialogOpen, setIsLeverageDialogOpen] = useState(false);
  const [isMaxSlippageDialogOpen, setIsMaxSlippageDialogOpen] = useState(false);
  const [isPlaceOrderLoading, setIsPlaceOrderLoading] = useState(false);
  const [takeProfitPrice, setTakeProfitPrice] = useState<number | undefined>(
    undefined,
  );
  const [stopLossPrice, setStopLossPrice] = useState<number | undefined>(
    undefined,
  );
  const [tpslVariant, setTpslVariant] = useState<"percent" | "dollar">(
    "percent",
  );
  const [tpslValidationError, setTpslValidationError] =
    useState<TpSlValidationError>({
      takeProfitError: false,
      stopLossError: false,
    });
  const { address } = useAccount();
  const { checkApprovalStatus, agentPrivateKey } = useApiWallet({
    userPublicKey: address as `0x${string}`,
  });
  const { checkBuilderFeeStatus } = useBuilderFee({
    userPublicKey: address as `0x${string}`,
  });

  const userPositions = useBottomPannelStore((state) => state.userPositions);
  const balances = useBottomPannelStore((state) => state.balances);
  const setActiveAccountTab = useBottomPannelStore(
    (state) => state.setActiveAccountTab,
  );
  const selectedMarket = useMarketStore((state) => state.selectedMarket);
  const marginMode = useTradeOrderDrawerStore((state) => state.marginMode);
  const sizeInputValue = useTradeOrderDrawerStore(
    (state) => state.sizeInputValue,
  );
  const setSizeInputValue = useTradeOrderDrawerStore(
    (state) => state.setSizeInputValue,
  );
  const sizeInputValueForSelectedMarket = useTradeOrderDrawerStore(
    (state) => state.sizeInputValueForSelectedMarket,
  );
  const setSizeInputValueForSelectedMarket = useTradeOrderDrawerStore(
    (state) => state.setSizeInputValueForSelectedMarket,
  );
  const sliderValue = useTradeOrderDrawerStore((state) => state.sliderValue);
  const setSliderValue = useTradeOrderDrawerStore(
    (state) => state.setSliderValue,
  );
  const limitOrderPrice = useTradeOrderDrawerStore(
    (state) => state.limitOrderPrice,
  );
  const setLimitOrderPrice = useTradeOrderDrawerStore(
    (state) => state.setLimitOrderPrice,
  );
  const timeInForce = useTradeOrderDrawerStore((state) => state.timeInForce);
  const setTimeInForce = useTradeOrderDrawerStore(
    (state) => state.setTimeInForce,
  );
  const setMarginMode = useTradeOrderDrawerStore(
    (state) => state.setMarginMode,
  );
  const setUserLeverage = useTradeOrderDrawerStore(
    (state) => state.setUserLeverage,
  );
  const setAvailableToTradeBuy = useTradeOrderDrawerStore(
    (state) => state.setAvailableToTradeBuy,
  );
  const setAvailableToTradeSell = useTradeOrderDrawerStore(
    (state) => state.setAvailableToTradeSell,
  );
  const setMarkPrice = useTradeOrderDrawerStore((state) => state.setMarkPrice);
  const markPrice = useTradeOrderDrawerStore((state) => state.markPrice);
  const marketPriceWithSlippage = useTradeOrderDrawerStore(
    (state) => state.marketPriceWithSlippage,
  );
  const setMarketPriceWithSlippage = useTradeOrderDrawerStore(
    (state) => state.setMarketPriceWithSlippage,
  );
  const setMaxLeverage = useTradeOrderDrawerStore(
    (state) => state.setMaxLeverage,
  );
  const maxLeverage = useTradeOrderDrawerStore((state) => state.maxLeverage);
  const maxSlippage = useTradeOrderDrawerStore((state) => state.maxSlippage);
  const userLeverage = useTradeOrderDrawerStore((state) => state.userLeverage);
  const setMaxSlippage = useTradeOrderDrawerStore(
    (state) => state.setMaxSlippage,
  );
  const availableToTradeBuy = useTradeOrderDrawerStore(
    (state) => state.availableToTradeBuy,
  );
  const availableToTradeSell = useTradeOrderDrawerStore(
    (state) => state.availableToTradeSell,
  );
  const getLiveActiveAssetData = useTradeOrderDrawerStore(
    (state) => state.getLiveActiveAssetData,
  );
  const getLiveWebData2 = useTradeOrderDrawerStore(
    (state) => state.getLiveWebData2,
  );
  const setCurrentPosition = useTradeOrderDrawerStore(
    (state) => state.setCurrentPosition,
  );
  const currentPosition = useTradeOrderDrawerStore(
    (state) => state.currentPosition,
  );
  const setCurrentUnrealizedPnl = useTradeOrderDrawerStore(
    (state) => state.setCurrentUnrealizedPnl,
  );
  const setLiquidationPx = useTradeOrderDrawerStore(
    (state) => state.setLiquidationPx,
  );
  const liquidationPx = useTradeOrderDrawerStore(
    (state) => state.liquidationPx,
  );
  const currentUnrealizedPnl = useTradeOrderDrawerStore(
    (state) => state.currentUnrealizedPnl,
  );
  const setCrossAccountValue = useTradeOrderDrawerStore(
    (state) => state.setCrossAccountValue,
  );
  const setTotalCrossPositionValue = useTradeOrderDrawerStore(
    (state) => state.setTotalCrossPositionValue,
  );
  const setCrossAccountLeverage = useTradeOrderDrawerStore(
    (state) => state.setCrossAccountLeverage,
  );
  const setPerpsBalance = useTradeOrderDrawerStore(
    (state) => state.setPerpsBalance,
  );
  const perpsBalance = useTradeOrderDrawerStore((state) => state.perpsBalance);
  const crossAccountLeverageValue = useTradeOrderDrawerStore(
    (state) => state.crossAccountLeverage,
  );
  const szDecimals = useTradeOrderDrawerStore((state) => state.szDecimals);
  const resolveSzDecimals = useTradeOrderDrawerStore(
    (state) => state.resolveSzDecimals,
  );
  const setSzDecimals = useTradeOrderDrawerStore(
    (state) => state.setSzDecimals,
  );
  const placeOrderWithAgent = useTradeOrderDrawerStore(
    (state) => state.placeOrderWithAgent,
  );
  const isLoadingSzDecimals = useTradeOrderDrawerStore(
    (state) => state.isLoadingSzDecimals,
  );
  const updateMarginAndLeverage = useTradeOrderDrawerStore(
    (state) => state.updateMarginAndLeverage,
  );
  const isUpdateMarginAndLeverageLoading = useTradeOrderDrawerStore(
    (state) => state.isUpdateMarginAndLeverageLoading,
  );
  const activeAssetSubscriptionRef = useRef<ISubscription | null>(null);
  const webData2SubscriptionRef = useRef<ISubscription | null>(null);

  useEffect(() => {
    const parsedLeverage = Number.parseFloat(
      selectedMarket?.leverage?.replace("x", "") ?? "0",
    );

    setMaxLeverage(Number.isFinite(parsedLeverage) ? parsedLeverage : 0);
  }, [selectedMarket?.leverage, setMaxLeverage]);

  useEffect(() => {
    if (isOpen) {
      setSelectedSide(side ?? "long");
    }
  }, [isOpen, side]);

  useEffect(() => {
    if (!isOpen) return;
    if (!address) return;
    if (!address.startsWith("0x")) return;

    let isActive = true;
    activeAssetSubscriptionRef.current?.unsubscribe();
    activeAssetSubscriptionRef.current = null;

    const subscribe = async () => {
      const nextSubscription = await getLiveActiveAssetData(
        address as `0x${string}`,
        coin,
        setMarginMode,
        setUserLeverage,
        setAvailableToTradeBuy,
        setAvailableToTradeSell,
        setMarkPrice,
      );

      if (!isActive) {
        nextSubscription?.unsubscribe();
        return;
      }

      activeAssetSubscriptionRef.current?.unsubscribe();
      activeAssetSubscriptionRef.current = nextSubscription;
    };

    void subscribe();

    return () => {
      isActive = false;
      activeAssetSubscriptionRef.current?.unsubscribe();
      activeAssetSubscriptionRef.current = null;
    };
  }, [
    address,
    coin,
    getLiveActiveAssetData,
    isOpen,
    setMarginMode,
    setUserLeverage,
    setAvailableToTradeBuy,
    setAvailableToTradeSell,
    setMarkPrice,
  ]);

  useEffect(() => {
    if (!isOpen) return;
    if (!address) return;
    if (!address.startsWith("0x")) return;

    let isActive = true;
    webData2SubscriptionRef.current?.unsubscribe();
    webData2SubscriptionRef.current = null;

    const subscribe = async () => {
      const nextSubscription = await getLiveWebData2(
        address as `0x${string}`,
        coin,
        setCurrentPosition,
        setCurrentUnrealizedPnl,
        setLiquidationPx,
        setCrossAccountValue,
        setTotalCrossPositionValue,
        setCrossAccountLeverage,
        setPerpsBalance,
      );

      if (!isActive) {
        nextSubscription?.unsubscribe();
        return;
      }

      webData2SubscriptionRef.current?.unsubscribe();
      webData2SubscriptionRef.current = nextSubscription;
    };

    void subscribe();

    return () => {
      isActive = false;
      webData2SubscriptionRef.current?.unsubscribe();
      webData2SubscriptionRef.current = null;
    };
  }, [
    address,
    coin,
    getLiveWebData2,
    isOpen,
    setCurrentPosition,
    setCurrentUnrealizedPnl,
    setLiquidationPx,
    setCrossAccountValue,
    setTotalCrossPositionValue,
    setCrossAccountLeverage,
    setPerpsBalance,
  ]);

  useEffect(() => {
    const szDecimals = async () => {
      const szDecimals = await resolveSzDecimals(coin);
      setSzDecimals(szDecimals);
    };
    void szDecimals();
  }, [coin, isOpen, resolveSzDecimals]);

  useEffect(() => {
    const normalizedMarkPrice = Number.isFinite(markPrice) ? markPrice : 0;
    const normalizedMaxSlippage = Number.isFinite(maxSlippage)
      ? maxSlippage
      : 0;
    const normalizedSzDecimals =
      typeof szDecimals === "number" && Number.isFinite(szDecimals)
        ? Math.max(0, szDecimals)
        : 2;
    const isBuy = selectedSide === "long";
    const slippageAmount = normalizedMarkPrice * (normalizedMaxSlippage / 100);
    const rawPrice = isBuy
      ? normalizedMarkPrice + slippageAmount
      : normalizedMarkPrice - slippageAmount;
    const nextMarketPriceWithSlippage = addDecimals(
      rawPrice,
      normalizedSzDecimals,
    );
    setMarketPriceWithSlippage(nextMarketPriceWithSlippage);
  }, [
    markPrice,
    maxSlippage,
    selectedSide,
    szDecimals,
    setMarketPriceWithSlippage,
    selectedMarket?.symbol,
    coin,
  ]);

  const liquidationPrice = useMemo(() => {
    if (!Number.isFinite(liquidationPx) || liquidationPx <= 0) return "NA";
    return `${addDecimals(liquidationPx, 0)}`;
  }, [liquidationPx]);

  const orderValue = useMemo(() => {
    const sizeValue = Number.parseFloat(sizeInputValue);
    if (!Number.isFinite(sizeValue) || sizeValue <= 0) return "0.00";
    return addDecimals(sizeValue, 2).toFixed(2);
  }, [sizeInputValue]);

  const marginRequired = useMemo(() => {
    const value = Number.parseFloat(orderValue);
    if (!Number.isFinite(value) || value <= 0) return "0.00";
    const divisor = 25;
    return addDecimals(value / divisor, 2).toFixed(2);
  }, [orderValue]);

  const normalizedPerpsBalance = useMemo(() => {
    return Number.isFinite(perpsBalance) ? addDecimals(perpsBalance, 2) : 0;
  }, [perpsBalance]);
  const normalizedPerpsAccountBalance = useMemo(() => {
    const perpsBalanceFromAccount = balances.find(
      (balance) => balance.coin === "USDC (Perps)",
    )?.usdc_value;
    const parsedPerpsBalance = Number(perpsBalanceFromAccount);
    if (!Number.isFinite(parsedPerpsBalance)) {
      return normalizedPerpsBalance;
    }
    return addDecimals(parsedPerpsBalance, 2);
  }, [balances, normalizedPerpsBalance]);
  const normalizedSpotAccountBalance = useMemo(() => {
    const spotBalanceFromAccount = balances.find(
      (balance) => balance.coin === "USDC (Spot)",
    )?.usdc_value;
    const parsedSpotBalance = Number(spotBalanceFromAccount);
    if (!Number.isFinite(parsedSpotBalance)) return 0;
    return addDecimals(parsedSpotBalance, 2);
  }, [balances]);
  const userCurrentPosition = useMemo(() => {
    const normalizedCoin = coin.toUpperCase();
    return userPositions.find(
      (item) => item?.position?.coin?.toUpperCase() === normalizedCoin,
    );
  }, [coin, userPositions]);
  const unrealizedPnl = useMemo(() => {
    return Number.isFinite(currentUnrealizedPnl)
      ? addDecimals(currentUnrealizedPnl, 2)
      : 0;
  }, [currentUnrealizedPnl]);
  const crossAccountLeverage = useMemo(() => {
    return `${addDecimals(
      Number.isFinite(crossAccountLeverageValue)
        ? crossAccountLeverageValue
        : 0,
      2,
    ).toFixed(2)}x`;
  }, [crossAccountLeverageValue]);

  const handleNumberInput = (value: string, setValue: (v: string) => void) => {
    if (value === "") {
      setValue("");
      return;
    }
    const decimals =
      typeof szDecimals === "number" && Number.isFinite(szDecimals)
        ? Math.max(0, szDecimals)
        : 4;
    const regex = new RegExp(`^\\d*\\.?\\d{0,${decimals}}$`);
    if (regex.test(value)) {
      setValue(value);
    }
  };

  const sectionCardClassName =
    "rounded-2xl border border-border-primary-dark/60 bg-bg-secondary-dark/70 p-3";

  const isLoadingTradeOrderDrawer = useMemo(() => {
    const selectedAvailableToTrade =
      selectedSide === "long" ? availableToTradeBuy : availableToTradeSell;
    return (
      isOpen &&
      (isLoadingSzDecimals ||
        !marginMode ||
        !userLeverage ||
        !maxLeverage ||
        !Number.isFinite(maxSlippage) ||
        !Number.isFinite(marketPriceWithSlippage) ||
        szDecimals === null ||
        !Number.isFinite(markPrice) ||
        !Number.isFinite(currentPosition) ||
        !Number.isFinite(selectedAvailableToTrade))
    );
  }, [
    isOpen,
    isLoadingSzDecimals,
    marginMode,
    userLeverage,
    maxLeverage,
    maxSlippage,
    marketPriceWithSlippage,
    szDecimals,
    markPrice,
    currentPosition,
    selectedSide,
    availableToTradeBuy,
    availableToTradeSell,
    selectedMarket?.symbol,
    coin,
  ]);

  console.log(
    "isLoadingTradeOrderDrawer",
    isOpen,
    marginMode,
    userLeverage,
    maxLeverage,
  );

  const normalizedAvailableToTrade = useMemo(() => {
    const selectedAvailable =
      selectedSide === "long" ? availableToTradeBuy : availableToTradeSell;
    return Number(selectedAvailable);
  }, [selectedSide, availableToTradeBuy, availableToTradeSell]);

  const normalizedCurrentPosition = useMemo(() => {
    return Number.isFinite(currentPosition) ? Math.abs(currentPosition) : 0;
  }, [currentPosition]);

  const normalizedSzDecimals = useMemo(() => {
    return typeof szDecimals === "number" && Number.isFinite(szDecimals)
      ? szDecimals
      : 4;
  }, [szDecimals]);

  const maxSize = useMemo(() => {
    const normalizedLeverage =
      Number.isFinite(userLeverage) && userLeverage > 0 ? userLeverage : 0;
    const maxUsdcSize = normalizedAvailableToTrade * normalizedLeverage;
    if (!Number.isFinite(maxUsdcSize) || maxUsdcSize <= 0) return 0;
    if (currency === "USDC") return addDecimals(maxUsdcSize, 2);
    const normalizedMarkPrice = Number.isFinite(markPrice) ? markPrice : 0;
    if (normalizedMarkPrice <= 0) return 0;
    return addDecimals(maxUsdcSize / normalizedMarkPrice, 2);
  }, [currency, markPrice, normalizedAvailableToTrade, userLeverage]);

  const isSizeExceedsMax = useMemo(() => {
    const parsedSize = Number.parseFloat(sizeInputValue);
    if (!Number.isFinite(parsedSize) || parsedSize <= 0) return false;
    if (!Number.isFinite(maxSize) || maxSize <= 0) return false;
    return parsedSize > maxSize;
  }, [maxSize, sizeInputValue]);

  const hasValidOrderSize = useMemo(() => {
    const parsedSelectedMarketSize = Number.parseFloat(
      sizeInputValueForSelectedMarket,
    );
    return (
      Number.isFinite(parsedSelectedMarketSize) && parsedSelectedMarketSize > 0
    );
  }, [sizeInputValueForSelectedMarket]);

  const isLimitPriceEmpty = useMemo(() => {
    return orderType === "limit" && !limitOrderPrice.trim();
  }, [limitOrderPrice, orderType]);

  const isPlaceOrderDisabled =
    isPlaceOrderLoading ||
    isSizeExceedsMax ||
    !hasValidOrderSize ||
    isLimitPriceEmpty ||
    (isTpSlEnabled &&
      (tpslValidationError.takeProfitError ||
        tpslValidationError.stopLossError));

  useEffect(() => {
    if (isManualSizeInput) return;

    const currencyPrice = Number.isFinite(markPrice) ? markPrice : 0;
    const sliderBasedOrderValue =
      (normalizedAvailableToTrade * userLeverage * sliderValue) / 100;

    const displayValue =
      currency === "USDC"
        ? addDecimals(sliderBasedOrderValue)
        : addDecimals(
            sliderBasedOrderValue > 0 && currencyPrice > 0
              ? sliderBasedOrderValue / currencyPrice
              : 0,
            normalizedSzDecimals,
          );
    setSizeInputValue(displayValue.toString());
    setSizeInputValueForSelectedMarket(
      addDecimals(
        sliderBasedOrderValue > 0 && currencyPrice > 0
          ? sliderBasedOrderValue / currencyPrice
          : 0,
        normalizedSzDecimals,
      ).toString(),
    );
  }, [
    isManualSizeInput,
    markPrice,
    normalizedAvailableToTrade,
    userLeverage,
    sliderValue,
    currency,
    normalizedSzDecimals,
  ]);

  const handleSliderChange = useCallback(
    (value: number) => {
      setSliderValue(value);
      setIsManualSizeInput(false);
    },
    [setSliderValue],
  );

  const handleSizeInputChange = useCallback(
    (value: string) => {
      setSizeInputValue(value);
      setIsManualSizeInput(true);

      const numValue = Number.parseFloat(value);
      if (value === "" || Number.isNaN(numValue) || numValue <= 0) {
        setSliderValue(0);
        return;
      }

      const currencyPrice = Number.isFinite(markPrice) ? markPrice : 0;
      const selectedMarketSize =
        currency === "USDC"
          ? currencyPrice > 0
            ? numValue / currencyPrice
            : 0
          : numValue;

      setSizeInputValueForSelectedMarket(
        addDecimals(selectedMarketSize, normalizedSzDecimals).toString(),
      );

      if (!Number.isFinite(maxSize) || maxSize <= 0) {
        setSliderValue(0);
        return;
      }

      const newSlider = Math.min(100, Math.round((numValue * 100) / maxSize));
      setSliderValue(newSlider);
    },
    [
      currency,
      markPrice,
      maxSize,
      normalizedSzDecimals,
      setSizeInputValue,
      setSizeInputValueForSelectedMarket,
      setSliderValue,
    ],
  );

  const handleCurrencyChange = () => {
    setCurrency((prev) => (prev === "USDC" ? coin.toUpperCase() : "USDC"));
    setIsManualSizeInput(false);
  };

  // const handleSetMaxSize = useCallback(() => {
  //   if (!Number.isFinite(maxSize) || maxSize <= 0) return;
  //   setSizeInputValue(maxSize.toFixed(2));
  //   setSizeInputValueForSelectedMarket(maxSize.toFixed(2));
  //   setSliderValue(100);
  //   setIsManualSizeInput(false);
  // }, [maxSize, setSizeInputValue, setSliderValue]);

  // Reset limit price when switching order types
  useEffect(() => {
    if (orderType === "market") {
      setLimitOrderPrice("");
    }
  }, [orderType]);

  // Reset currency display when currentCurrency changes
  useEffect(() => {
    // setCurrency("USDC");
    // setSliderValue(0);
    setLimitOrderPrice("");
    // setTimeInForce("GTC"); // Reset TIF to default when currency changes
    // setMarkPrice(null); // Reset mark price when currency changes
    // setIsTpslEnabled(false); // Reset TP/SL when currency changes
    // setTakeProfitPrice(undefined);
    // setStopLossPrice(undefined);
    // setSizeInputValue("0.00"); // Reset size input
    // setIsManualSizeInput(false); // Reset manual input flag
  }, [coin, setMarkPrice]);

  useEffect(() => {
    if (!isTpSlEnabled) {
      setTakeProfitPrice(undefined);
      setStopLossPrice(undefined);
      setTpslValidationError({
        takeProfitError: false,
        stopLossError: false,
      });
    }
  }, [isTpSlEnabled]);

  const handlePlaceOrderPress = async () => {
    if (isPlaceOrderLoading) return;

    setIsPlaceOrderLoading(true);

    try {
      const isApprovedBuilderFee = await checkBuilderFeeStatus({
        userPublicKeyParam: address as `0x${string}`,
      });
      if (!isApprovedBuilderFee) {
        appToast.error({
          message: "Please approve the builder fee to place order",
        });
        return;
      }

      const isApproved = await checkApprovalStatus({
        userPublicKeyParam: address as `0x${string}`,
      });

      if (!isApproved) {
        appToast.error({
          message: "Please approve the agent wallet to place order",
        });
        return;
      }

      const s = sizeInputValueForSelectedMarket;
      const p =
        orderType === "limit"
          ? limitOrderPrice
          : Math.trunc(marketPriceWithSlippage).toString();

      // // Validate limit order price is provided
      // if (orderType === "limit" && price) {
      //   appToast.error({ message: "Please enter a limit price" });
      //   return;
      // }

      // Only send tif parameter for Limit orders
      const orderParams: PlaceOrderWithAgentParams = {
        agentPrivateKey: agentPrivateKey as `0x${string}`,
        a: coin,
        b: selectedSide === "long",
        s: s,
        p: p,
        r: false,
      };

      // Map TIF dropdown values to API format
      const tifMap: Record<"GTC" | "IOC" | "ALO", "Gtc" | "Ioc" | "Alo"> = {
        GTC: "Gtc",
        IOC: "Ioc",
        ALO: "Alo",
      };

      // Add tif only for Limit orders
      if (orderType === "limit") {
        orderParams.tif = tifMap[timeInForce];
      }

      if (isTpSlEnabled) {
        if (takeProfitPrice !== undefined) {
          orderParams.takeProfitPrice = takeProfitPrice;
        }
        if (stopLossPrice !== undefined) {
          orderParams.stopLossPrice = stopLossPrice;
        }
      }
      console.log("orderParams", orderParams);

      const isOrderPlaced = await placeOrderWithAgent(orderParams);
      if (isOrderPlaced) {
        if (orderType === "limit") {
          setActiveAccountTab("openOrders");
        } else if (orderType === "market") {
          setActiveAccountTab("positions");
        }
        onClose();
      }
    } finally {
      setIsPlaceOrderLoading(false);
    }
  };
  return (
    <AppDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={undefined}
      showCloseButton={false}
      enableSwipeDownToClose={false}
      className="px-3 pb-5 pt-2"
    >
      {isLoadingTradeOrderDrawer ? (
        <View className="h-[55vh] items-center justify-center gap-3">
          <ActivityIndicator size="small" color="#66ef7a" />
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-[13px] leading-[16px] text-text-octonary-dark"
          >
            Loading order settings...
          </AppText>
        </View>
      ) : (
        <ScrollView
          className="max-h-[88vh]"
          contentContainerClassName="gap-3 pb-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          directionalLockEnabled
          nestedScrollEnabled
          scrollEventThrottle={16}
          stickyHeaderIndices={[0]}
        >
          <View
            className={cn(
              sectionCardClassName,
              "mb-1.5 gap-2 pb-2 bg-bg-secondary-dark z-10",
            )}
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-1.5">
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="text-[17px] leading-[21px] font-extrabold text-text-primary-dark"
                >
                  {coin.toUpperCase()} Order
                </AppText>
                <View className="px-2 py-0.5 rounded-full border border-border-primary-dark/70 bg-bg-secondary-dark/80">
                  <AppText
                    variant={VARIANT_TYPES.NOT_SELECTED}
                    className="text-[9px] leading-[11px] font-semibold text-text-octonary-dark uppercase tracking-[0.8px]"
                  >
                    PERP
                  </AppText>
                </View>
              </View>
              <AppButton
                variant={VARIANT_TYPES.NOT_SELECTED}
                onPress={onClose}
                className="w-8 h-8 rounded-full bg-bg-quaternary-dark/95 border border-border-primary-dark/70 items-center justify-center"
                accessibilityLabel="Close order drawer"
              >
                <Feather name="x" size={14} color="#94a3b8" />
              </AppButton>
            </View>

            <AppButton
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="h-[66px] rounded-[18px] border border-border-primary-dark/70 bg-bg-secondary-dark/95 px-3.5 flex-row items-center justify-between"
              onPress={() => setIsMarketSelectorOpen(true)}
              accessibilityLabel="Select market"
            >
              <View className="flex-row items-center gap-2.5 min-w-0 flex-1">
                <View className="h-10 w-10 rounded-full bg-[#0f2f27] border border-[#2d815f]/70 items-center justify-center">
                  <AppText
                    variant={VARIANT_TYPES.NOT_SELECTED}
                    className="text-[10px] font-extrabold text-[#7af8a0] uppercase"
                  >
                    {coin.toUpperCase().slice(0, 5)}
                  </AppText>
                </View>
                <View className="min-w-0 flex-1">
                  <AppText
                    variant={VARIANT_TYPES.NOT_SELECTED}
                    className="text-[10px] leading-[12px] text-text-octonary-dark uppercase tracking-[0.8px]"
                  >
                    Selected Market
                  </AppText>
                  <AppText
                    variant={VARIANT_TYPES.NOT_SELECTED}
                    className="text-[19px] leading-[22px] font-extrabold text-text-primary-dark"
                    numberOfLines={1}
                  >
                    {coin.toUpperCase()}-USDC
                  </AppText>
                </View>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="h-8 w-px bg-border-primary-dark/50" />
                <View className="h-8 flex-row items-center gap-1.5 rounded-full border border-border-primary-dark/70 bg-bg-quaternary-dark/90 px-3">
                  <AppText
                    variant={VARIANT_TYPES.NOT_SELECTED}
                    className="text-[11px] font-bold text-text-tertiary-dark"
                  >
                    Change
                  </AppText>
                  <Feather name="chevron-down" size={12} color="#94a3b8" />
                </View>
              </View>
            </AppButton>
          </View>

          <View className={cn(sectionCardClassName, "gap-2.5")}>
            <View className="flex-row gap-2.5">
              <AppButton
                variant={VARIANT_TYPES.NOT_SELECTED}
                className="h-11 flex-1 rounded-2xl border border-[#2d815f] bg-[#0a3a2a] items-center justify-center"
                onPress={() => setIsMarginModeDialogOpen(true)}
              >
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="text-[13px] leading-[16px] font-bold text-[#52f2a8]"
                >
                  {marginMode === "isolated" ? "Isolated" : "Cross"}
                </AppText>
              </AppButton>
              <AppButton
                variant={VARIANT_TYPES.NOT_SELECTED}
                className="h-11 flex-1 rounded-2xl border border-[#2d815f] bg-[#0a3a2a] items-center justify-center"
                onPress={() => setIsLeverageDialogOpen(true)}
              >
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="text-[13px] leading-[16px] font-bold text-[#52f2a8]"
                >
                  {userLeverage}x
                </AppText>
              </AppButton>
            </View>

            <View className="flex-row gap-2.5">
              <ToggleButton
                label="Market"
                isActive={orderType === "market"}
                onPress={() => setOrderType("market")}
                activeClassName="bg-bg-quaternary-dark border-border-primary-dark"
                activeTextClassName="text-text-primary-dark"
              />
              <ToggleButton
                label="Limit"
                isActive={orderType === "limit"}
                onPress={() => setOrderType("limit")}
                activeClassName="bg-bg-quaternary-dark border-border-primary-dark"
                activeTextClassName="text-text-primary-dark"
              />
            </View>

            <View className="flex-row gap-2.5">
              <ToggleButton
                label="Buy / Long"
                isActive={selectedSide === "long"}
                onPress={() => setSelectedSide("long")}
                activeClassName="bg-bg-senary-dark border-[#78f39a]/45 shadow-sm"
                activeTextClassName="text-[#05311b]"
                inactiveTextClassName="text-text-octonary-dark"
              />
              <ToggleButton
                label="Sell / Short"
                isActive={selectedSide === "short"}
                onPress={() => setSelectedSide("short")}
                activeClassName="bg-[#ff4d57] border-[#ff6b73]"
                activeTextClassName="text-white"
                inactiveTextClassName="text-text-octonary-dark"
              />
            </View>
          </View>

          <View className={cn(sectionCardClassName, "gap-2")}>
            <StatRow
              label="Available to Trade"
              value={`${addDecimals(normalizedAvailableToTrade, 2)} USDC`}
              labelClassName="text-[14px]"
            />
            <View className="h-px bg-border-primary-dark/35" />
            <StatRow
              label="Current Position"
              value={`${addDecimals(normalizedCurrentPosition, normalizedSzDecimals || 2)} ${coin.toUpperCase()}`}
              valueClassName="text-[#52f2a8]"
              labelClassName="text-[14px]"
            />
          </View>

          <View className={cn(sectionCardClassName, "gap-3")}>
            <LimitPriceInput isVisible={orderType === "limit"} />

            <SizeInput
              size={sizeInputValue}
              currency={currency}
              onCurrencyChange={handleCurrencyChange}
              onChange={handleSizeInputChange}
              maxSize={maxSize}
              // onMaxPress={handleSetMaxSize}
              hasError={isSizeExceedsMax}
            />

            <View className="mt-1 gap-2">
              <SizeSlider
                value={sliderValue}
                onChange={handleSliderChange}
                disabled={isLoadingTradeOrderDrawer}
              />

              <View className="flex-row gap-2">
                {[25, 50, 75, 100].map((percent) => (
                  <AppButton
                    key={percent}
                    variant={VARIANT_TYPES.NOT_SELECTED}
                    onPress={() => handleSliderChange(percent)}
                    className={cn(
                      "h-7 flex-1 rounded-lg border items-center justify-center",
                      sliderValue === percent
                        ? "bg-bg-senary-dark border-[#78f39a]/50"
                        : "bg-bg-quaternary-dark/50 border-border-primary-dark/60",
                    )}
                  >
                    <AppText
                      variant={VARIANT_TYPES.NOT_SELECTED}
                      className={cn(
                        "text-[11px] font-semibold",
                        sliderValue === percent
                          ? "text-[#064617]"
                          : "text-text-tertiary-dark",
                      )}
                    >
                      {percent}%
                    </AppText>
                  </AppButton>
                ))}
              </View>
            </View>

            {orderType === "limit" ? (
              <View className="gap-1">
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="text-[13px] leading-[16px] text-text-octonary-dark uppercase tracking-[0.8px]"
                >
                  TIF
                </AppText>
                <TIFDropdown
                  value={timeInForce}
                  onChange={setTimeInForce}
                  disabled={isLoadingTradeOrderDrawer}
                />
              </View>
            ) : null}

            <AppButton
              variant={VARIANT_TYPES.NOT_SELECTED}
              onPress={() => setIsTpSlEnabled((prev) => !prev)}
              className="h-11 flex-row items-center justify-start gap-2.5 px-3 rounded-xl border border-border-primary-dark/60 bg-bg-secondary-dark/65 mt-0.5"
            >
              <View
                className={cn(
                  "w-5 h-5 rounded-md border items-center justify-center",
                  isTpSlEnabled
                    ? "bg-bg-senary-dark border-[#78f39a]/60"
                    : "bg-transparent border-border-primary-dark/70",
                )}
              >
                {isTpSlEnabled ? (
                  <Feather name="check" size={12} color="#0c4a2e" />
                ) : null}
              </View>
              <AppText
                variant={VARIANT_TYPES.NOT_SELECTED}
                className="text-[14px] text-text-tertiary-dark font-medium"
              >
                Take Profit / Stop Loss
              </AppText>
            </AppButton>

            {isTpSlEnabled ? (
              <TakeProfitStopLossInputs
                entryPrice={
                  orderType === "limit"
                    ? Number.parseFloat(limitOrderPrice) || undefined
                    : markPrice || undefined
                }
                direction={
                  selectedSide === "long"
                    ? ORDER_DIRECTION.LONG
                    : ORDER_DIRECTION.SHORT
                }
                leverage={userLeverage}
                takeProfitPrice={takeProfitPrice}
                stopLossPrice={stopLossPrice}
                onTakeProfitPriceChange={setTakeProfitPrice}
                onStopLossPriceChange={setStopLossPrice}
                szDecimals={normalizedSzDecimals}
                priceLabel="entry"
                positionSize={
                  Number.parseFloat(sizeInputValueForSelectedMarket) > 0
                    ? Number.parseFloat(sizeInputValueForSelectedMarket)
                    : undefined
                }
                thresholdPrice={
                  orderType === "limit"
                    ? Number.parseFloat(limitOrderPrice) || null
                    : markPrice || null
                }
                tpslVariant={tpslVariant}
                setTpslVariant={setTpslVariant}
                disabled={isLoadingTradeOrderDrawer || sliderValue === 0}
                onValidationChange={setTpslValidationError}
              />
            ) : null}

            <AppButton
              variant={VARIANT_TYPES.NOT_SELECTED}
              onPress={handlePlaceOrderPress}
              isDisabled={isPlaceOrderDisabled}
              isLoading={isPlaceOrderLoading}
              className={cn(
                "h-14 rounded-2xl border flex-row items-center justify-center mt-0.5 shadow-sm",
                selectedSide === "long"
                  ? isPlaceOrderDisabled || isPlaceOrderLoading
                    ? "bg-bg-senary-dark/70 border-[#78f39a]/30"
                    : "bg-bg-senary-dark border-[#78f39a]/50"
                  : isPlaceOrderDisabled || isPlaceOrderLoading
                    ? "bg-red-500/70 border-[#ff8a8a]/30"
                    : "bg-red-500 border-[#ff8a8a]/50",
              )}
            >
              <AppText
                variant={VARIANT_TYPES.NOT_SELECTED}
                className={cn(
                  "text-[15px] leading-[18px] font-extrabold uppercase tracking-[0.7px]",
                  selectedSide === "long" ? "text-[#064617]" : "text-white",
                )}
              >
                Place Order
              </AppText>
            </AppButton>
          </View>

          <View className={cn(sectionCardClassName, "gap-2")}>
            <StatRow label="Liquidation Price" value={liquidationPrice} />
            <View className="h-px bg-border-primary-dark/35" />
            <StatRow
              label="Order Value"
              value={`${addDecimals(Number(sizeInputValue), 2)} USDC`}
            />
            <View className="h-px bg-border-primary-dark/35" />
            <StatRow
              label="Margin Required"
              value={`${addDecimals(Number(sizeInputValue) / userLeverage, 2)} USDC`}
            />
            <View className="h-px bg-border-primary-dark/35" />
            <AppButton
              variant={VARIANT_TYPES.NOT_SELECTED}
              onPress={() => setIsMaxSlippageDialogOpen(true)}
              className="-mx-1 rounded-lg px-1 py-0.5"
            >
              <StatRow
                label="Slippage"
                value={`MAX: ${maxSlippage.toFixed(2)}%`}
                valueClassName="text-[#84ff5c]"
              />
            </AppButton>
          </View>

          <View className={cn(sectionCardClassName, "gap-1.5")}>
            <View className="flex-row items-center gap-2">
              <View className="h-4 w-1 rounded-full bg-bg-senary-dark" />
              <AppText
                variant={VARIANT_TYPES.NOT_SELECTED}
                className="text-[12px] leading-[16px] uppercase tracking-[1px] text-text-octonary-dark"
              >
                Account Equity
              </AppText>
            </View>
            <StatRow
              label="Perps Account"
              value={`${normalizedPerpsAccountBalance.toFixed(2)} `}
            />
            <StatRow
              label="Spot Account"
              value={`${normalizedSpotAccountBalance.toFixed(2)} `}
            />
          </View>

          <View className={cn(sectionCardClassName, "gap-1.5")}>
            <View className="flex-row items-center gap-2">
              <View className="h-4 w-1 rounded-full bg-bg-senary-dark" />
              <AppText
                variant={VARIANT_TYPES.NOT_SELECTED}
                className="text-[12px] leading-[16px] uppercase tracking-[1px] text-text-octonary-dark"
              >
                Perps Overview
              </AppText>
            </View>
            <StatRow
              label="Balance"
              value={`${normalizedPerpsBalance.toFixed(2)} `}
            />
            <View className="h-px bg-border-primary-dark/35" />
            <StatRow
              label="Unrealized PNL"
              value={`${unrealizedPnl.toFixed(2)} `}
              valueClassName={
                unrealizedPnl >= 0 ? "text-[#52f2a8]" : "text-[#fb7185]"
              }
            />
            <View className="h-px bg-border-primary-dark/35" />
            <StatRow
              label="Cross Account Leverage"
              value={crossAccountLeverage}
            />
          </View>
        </ScrollView>
      )}

      <AppModal
        isOpen={isMarketSelectorOpen}
        onClose={() => setIsMarketSelectorOpen(false)}
        title="Select Market"
        className="h-[85vh]"
        contentClassName="p-0 flex-1"
      >
        <MarketsContainer
          openMarketDetailsOnSelect={false}
          onMarketSelect={() => setIsMarketSelectorOpen(false)}
        />
      </AppModal>

      <MarginModeDialog
        isOpen={isMarginModeDialogOpen}
        onClose={() => setIsMarginModeDialogOpen(false)}
        selectedMode={marginMode}
        onConfirm={async (mode) => {
          const isApproved = await checkApprovalStatus({
            userPublicKeyParam: address as `0x${string}`,
          });

          if (!isApproved) {
            appToast.error({
              message: "Please approve the agent wallet to update margin mode",
            });
            return;
          }

          try {
            const success = await updateMarginAndLeverage({
              currentCurrency: coin,
              agentPrivateKey: agentPrivateKey as `0x${string}`,
              marginMode: mode,
              leverage: userLeverage,
            });

            if (success) {
              setMarginMode(mode);
              appToast.success({
                message: "Margin mode updated successfully.",
              });
            } else {
              appToast.error({ message: "Failed to update margin mode." });
            }
          } catch (error) {
            console.error("Error updating margin mode:", error);
            appToast.error({ message: "Error updating margin mode." });
          }
        }}
        symbol={`${coin.toUpperCase()}-USDC`}
        isSubmitting={isUpdateMarginAndLeverageLoading}
      />

      <LeverageDialog
        isOpen={isLeverageDialogOpen}
        onClose={() => setIsLeverageDialogOpen(false)}
        selectedLeverage={userLeverage}
        onConfirm={async (leverage) => {
          const isApproved = await checkApprovalStatus({
            userPublicKeyParam: address as `0x${string}`,
          });

          if (!isApproved) {
            appToast.error({
              message: "Please approve the agent wallet to update leverage",
            });
            return;
          }

          try {
            const success = await updateMarginAndLeverage({
              currentCurrency: coin,
              agentPrivateKey: agentPrivateKey as `0x${string}`,
              marginMode,
              leverage,
            });

            if (success) {
              setUserLeverage(leverage);
              appToast.success({ message: "Leverage updated successfully." });
            } else {
              appToast.error({ message: "Failed to update leverage." });
            }
          } catch (error) {
            console.error("Error updating leverage:", error);
            appToast.error({ message: "Error updating leverage." });
          }
        }}
        symbol={`${coin.toUpperCase()}-USDC`}
        maxLeverage={maxLeverage}
        isSubmitting={isUpdateMarginAndLeverageLoading}
      />

      <MaxSlippageDialog
        isOpen={isMaxSlippageDialogOpen}
        onClose={() => setIsMaxSlippageDialogOpen(false)}
        selectedMaxSlippage={maxSlippage}
        onConfirm={(slippage) => {
          setMaxSlippage(slippage);
        }}
      />
    </AppDrawer>
  );
};

export default TradeOrderDrawer;
