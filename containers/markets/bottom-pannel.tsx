import { MarketAccountOverview } from "@/components/sections/markets/account-overview";
import LimitCloseModal from "@/components/sections/markets/limit-close-modal";
import PositionTpslModal from "@/components/sections/markets/position-tpsl-modal";
import TransferModal from "@/components/sections/markets/transfer-modal";
import { appToast } from "@/components/ui/app-toast";
import { useBuilderFee } from "@/hooks/useBuilderFees";
import { useApiWallet } from "@/hooks/useWallet";
import {
  getAgentExchangeClient,
  getSymbolConverter,
  infoClient,
} from "@/lib/clients/hyperliquid";
import { BUILDER_CONFIG } from "@/lib/config";
import { addDecimals } from "@/lib/utils/decimals";
import { useBottomPannelStore } from "@/store/bottom-pannel";
import { useMarketStore } from "@/store/markets";
import { useTradeOrderDrawerStore } from "@/store/trade-order-drawer";
import type { Position } from "@/types/bottom-pannel";
import type { ISubscription } from "@nktkas/hyperliquid";
import { useAccount, useProvider } from "@reown/appkit-react-native";
import { BrowserProvider } from "ethers";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Props = {
  coin: string;
  mode?: "header" | "content" | "both";
  enableDataSync?: boolean;
};

type PositionTpslState = {
  takeProfit?: { triggerPx: string; limitPx?: string; orderId?: string };
  stopLoss?: { triggerPx: string; limitPx?: string; orderId?: string };
};

