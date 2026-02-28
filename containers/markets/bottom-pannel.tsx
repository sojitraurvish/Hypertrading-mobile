import {
  MarketAccountOverview,
  type TabKey,
} from "@/components/sections/markets/account-overview";
import { infoClient } from "@/lib/clients/hyperliquid";
import { useBottomPannelStore } from "@/store/bottom-pannel";
import type { OpenOrder, Position } from "@/types/bottom-pannel";
import type { ISubscription } from "@nktkas/hyperliquid";
import { useAccount } from "@reown/appkit-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Props = {
  coin: string;
};

export const BottomPannel: React.FC<Props> = ({ coin }) => {
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
  const setUserPositions = useBottomPannelStore((state) => state.setUserPositions);
  const getUserPositions = useBottomPannelStore((state) => state.getUserPositions);
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

  const [activeAccountTab, setActiveAccountTab] = useState<TabKey>("balances");
  const [expandedAccountCards, setExpandedAccountCards] = useState<
    Record<string, boolean>
  >({});
  const balancesSubscriptionRef = useRef<ISubscription | null>(null);
  const positionsSubscriptionRef = useRef<ISubscription | null>(null);
  const openOrdersSubscriptionRef = useRef<ISubscription | null>(null);


  useEffect(() => {
    setActiveAccountTab("balances");
    setExpandedAccountCards({});
  }, [coin]);

  useEffect(() => {
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
        case "orderHistory":
        case "fundingHistory":
        case "tradeHistory":
          break;
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
    getAllBalances,
    getUserOpenOrders,
    getUserPositions,
    setBalances,
    setOpenOrders,
    setUserPositions,
    userAddress,
  ]);

  useEffect(() => {
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
  }, [activeAccountTab, getLiveBalances, setBalances, userAddress]);

  useEffect(() => {
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
  }, [activeAccountTab, getLiveUserPositions, setUserPositions, userAddress]);

  useEffect(() => {
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
  }, [activeAccountTab, getLiveUserOpenOrders, setOpenOrders, userAddress]);

  const handleToggleAccountCard = useCallback((cardId: string) => {
    setExpandedAccountCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  }, []);


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

  return (
    <>
      <MarketAccountOverview
        mode="header"
        activeTab={activeAccountTab}
        expandedCards={expandedAccountCards}
        balances={balances}
        positions={filteredPositions}
        openOrders={filteredOpenOrders}
        isBalancesLoading={isBalancesLoading}
        isPositionsLoading={isPositionsLoading}
        isOpenOrdersLoading={isOpenOrdersLoading}
        balancesError={balancesError}
        positionsError={balancesError}
        openOrdersError={balancesError}
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
        isBalancesLoading={isBalancesLoading}
        isPositionsLoading={isPositionsLoading}
        isOpenOrdersLoading={isOpenOrdersLoading}
        balancesError={balancesError}
        positionsError={balancesError}
        openOrdersError={balancesError}
        onTabChange={setActiveAccountTab}
        onToggleCard={handleToggleAccountCard}
      />
    </>
  );
};

export default BottomPannel;
