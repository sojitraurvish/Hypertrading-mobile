import type { OrderBookData } from "@/store/order-book";
import React, { useMemo } from "react";
import { View } from "react-native";
import { OrderRow } from "./OrderRow";

type OrderListProps = {
  orders: OrderBookData[];
  isAsk: boolean;
  maxTotal: number;
  currency: string;
  hideScrollbar?: boolean;
  highlightedPrices?: Set<string>;
  openOrderPriceKeys?: Set<string>;
  compact?: boolean;
};

export const OrderList: React.FC<OrderListProps> = ({
  orders,
  isAsk,
  maxTotal,
  currency,
  highlightedPrices,
  openOrderPriceKeys,
  compact = false,
}) => {
  const displayOrders = useMemo(
    () => (isAsk ? [...orders].reverse() : orders),
    [isAsk, orders],
  );

  return (
    <View className="gap-1">
      {displayOrders.map((order) => (
        <OrderRow
          key={`${isAsk ? "ask" : "bid"}-${order.price}`}
          order={order}
          isAsk={isAsk}
          maxTotal={maxTotal}
          currency={currency}
          isHighlighted={highlightedPrices?.has(order.price)}
          isUserOrder={openOrderPriceKeys?.has(order.price)}
          compact={compact}
        />
      ))}
    </View>
  );
};