export const BottomPannel: React.FC<Props> = ({
  coin,
  mode = "both",
  enableDataSync = true,
}) => {
  const { address: userAddress } = useAccount();
  const { provider: walletProvider } = useProvider();
  const balances = useBottomPannelStore((state) => state.balances);
  const isBalancesLoading = useBottomPannelStore(
    (state) => state.isBalancesLoading,
  );
  const balancesError = useBottomPannelStore((state) => state.isError);
  const setBalances = useBottomPannelStore((state) => state.setBalances);
  const getAllBalances = useBottomPannelStore((state) => state.getAllBalances);
  const getLiveBalances = useBottomPannelStore(
    (state) => state.getLiveBalances,
  );
  const positions = useBottomPannelStore((state) => state.userPositions);
  const isPositionsLoading = useBottomPannelStore(
    (state) => state.isUserPositionsLoading,
  );
  const setUserPositions = useBottomPannelStore(
    (state) => state.setUserPositions,
  );
  const getUserPositions = useBottomPannelStore(
    (state) => state.getUserPositions,
  );
  const getLiveUserPositions = useBottomPannelStore(
    (state) => state.getLiveUserPositions,
  );
  const openOrders = useBottomPannelStore((state) => state.userOpenOrders);
  const isOpenOrdersLoading = useBottomPannelStore(
    (state) => state.isUserOpenOrdersLoading,
  );
  const setOpenOrders = useBottomPannelStore((state) => state.setOpenOrders);
  const getUserOpenOrders = useBottomPannelStore(
    (state) => state.getUserOpenOrders,
  );
  const getLiveUserOpenOrders = useBottomPannelStore(
    (state) => state.getLiveUserOpenOrders,
  );
  const tradeHistory = useBottomPannelStore((state) => state.tradeHistory);
  const isTradeHistoryLoading = useBottomPannelStore(
    (state) => state.isTradeHistoryLoading,
  );
  const setTradeHistory = useBottomPannelStore(
    (state) => state.setTradeHistory,
  );
  const getUserTradeHistory = useBottomPannelStore(
    (state) => state.getUserTradeHistory,
  );
  const getLiveUserTradeHistory = useBottomPannelStore(
    (state) => state.getLiveUserTradeHistory,
  );
  const userFundings = useBottomPannelStore((state) => state.userFundings);
  const isUserFundingsLoading = useBottomPannelStore(
    (state) => state.isUserFundingsLoading,
  );
  const setUserFundings = useBottomPannelStore(
    (state) => state.setUserFundings,
  );
  const getUserFundings = useBottomPannelStore(
    (state) => state.getUserFundings,
  );
  const getLiveUserFundings = useBottomPannelStore(
    (state) => state.getLiveUserFundings,
  );
  const historicalOrders = useBottomPannelStore(
    (state) => state.historicalOrders,
  );
  const isHistoricalOrdersLoading = useBottomPannelStore(
    (state) => state.isHistoricalOrdersLoading,
  );
  const setHistoricalOrders = useBottomPannelStore(
    (state) => state.setHistoricalOrders,
  );
  const getHistoricalOrders = useBottomPannelStore(
    (state) => state.getHistoricalOrders,
  );
  const getLiveHistoricalOrders = useBottomPannelStore(
    (state) => state.getLiveHistoricalOrders,
  );
  const isTransferModalOpen = useBottomPannelStore(
    (state) => state.isTransferModalOpen,
  );
  const transferDirection = useBottomPannelStore(
    (state) => state.transferDirection,
  );
  const isTransferLoading = useBottomPannelStore(
    (state) => state.isTransferLoading,
  );
  const openTransferModal = useBottomPannelStore(
    (state) => state.openTransferModal,
  );
  const closeTransferModal = useBottomPannelStore(
    (state) => state.closeTransferModal,
  );
  const transferUsdcBetweenAccounts = useBottomPannelStore(
    (state) => state.transferUsdcBetweenAccounts,
  );
  const cancelOrdersWithAgent = useBottomPannelStore(
    (state) => state.cancelOrdersWithAgent,
  );
  const isCancellingOrdersWithAgentLoading = useBottomPannelStore(
    (state) => state.isCancellingOrdersWithAgentLoading,
  );

  const activeAccountTab = useBottomPannelStore(
    (state) => state.activeAccountTab,
  );
  const setActiveAccountTab = useBottomPannelStore(
    (state) => state.setActiveAccountTab,
  );
  const expandedAccountCards = useBottomPannelStore(
    (state) => state.expandedAccountCards,
  );
  const resetExpandedAccountCards = useBottomPannelStore(
    (state) => state.resetExpandedAccountCards,
  );
  const toggleExpandedAccountCard = useBottomPannelStore(
    (state) => state.toggleExpandedAccountCard,
  );
  const { checkApprovalStatus, agentPrivateKey, agentWallet } = useApiWallet({
    userPublicKey: userAddress as `0x${string}`,
  });
  const { checkBuilderFeeStatus } = useBuilderFee({
    userPublicKey: userAddress as `0x${string}`,
  });
  const maxSlippage = useTradeOrderDrawerStore((state) => state.maxSlippage);
  const placeOrderWithAgent = useTradeOrderDrawerStore(
    (state) => state.placeOrderWithAgent,
  );
  const resolveSzDecimals = useTradeOrderDrawerStore(
    (state) => state.resolveSzDecimals,
  );
  const markPrice = useTradeOrderDrawerStore((state) => state.markPrice);
  const market = useMarketStore((state) => state.markets.get(`${coin}-USDC`));
  const marketMarkPrice = market?.mark ?? null;

  const [isLimitCloseModalOpen, setIsLimitCloseModalOpen] = useState(false);
  const [limitClosePosition, setLimitClosePosition] = useState<Position | null>(
    null,
  );
  const [isPositionTpslModalOpen, setIsPositionTpslModalOpen] = useState(false);
  const [positionTpslTarget, setPositionTpslTarget] = useState<Position | null>(
    null,
  );
  const [positionTpslSzDecimals, setPositionTpslSzDecimals] = useState(4);
  const balancesSubscriptionRef = useRef<ISubscription | null>(null);
  const positionsSubscriptionRef = useRef<ISubscription | null>(null);
  const openOrdersSubscriptionRef = useRef<ISubscription | null>(null);
  const tradeHistorySubscriptionRef = useRef<ISubscription | null>(null);
  const userFundingsSubscriptionRef = useRef<ISubscription | null>(null);
  const historicalOrdersSubscriptionRef = useRef<ISubscription | null>(null);

  useEffect(() => {
    if (!enableDataSync) return;
    setActiveAccountTab("balances");
    resetExpandedAccountCards();
  }, [coin, enableDataSync, resetExpandedAccountCards, setActiveAccountTab]);

  useEffect(() => {
    if (!enableDataSync) return;
    if (!infoClient || !userAddress) return;
    if (!userAddress.startsWith("0x")) return;

    const loadTabData = async () => {
      /*
      switch (activeAccountTab) {
        case "balances": {
          const rows = await getAllBalances({
            publicKey: userAddress as `0x${string}`,
          });
          setBalances(rows);
          break;
        }
        case "positions": {
          const rows = await getUserPositions({
            publicKey: userAddress as `0x${string}`,
          });
          setUserPositions(rows);
          break;
        }
        case "tradeHistory": {
          const rows = await getUserTradeHistory({
            publicKey: userAddress as `0x${string}`,
          });
          setTradeHistory(rows);
          break;
        }
        case "fundingHistory": {
          const rows = await getUserFundings({
            publicKey: userAddress as `0x${string}`,
          });
          setUserFundings(rows);
          break;
        }
        case "orderHistory": {
          const rows = await getHistoricalOrders({
            publicKey: userAddress as `0x${string}`,
          });
          setHistoricalOrders(rows);
          break;
        }
        case "openOrders": {
          const rows = await getUserOpenOrders({
            publicKey: userAddress as `0x${string}`,
          });
          setOpenOrders(rows);
          break;
        }
      }
      */

      const [
        balancesRows,
        positionsRows,
        tradeHistoryRows,
        fundingHistoryRows,
        historicalOrdersRows,
        openOrdersRows,
      ] = await Promise.all([
        getAllBalances({
          publicKey: userAddress as `0x${string}`,
        }),
        getUserPositions({
          publicKey: userAddress as `0x${string}`,
        }),
        getUserTradeHistory({
          publicKey: userAddress as `0x${string}`,
        }),
        getUserFundings({
          publicKey: userAddress as `0x${string}`,
        }),
        getHistoricalOrders({
          publicKey: userAddress as `0x${string}`,
        }),
        getUserOpenOrders({
          publicKey: userAddress as `0x${string}`,
        }),
      ]);

      setBalances(balancesRows);
      setUserPositions(positionsRows);
      setTradeHistory(tradeHistoryRows);
      setUserFundings(fundingHistoryRows);
      setHistoricalOrders(historicalOrdersRows);
      setOpenOrders(openOrdersRows);
    };

    loadTabData();
  }, [
    enableDataSync,
    getAllBalances,
    getHistoricalOrders,
    getUserFundings,
    getUserOpenOrders,
    getUserPositions,
    getUserTradeHistory,
    setBalances,
    setHistoricalOrders,
    setTradeHistory,
    setUserFundings,
    setOpenOrders,
    setUserPositions,
    userAddress,
  ]);

  /*
    Moved live balances subscription to HomeHeader.
    Keeping this commented block for reference.
  useEffect(() => {
    if (!enableDataSync) return;
    if (!userAddress) return;
    if (!userAddress.startsWith("0x")) return;
    if (activeAccountTab !== "balances") return;

    let isActive = true;
    balancesSubscriptionRef.current?.unsubscribe();
    balancesSubscriptionRef.current = null;

    const subscribe = async () => {
      const subscription = await getLiveBalances(
        userAddress as `0x${string}`,
        setBalances,
      );

      if (!isActive) {
        subscription?.unsubscribe();
        return;
      }

      balancesSubscriptionRef.current = subscription;
    };

    void subscribe();

    return () => {
      isActive = false;
      balancesSubscriptionRef.current?.unsubscribe();
      balancesSubscriptionRef.current = null;
    };
  }, [
    activeAccountTab,
    enableDataSync,
    getLiveBalances,
    setBalances,
    userAddress,
  ]);
  */

  useEffect(() => {
    if (!enableDataSync) return;
    if (!userAddress) return;
    if (!userAddress.startsWith("0x")) return;
    // if (activeAccountTab !== "positions") return;

    let isActive = true;
    positionsSubscriptionRef.current?.unsubscribe();
    positionsSubscriptionRef.current = null;

    const subscribe = async () => {
      const subscription = await getLiveUserPositions(
        userAddress as `0x${string}`,
        setUserPositions,
      );

      if (!isActive) {
        subscription?.unsubscribe();
        return;
      }

      positionsSubscriptionRef.current = subscription;
    };

    void subscribe();

    return () => {
      isActive = false;
      positionsSubscriptionRef.current?.unsubscribe();
      positionsSubscriptionRef.current = null;
    };
  }, [
    activeAccountTab,
    enableDataSync,
    getLiveUserPositions,
    setUserPositions,
    userAddress,
  ]);

  useEffect(() => {
    if (!enableDataSync) return;
    if (!userAddress) return;
    if (!userAddress.startsWith("0x")) return;
    // if (activeAccountTab !== "openOrders") return;

    let isActive = true;
    openOrdersSubscriptionRef.current?.unsubscribe();
    openOrdersSubscriptionRef.current = null;

    const subscribe = async () => {
      const subscription = await getLiveUserOpenOrders(
        userAddress as `0x${string}`,
        setOpenOrders,
      );

      if (!isActive) {
        subscription?.unsubscribe();
        return;
      }

      openOrdersSubscriptionRef.current = subscription;
    };

    void subscribe();

    return () => {
      isActive = false;
      openOrdersSubscriptionRef.current?.unsubscribe();
      openOrdersSubscriptionRef.current = null;
    };
  }, [
    activeAccountTab,
    enableDataSync,
    getLiveUserOpenOrders,
    setOpenOrders,
    userAddress,
  ]);

  useEffect(() => {
    if (!enableDataSync) return;
    if (!userAddress) return;
    if (!userAddress.startsWith("0x")) return;
    // if (activeAccountTab !== "tradeHistory") return;

    let isActive = true;
    tradeHistorySubscriptionRef.current?.unsubscribe();
    tradeHistorySubscriptionRef.current = null;

    const subscribe = async () => {
      const subscription = await getLiveUserTradeHistory(
        userAddress as `0x${string}`,
        setTradeHistory,
      );

      if (!isActive) {
        subscription?.unsubscribe();
        return;
      }

      tradeHistorySubscriptionRef.current = subscription;
    };

    void subscribe();

    return () => {
      isActive = false;
      tradeHistorySubscriptionRef.current?.unsubscribe();
      tradeHistorySubscriptionRef.current = null;
    };
  }, [
    activeAccountTab,
    enableDataSync,
    getLiveUserTradeHistory,
    setTradeHistory,
    userAddress,
  ]);

  useEffect(() => {
    if (!enableDataSync) return;
    if (!userAddress) return;
    if (!userAddress.startsWith("0x")) return;
    // if (activeAccountTab !== "fundingHistory") return;

    let isActive = true;
    userFundingsSubscriptionRef.current?.unsubscribe();
    userFundingsSubscriptionRef.current = null;

    const subscribe = async () => {
      const subscription = await getLiveUserFundings(
        userAddress as `0x${string}`,
        setUserFundings,
      );

      if (!isActive) {
        subscription?.unsubscribe();
        return;
      }

      userFundingsSubscriptionRef.current = subscription;
    };

    void subscribe();

    return () => {
      isActive = false;
      userFundingsSubscriptionRef.current?.unsubscribe();
      userFundingsSubscriptionRef.current = null;
    };
  }, [
    activeAccountTab,
    enableDataSync,
    getLiveUserFundings,
    setUserFundings,
    userAddress,
  ]);

  useEffect(() => {
    if (!enableDataSync) return;
    if (!userAddress) return;
    if (!userAddress.startsWith("0x")) return;
    // if (activeAccountTab !== "orderHistory") return;

    let isActive = true;
    historicalOrdersSubscriptionRef.current?.unsubscribe();
    historicalOrdersSubscriptionRef.current = null;

    const subscribe = async () => {
      const subscription = await getLiveHistoricalOrders(
        userAddress as `0x${string}`,
        setHistoricalOrders,
      );

      if (!isActive) {
        subscription?.unsubscribe();
        return;
      }

      historicalOrdersSubscriptionRef.current = subscription;
    };

    void subscribe();

    return () => {
      isActive = false;
      historicalOrdersSubscriptionRef.current?.unsubscribe();
      historicalOrdersSubscriptionRef.current = null;
    };
  }, [
    activeAccountTab,
    enableDataSync,
    getLiveHistoricalOrders,
    setHistoricalOrders,
    userAddress,
  ]);

  const handleToggleAccountCard = useCallback(
    (cardId: string) => {
      toggleExpandedAccountCard(cardId);
    },
    [toggleExpandedAccountCard],
  );

  const filteredPositions = useMemo<Position[]>(() => {
    const normalizedCoin = coin.toUpperCase();
    return positions.filter(
      (item) => item?.position?.coin?.toUpperCase() === normalizedCoin,
    );
  }, [coin, positions]);
  // const filteredOpenOrders = useMemo<OpenOrder[]>(() => {
  //   const normalizedCoin = coin.toUpperCase();
  //   return openOrders.filter((item) => item?.coin?.toUpperCase() === normalizedCoin);
  // }, [coin, openOrders]);
  const filteredOpenOrders = openOrders;
  const existingPositionTpsl = useMemo<PositionTpslState>(() => {
    const positionCoin = positionTpslTarget?.position?.coin;
    if (!positionCoin) return {};

    const tpslOrders = filteredOpenOrders.filter((order) => {
      const orderData = order as Record<string, unknown>;
      return (
        Boolean(orderData?.isPositionTpsl) &&
        String(orderData?.coin ?? "") === positionCoin
      );
    });

    const takeProfitOrder = tpslOrders.find((order) =>
      String((order as Record<string, unknown>)?.orderType ?? "").includes(
        "Take Profit",
      ),
    ) as Record<string, unknown> | undefined;
    const stopLossOrder = tpslOrders.find((order) =>
      String((order as Record<string, unknown>)?.orderType ?? "").includes(
        "Stop",
      ),
    ) as Record<string, unknown> | undefined;

    return {
      takeProfit: takeProfitOrder
        ? {
            triggerPx: String(takeProfitOrder.triggerPx ?? ""),
            limitPx: String(takeProfitOrder.limitPx ?? "") || undefined,
            orderId: String(takeProfitOrder.oid ?? ""),
          }
        : undefined,
      stopLoss: stopLossOrder
        ? {
            triggerPx: String(stopLossOrder.triggerPx ?? ""),
            limitPx: String(stopLossOrder.limitPx ?? "") || undefined,
            orderId: String(stopLossOrder.oid ?? ""),
          }
        : undefined,
    };
  }, [filteredOpenOrders, positionTpslTarget?.position?.coin]);

  const handleOpenPositionTpslModal = useCallback(
    (positionItem: Position) => {
      setPositionTpslTarget(positionItem);
      setIsPositionTpslModalOpen(true);
      setPositionTpslSzDecimals(4);
      void resolveSzDecimals(positionItem.position.coin)
        .then((decimals) => {
          if (Number.isFinite(decimals)) {
            setPositionTpslSzDecimals(decimals);
          }
        })
        .catch(() => {
          setPositionTpslSzDecimals(4);
        });
    },
    [resolveSzDecimals],
  );

  const handleClosePositionTpslModal = useCallback(() => {
    setIsPositionTpslModalOpen(false);
    setPositionTpslTarget(null);
  }, []);
  const parseAvailableAmount = useCallback((balanceValue?: string) => {
    if (!balanceValue) return "0";
    const [value] = balanceValue.split(" ");
    const parsedValue = Number.parseFloat(value);
    if (!Number.isFinite(parsedValue) || parsedValue <= 0) return "0";
    return parsedValue.toFixed(2);
  }, []);
  const perpsAvailable = useMemo(() => {
    const perps = balances.find((balance) =>
      balance.coin.toLowerCase().includes("perps"),
    );
    return parseAvailableAmount(perps?.available_balance);
  }, [balances, parseAvailableAmount]);
  const spotAvailable = useMemo(() => {
    const spot = balances.find((balance) =>
      balance.coin.toLowerCase().includes("spot"),
    );
    return parseAvailableAmount(spot?.available_balance);
  }, [balances, parseAvailableAmount]);
  const getReliableSigner = useCallback(async () => {
    if (!walletProvider) return null;
    try {
      const provider = new BrowserProvider(walletProvider);
      return await provider.getSigner();
    } catch {
      return null;
    }
  }, [walletProvider]);
  const handleBalanceTransfer = useCallback(
    (direction: "toPerp" | "toSpot") => {
      openTransferModal(direction);
    },
    [openTransferModal],
  );
  const handleTransferConfirm = useCallback(
    async (amount: string, toPerp: boolean) => {
      const signer = await getReliableSigner();
      if (!signer) {
        appToast.error({
          message:
            "Wallet signer unavailable. Please reconnect your wallet and try again.",
        });
        return;
      }

      const response = await transferUsdcBetweenAccounts({
        signer,
        amount,
        toPerp,
      });

      if (!response.success) {
        appToast.error({ message: response.error || "Transfer failed." });
        return;
      }

      appToast.success({
        message: `Transferred ${amount} USDC from ${toPerp ? "Spot to Perps" : "Perps to Spot"}.`,
      });
      closeTransferModal();

      if (userAddress?.startsWith("0x")) {
        const rows = await getAllBalances({
          publicKey: userAddress as `0x${string}`,
        });
        setBalances(rows);
      }
    },
    [
      closeTransferModal,
      getAllBalances,
      getReliableSigner,
      setBalances,
      transferUsdcBetweenAccounts,
      userAddress,
    ],
  );
  const handleOpenOrderCancel = useCallback(
    async ({
      oid,
      coin,
      agentPrivateKey,
    }: {
      oid: number;
      coin: string;
      agentPrivateKey: `0x${string}`;
    }) => {
      if (!agentPrivateKey) {
        appToast.error({
          message:
            "Agent wallet is not ready yet. Please try again in a moment.",
        });
        return;
      }
      if (!userAddress?.startsWith("0x")) return;

      const isApproved = await checkApprovalStatus({
        userPublicKeyParam: userAddress as `0x${string}`,
      });

      if (!isApproved) {
        appToast.error({
          message: "Please approve the agent wallet to cancel order",
        });
        return;
      }

      const success = await cancelOrdersWithAgent({
        agentPrivateKey,
        orders: [{ orderId: oid.toString(), a: coin }],
      });

      if (!success) {
        appToast.error({
          message: "Unable to cancel order. Please try again.",
        });
        return;
      }

      const rows = await getUserOpenOrders({
        publicKey: userAddress as `0x${string}`,
      });
      setOpenOrders(rows);
    },
    [
      cancelOrdersWithAgent,
      checkApprovalStatus,
      getUserOpenOrders,
      setOpenOrders,
      userAddress,
    ],
  );
  const handleCancelAllOpenOrders = useCallback(async () => {
    if (!agentPrivateKey) {
      appToast.error({
        message: "Agent wallet is not ready yet. Please try again in a moment.",
      });
      return;
    }
    if (!userAddress?.startsWith("0x")) return;

    const ordersToCancel = filteredOpenOrders.reduce<
      { orderId: string; a: string }[]
    >((acc, order) => {
      const orderData = (order ?? {}) as Record<string, unknown>;
      const openOrderOid = Number(
        orderData.oid ?? orderData.orderId ?? Number.NaN,
      );
      const openOrderCoin = String(orderData.coin ?? "");

      if (
        Number.isFinite(openOrderOid) &&
        openOrderOid > 0 &&
        openOrderCoin.length > 0
      ) {
        acc.push({ orderId: openOrderOid.toString(), a: openOrderCoin });
      }
      return acc;
    }, []);

    if (ordersToCancel.length === 0) {
      appToast.info({ message: "No cancellable open orders found." });
      return;
    }

    const isApproved = await checkApprovalStatus({
      userPublicKeyParam: userAddress as `0x${string}`,
    });

    if (!isApproved) {
      appToast.error({
        message: "Please approve the agent wallet to cancel order",
      });
      return;
    }

    const success = await cancelOrdersWithAgent({
      agentPrivateKey: agentPrivateKey as `0x${string}`,
      orders: ordersToCancel,
    });

    if (!success) {
      appToast.error({
        message: "Unable to cancel all orders. Please try again.",
      });
      return;
    }

    const rows = await getUserOpenOrders({
      publicKey: userAddress as `0x${string}`,
    });
    setOpenOrders(rows);
  }, [
    agentPrivateKey,
    cancelOrdersWithAgent,
    checkApprovalStatus,
    filteredOpenOrders,
    getUserOpenOrders,
    setOpenOrders,
    userAddress,
  ]);
  const handleClosePositionMarket = useCallback(
    async (positionItem: Position) => {
      const pos = positionItem?.position;
      if (!pos) return;

      if (!userAddress?.startsWith("0x")) {
        appToast.error({ message: "Please connect your wallet" });
        return;
      }

      if (!agentPrivateKey) {
        appToast.error({ message: "Please connect your wallet" });
        return;
      }

      const isApprovedBuilderFee = await checkBuilderFeeStatus({
        userPublicKeyParam: userAddress as `0x${string}`,
      });

      if (!isApprovedBuilderFee) {
        appToast.error({
          message: "Please approve the builder fee to place order",
        });
        return;
      }

      const isApproved = await checkApprovalStatus({
        agentPublicKeyParam: agentWallet?.address as `0x${string}`,
        userPublicKeyParam: userAddress as `0x${string}`,
      });

      if (!isApproved) {
        appToast.error({
          message: "Please approve the agent wallet to place order",
        });
        return;
      }

      try {
        const currentSize = Number.parseFloat(pos.szi);
        if (!Number.isFinite(currentSize) || currentSize === 0) {
          appToast.error({ message: "Position size is zero" });
          return;
        }

        if (!marketMarkPrice || marketMarkPrice <= 0) {
          appToast.error({
            message:
              "Unable to get mark price, Wait for a while and try again!",
          });
          return;
        }

        const normalizedMaxSlippage = Number.isFinite(maxSlippage)
          ? maxSlippage
          : 0;
        const slippageAmount = marketMarkPrice * (normalizedMaxSlippage / 100);
        const rawPrice =
          currentSize < 0
            ? marketMarkPrice + slippageAmount
            : marketMarkPrice - slippageAmount;

        const szDecimals = await resolveSzDecimals(pos.coin);
        const marketPrice = addDecimals(rawPrice, szDecimals).toString();
        const formattedSize = addDecimals(
          Math.abs(currentSize),
          szDecimals,
        ).toString();

        const success = await placeOrderWithAgent({
          agentPrivateKey: agentPrivateKey as `0x${string}`,
          a: pos.coin,
          b: currentSize < 0,
          s: formattedSize,
          p: marketPrice,
          r: true,
        });

        if (success) {
          appToast.success({ message: "Position closed successfully" });
          const rows = await getUserPositions({
            publicKey: userAddress as `0x${string}`,
          });
          setUserPositions(rows);
          setActiveAccountTab("positions");
        }
      } catch (error) {
        console.error("Error closing position:", error);
        appToast.error({ message: "Failed to close position" });
      }
    },
    [
      agentPrivateKey,
      agentWallet?.address,
      checkApprovalStatus,
      checkBuilderFeeStatus,
      getUserPositions,
      marketMarkPrice,
      maxSlippage,
      placeOrderWithAgent,
      resolveSzDecimals,
      setActiveAccountTab,
      setUserPositions,
      userAddress,
    ],
  );

  const handleReversePositionMarket = useCallback(
    async (positionItem: Position) => {
      const pos = positionItem?.position;
      if (!pos) return;

      if (!userAddress?.startsWith("0x")) {
        appToast.error({ message: "Please connect your wallet" });
        return;
      }

      if (!agentPrivateKey) {
        appToast.error({ message: "Please connect your wallet" });
        return;
      }

      const isApprovedBuilderFee = await checkBuilderFeeStatus({
        userPublicKeyParam: userAddress as `0x${string}`,
      });

      if (!isApprovedBuilderFee) {
        appToast.error({
          message: "Please approve the builder fee to place order",
        });
        return;
      }

      const isApproved = await checkApprovalStatus({
        agentPublicKeyParam: agentWallet?.address as `0x${string}`,
        userPublicKeyParam: userAddress as `0x${string}`,
      });

      if (!isApproved) {
        appToast.error({
          message: "Please approve the agent wallet to place order",
        });
        return;
      }

      try {
        const currentSize = Number.parseFloat(pos.szi);
        if (!Number.isFinite(currentSize) || currentSize === 0) {
          appToast.error({ message: "Position size is zero" });
          return;
        }

        if (!marketMarkPrice || marketMarkPrice <= 0) {
          appToast.error({
            message:
              "Unable to get mark price, Wait for a while and try again!",
          });
          return;
        }

        const reverseSide = currentSize < 0;
        const reverseSize = Math.abs(currentSize) * 2;
        const normalizedMaxSlippage = Number.isFinite(maxSlippage)
          ? maxSlippage
          : 0;
        const slippageAmount = marketMarkPrice * (normalizedMaxSlippage / 100);
        const rawPrice = reverseSide
          ? marketMarkPrice + slippageAmount
          : marketMarkPrice - slippageAmount;
        if (!Number.isFinite(rawPrice) || rawPrice <= 0) {
          appToast.error({ message: "Invalid market price for reverse order" });
          return;
        }

        const szDecimals = await resolveSzDecimals(pos.coin);
        const reversePrice = addDecimals(rawPrice, szDecimals).toString();
        const formattedSize = addDecimals(reverseSize, szDecimals).toString();

        const success = await placeOrderWithAgent({
          agentPrivateKey: agentPrivateKey as `0x${string}`,
          a: pos.coin,
          b: reverseSide,
          s: formattedSize,
          p: reversePrice,
          r: false,
          tif: "FrontendMarket",
        });

        if (success) {
          appToast.success({
            message: "Reverse position order placed successfully",
          });
          const rows = await getUserPositions({
            publicKey: userAddress as `0x${string}`,
          });
          setUserPositions(rows);
          setActiveAccountTab("positions");
        }
      } catch (error) {
        console.error("Error reversing position:", error);
        appToast.error({ message: "Failed to reverse position" });
      }
    },
    [
      agentPrivateKey,
      agentWallet?.address,
      checkApprovalStatus,
      checkBuilderFeeStatus,
      getUserPositions,
      marketMarkPrice,
      maxSlippage,
      placeOrderWithAgent,
      resolveSzDecimals,
      setActiveAccountTab,
      setUserPositions,
      userAddress,
    ],
  );

  const handleOpenLimitCloseModal = useCallback((positionItem: Position) => {
    setLimitClosePosition(positionItem);
    setIsLimitCloseModalOpen(true);
  }, []);

  const handleCloseLimitCloseModal = useCallback(() => {
    setIsLimitCloseModalOpen(false);
    setLimitClosePosition(null);
  }, []);

  const handleClosePositionLimit = useCallback(
    async (price: string, percentage: number) => {
      const pos = limitClosePosition?.position;
      if (!pos) {
        appToast.error({ message: "Unable to resolve position" });
        return;
      }

      if (!userAddress?.startsWith("0x")) {
        appToast.error({ message: "Please connect your wallet" });
        return;
      }

      if (!agentPrivateKey) {
        appToast.error({ message: "Please connect your wallet" });
        return;
      }

      const isApprovedBuilderFee = await checkBuilderFeeStatus({
        userPublicKeyParam: userAddress as `0x${string}`,
      });
      if (!isApprovedBuilderFee) {
        appToast.error({
          message: "Please approve the builder fee to place order",
        });
        return;
      }

      const isApproved = await checkApprovalStatus({
        agentPublicKeyParam: agentWallet?.address as `0x${string}`,
        userPublicKeyParam: userAddress as `0x${string}`,
      });
      if (!isApproved) {
        appToast.error({
          message: "Please approve the agent wallet to place order",
        });
        return;
      }

      try {
        const currentSize = Number.parseFloat(pos.szi);
        if (!Number.isFinite(currentSize) || currentSize === 0) {
          appToast.error({ message: "Position size is zero" });
          return;
        }

        const parsedPrice = Number.parseFloat(price);
        if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
          appToast.error({ message: "Please enter a valid price" });
          return;
        }

        const normalizedPercentage = Number.isFinite(percentage)
          ? Math.min(Math.max(percentage, 0), 100)
          : 0;
        const closeSize = (Math.abs(currentSize) * normalizedPercentage) / 100;
        if (!Number.isFinite(closeSize) || closeSize <= 0) {
          appToast.error({ message: "Close size must be greater than 0" });
          return;
        }

        const szDecimals = await resolveSzDecimals(pos.coin);
        const formattedPrice = addDecimals(parsedPrice, szDecimals).toString();
        const formattedSize = addDecimals(closeSize, szDecimals).toString();

        const success = await placeOrderWithAgent({
          agentPrivateKey: agentPrivateKey as `0x${string}`,
          a: pos.coin,
          b: currentSize < 0,
          s: formattedSize,
          p: formattedPrice,
          r: true,
          tif: "Gtc",
        });

        if (success) {
          appToast.success({
            message: "Limit close order placed successfully",
          });
          setIsLimitCloseModalOpen(false);
          setLimitClosePosition(null);
          const rows = await getUserPositions({
            publicKey: userAddress as `0x${string}`,
          });
          setUserPositions(rows);
          setActiveAccountTab("positions");
        }
      } catch (error) {
        console.error("Error placing limit close order:", error);
        appToast.error({ message: "Failed to place limit close order" });
        throw error;
      }
    },
    [
      agentPrivateKey,
      agentWallet?.address,
      checkApprovalStatus,
      checkBuilderFeeStatus,
      getUserPositions,
      limitClosePosition,
      placeOrderWithAgent,
      resolveSzDecimals,
      setActiveAccountTab,
      setUserPositions,
      userAddress,
    ],
  );

  const handlePlacePositionTpsl = useCallback(
    async ({
      takeProfitPrice,
      stopLossPrice,
      takeProfitLimitPrice,
      stopLossLimitPrice,
      orderSize,
    }: {
      takeProfitPrice?: number;
      stopLossPrice?: number;
      takeProfitLimitPrice?: number;
      stopLossLimitPrice?: number;
      orderSize?: number;
    }) => {
      const pos = positionTpslTarget?.position;
      if (!pos) {
        appToast.error({ message: "Unable to resolve position" });
        return;
      }
      if (!agentPrivateKey || !userAddress?.startsWith("0x")) {
        appToast.error({ message: "Please connect your wallet" });
        return;
      }

      if (takeProfitPrice === undefined && stopLossPrice === undefined) {
        appToast.error({ message: "Please enter TP or SL price" });
        return;
      }

      const isApprovedBuilderFee = await checkBuilderFeeStatus({
        userPublicKeyParam: userAddress as `0x${string}`,
      });
      if (!isApprovedBuilderFee) {
        appToast.error({
          message: "Please approve the builder fee to place order",
        });
        return;
      }

      const isApproved = await checkApprovalStatus({
        agentPublicKeyParam: agentWallet?.address as `0x${string}`,
        userPublicKeyParam: userAddress as `0x${string}`,
      });
      if (!isApproved) {
        appToast.error({
          message: "Please approve the agent wallet to place order",
        });
        return;
      }

      const szDecimals = await resolveSzDecimals(pos.coin);
      const isLong = Number.parseFloat(pos.szi) > 0;
      const sizeStr =
        orderSize === 0
          ? "0"
          : orderSize && orderSize > 0
            ? addDecimals(orderSize, szDecimals).toString()
            : "0";

      try {
        const conv = await getSymbolConverter();
        const assetId = conv.getAssetId(pos.coin);
        const agentExchangeClient = getAgentExchangeClient(
          agentPrivateKey as `0x${string}`,
        );

        const orders: Array<Record<string, unknown>> = [];
        if (stopLossPrice !== undefined) {
          orders.push({
            a: String(assetId),
            b: !isLong,
            p:
              stopLossLimitPrice !== undefined
                ? String(stopLossLimitPrice)
                : String(stopLossPrice),
            r: true,
            s: sizeStr,
            t: {
              trigger: {
                isMarket: stopLossLimitPrice === undefined,
                tpsl: "sl",
                triggerPx: String(stopLossPrice),
              },
            },
          });
        }
        if (takeProfitPrice !== undefined) {
          orders.push({
            a: String(assetId),
            b: !isLong,
            p:
              takeProfitLimitPrice !== undefined
                ? String(takeProfitLimitPrice)
                : String(takeProfitPrice),
            r: true,
            s: sizeStr,
            t: {
              trigger: {
                isMarket: takeProfitLimitPrice === undefined,
                tpsl: "tp",
                triggerPx: String(takeProfitPrice),
              },
            },
          });
        }

        const response = await agentExchangeClient.order({
          grouping: "positionTpsl",
          orders: orders as any,
          builder: {
            b: BUILDER_CONFIG.BUILDER_FEE_ADDRESS,
            f: BUILDER_CONFIG.BUILDER_FEE_RATE * 10,
          },
        });

        if (response.status !== "ok") {
          appToast.error({
            message:
              (response as { response?: { type?: string } })?.response?.type ||
              "Failed to place TP/SL orders",
          });
          return;
        }

        appToast.success({ message: "TP/SL orders placed successfully" });
        const ordersRows = await getUserOpenOrders({
          publicKey: userAddress as `0x${string}`,
        });
        setOpenOrders(ordersRows);
        handleClosePositionTpslModal();
      } catch (error) {
        console.error("Error placing TP/SL orders:", error);
        appToast.error({ message: "Failed to place TP/SL orders" });
        throw error;
      }
    },
    [
      agentPrivateKey,
      agentWallet?.address,
      checkApprovalStatus,
      checkBuilderFeeStatus,
      getUserOpenOrders,
      handleClosePositionTpslModal,
      positionTpslTarget,
      resolveSzDecimals,
      setOpenOrders,
      userAddress,
    ],
  );

  const handleCancelPositionTpsl = useCallback(
    async (type: "tp" | "sl") => {
      const pos = positionTpslTarget?.position;
      if (!pos || !agentPrivateKey || !userAddress?.startsWith("0x")) {
        appToast.error({ message: "Missing required information" });
        return;
      }

      const orderToCancel =
        type === "tp"
          ? existingPositionTpsl.takeProfit
          : existingPositionTpsl.stopLoss;

      if (!orderToCancel?.orderId) {
        appToast.error({ message: "No order found to cancel" });
        return;
      }

      const success = await cancelOrdersWithAgent({
        agentPrivateKey: agentPrivateKey as `0x${string}`,
        orders: [{ orderId: orderToCancel.orderId, a: pos.coin }],
      });

      if (!success) {
        appToast.error({ message: "Failed to cancel order" });
        return;
      }

      appToast.success({
        message: `${type === "tp" ? "Take Profit" : "Stop Loss"} order canceled`,
      });
      const ordersRows = await getUserOpenOrders({
        publicKey: userAddress as `0x${string}`,
      });
      setOpenOrders(ordersRows);
    },
    [
      agentPrivateKey,
      cancelOrdersWithAgent,
      existingPositionTpsl.stopLoss,
      existingPositionTpsl.takeProfit,
      getUserOpenOrders,
      positionTpslTarget,
      setOpenOrders,
      userAddress,
    ],
  );

  if (mode === "header") {
    return (
      <>
        <MarketAccountOverview
          mode="header"
          activeTab={activeAccountTab}
          expandedCards={expandedAccountCards}
          balances={balances}
          positions={filteredPositions}
          openOrders={filteredOpenOrders}
          tradeHistory={tradeHistory}
          userFundings={userFundings}
          historicalOrders={historicalOrders}
          isBalancesLoading={isBalancesLoading}
          isPositionsLoading={isPositionsLoading}
          isOpenOrdersLoading={isOpenOrdersLoading}
          isTradeHistoryLoading={isTradeHistoryLoading}
          isUserFundingsLoading={isUserFundingsLoading}
          isHistoricalOrdersLoading={isHistoricalOrdersLoading}
          balancesError={balancesError}
          positionsError={balancesError}
          openOrdersError={balancesError}
          tradeHistoryError={balancesError}
          fundingHistoryError={balancesError}
          orderHistoryError={balancesError}
          onTabChange={setActiveAccountTab}
          onToggleCard={handleToggleAccountCard}
          onBalanceTransfer={handleBalanceTransfer}
          onOpenOrderCancel={handleOpenOrderCancel}
          onClosePositionLimit={handleOpenLimitCloseModal}
          onClosePositionMarket={handleClosePositionMarket}
          onReversePositionMarket={handleReversePositionMarket}
          onOpenPositionTpsl={handleOpenPositionTpslModal}
          onOpenOrdersCancelAll={handleCancelAllOpenOrders}
          isOpenOrdersCancelLoading={isCancellingOrdersWithAgentLoading}
          agentPrivateKey={agentPrivateKey}
        />
        <TransferModal
          isOpen={isTransferModalOpen}
          onClose={closeTransferModal}
          direction={transferDirection}
          perpsAvailable={perpsAvailable}
          spotAvailable={spotAvailable}
          isSubmitting={isTransferLoading}
          onConfirm={handleTransferConfirm}
        />
        <LimitCloseModal
          isOpen={isLimitCloseModalOpen}
          onClose={handleCloseLimitCloseModal}
          position={limitClosePosition}
          markPrice={markPrice}
          onConfirm={handleClosePositionLimit}
        />
        <PositionTpslModal
          isOpen={isPositionTpslModalOpen}
          onClose={handleClosePositionTpslModal}
          position={positionTpslTarget}
          szDecimals={positionTpslSzDecimals}
          existingTpsl={existingPositionTpsl}
          onConfirm={handlePlacePositionTpsl}
          onCancelTpsl={handleCancelPositionTpsl}
        />
      </>
    );
  }

  if (mode === "content") {
    return (
      <>
        <MarketAccountOverview
          mode="content"
          activeTab={activeAccountTab}
          expandedCards={expandedAccountCards}
          balances={balances}
          positions={filteredPositions}
          openOrders={filteredOpenOrders}
          tradeHistory={tradeHistory}
          userFundings={userFundings}
          historicalOrders={historicalOrders}
          isBalancesLoading={isBalancesLoading}
          isPositionsLoading={isPositionsLoading}
          isOpenOrdersLoading={isOpenOrdersLoading}
          isTradeHistoryLoading={isTradeHistoryLoading}
          isUserFundingsLoading={isUserFundingsLoading}
          isHistoricalOrdersLoading={isHistoricalOrdersLoading}
          balancesError={balancesError}
          positionsError={balancesError}
          openOrdersError={balancesError}
          tradeHistoryError={balancesError}
          fundingHistoryError={balancesError}
          orderHistoryError={balancesError}
          onTabChange={setActiveAccountTab}
          onToggleCard={handleToggleAccountCard}
          onBalanceTransfer={handleBalanceTransfer}
          onOpenOrderCancel={handleOpenOrderCancel}
          onClosePositionLimit={handleOpenLimitCloseModal}
          onClosePositionMarket={handleClosePositionMarket}
          onReversePositionMarket={handleReversePositionMarket}
          onOpenPositionTpsl={handleOpenPositionTpslModal}
          onOpenOrdersCancelAll={handleCancelAllOpenOrders}
          isOpenOrdersCancelLoading={isCancellingOrdersWithAgentLoading}
          agentPrivateKey={agentPrivateKey}
        />
        <TransferModal
          isOpen={isTransferModalOpen}
          onClose={closeTransferModal}
          direction={transferDirection}
          perpsAvailable={perpsAvailable}
          spotAvailable={spotAvailable}
          isSubmitting={isTransferLoading}
          onConfirm={handleTransferConfirm}
        />
        <LimitCloseModal
          isOpen={isLimitCloseModalOpen}
          onClose={handleCloseLimitCloseModal}
          position={limitClosePosition}
          markPrice={markPrice}
          onConfirm={handleClosePositionLimit}
        />
        <PositionTpslModal
          isOpen={isPositionTpslModalOpen}
          onClose={handleClosePositionTpslModal}
          position={positionTpslTarget}
          szDecimals={positionTpslSzDecimals}
          existingTpsl={existingPositionTpsl}
          onConfirm={handlePlacePositionTpsl}
          onCancelTpsl={handleCancelPositionTpsl}
        />
      </>
    );
  }

  return (
    <>
      <MarketAccountOverview
        mode="header"
        activeTab={activeAccountTab}
        expandedCards={expandedAccountCards}
        balances={balances}
        positions={filteredPositions}
        openOrders={filteredOpenOrders}
        tradeHistory={tradeHistory}
        userFundings={userFundings}
        historicalOrders={historicalOrders}
        isBalancesLoading={isBalancesLoading}
        isPositionsLoading={isPositionsLoading}
        isOpenOrdersLoading={isOpenOrdersLoading}
        isTradeHistoryLoading={isTradeHistoryLoading}
        isUserFundingsLoading={isUserFundingsLoading}
        isHistoricalOrdersLoading={isHistoricalOrdersLoading}
        balancesError={balancesError}
        positionsError={balancesError}
        openOrdersError={balancesError}
        tradeHistoryError={balancesError}
        fundingHistoryError={balancesError}
        orderHistoryError={balancesError}
        onTabChange={setActiveAccountTab}
        onToggleCard={handleToggleAccountCard}
        onBalanceTransfer={handleBalanceTransfer}
        onOpenOrderCancel={handleOpenOrderCancel}
        onClosePositionLimit={handleOpenLimitCloseModal}
        onClosePositionMarket={handleClosePositionMarket}
        onReversePositionMarket={handleReversePositionMarket}
        onOpenPositionTpsl={handleOpenPositionTpslModal}
        onOpenOrdersCancelAll={handleCancelAllOpenOrders}
        isOpenOrdersCancelLoading={isCancellingOrdersWithAgentLoading}
        agentPrivateKey={agentPrivateKey}
      />
      <MarketAccountOverview
        mode="content"
        activeTab={activeAccountTab}
        expandedCards={expandedAccountCards}
        balances={balances}
        positions={filteredPositions}
        openOrders={filteredOpenOrders}
        tradeHistory={tradeHistory}
        userFundings={userFundings}
        historicalOrders={historicalOrders}
        isBalancesLoading={isBalancesLoading}
        isPositionsLoading={isPositionsLoading}
        isOpenOrdersLoading={isOpenOrdersLoading}
        isTradeHistoryLoading={isTradeHistoryLoading}
        isUserFundingsLoading={isUserFundingsLoading}
        isHistoricalOrdersLoading={isHistoricalOrdersLoading}
        balancesError={balancesError}
        positionsError={balancesError}
        openOrdersError={balancesError}
        tradeHistoryError={balancesError}
        fundingHistoryError={balancesError}
        orderHistoryError={balancesError}
        onTabChange={setActiveAccountTab}
        onToggleCard={handleToggleAccountCard}
        onBalanceTransfer={handleBalanceTransfer}
        onOpenOrderCancel={handleOpenOrderCancel}
        onClosePositionLimit={handleOpenLimitCloseModal}
        onClosePositionMarket={handleClosePositionMarket}
        onReversePositionMarket={handleReversePositionMarket}
        onOpenPositionTpsl={handleOpenPositionTpslModal}
        onOpenOrdersCancelAll={handleCancelAllOpenOrders}
        isOpenOrdersCancelLoading={isCancellingOrdersWithAgentLoading}
        agentPrivateKey={agentPrivateKey}
      />
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={closeTransferModal}
        direction={transferDirection}
        perpsAvailable={perpsAvailable}
        spotAvailable={spotAvailable}
        isSubmitting={isTransferLoading}
        onConfirm={handleTransferConfirm}
      />
      <LimitCloseModal
        isOpen={isLimitCloseModalOpen}
        onClose={handleCloseLimitCloseModal}
        position={limitClosePosition}
        markPrice={markPrice}
        onConfirm={handleClosePositionLimit}
      />
      <PositionTpslModal
        isOpen={isPositionTpslModalOpen}
        onClose={handleClosePositionTpslModal}
        position={positionTpslTarget}
        szDecimals={positionTpslSzDecimals}
        existingTpsl={existingPositionTpsl}
        onConfirm={handlePlacePositionTpsl}
        onCancelTpsl={handleCancelPositionTpsl}
      />
    </>
  );
};

export default BottomPannel;
