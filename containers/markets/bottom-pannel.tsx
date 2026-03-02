import { MarketAccountOverview } from "@/components/sections/markets/account-overview";
import { infoClient } from "@/lib/clients/hyperliquid";
import { useBottomPannelStore } from "@/store/bottom-pannel";
import type { Position } from "@/types/bottom-pannel";
import type { ISubscription } from "@nktkas/hyperliquid";
import { useAccount } from "@reown/appkit-react-native";
import React, { useCallback, useEffect, useMemo, useRef } from "react";

type Props = {
  coin: string;
  mode?: "header" | "content" | "both";
  enableDataSync?: boolean;
};

export const BottomPannel: React.FC<Props> = ({
  coin,
  mode = "both",
  enableDataSync = true,
}) => {
  const { address: userAddress } = useAccount();
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
    };

    loadTabData();
  }, [
    activeAccountTab,
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
    if (activeAccountTab !== "positions") return;

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
    if (activeAccountTab !== "openOrders") return;

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
    if (activeAccountTab !== "tradeHistory") return;

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
    if (activeAccountTab !== "fundingHistory") return;

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
    if (activeAccountTab !== "orderHistory") return;

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

  if (mode === "header") {
    return (
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
      />
    );
  }

  if (mode === "content") {
    return (
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
      />
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
      />
    </>
  );
};

export default BottomPannel;
