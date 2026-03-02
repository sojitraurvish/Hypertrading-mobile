import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import Portal from "@/components/ui/portal";
import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils/tailwind-configs";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { PanResponder, View } from "react-native";

type AppDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: React.ReactNode;
  showHandle?: boolean;
  showCloseButton?: boolean;
  closeOnOutsideClick?: boolean;
  enableSwipeDownToClose?: boolean;
  className?: string;
  contentClassName?: string;
};

export const AppDrawer: React.FC<AppDrawerProps> = ({
  isOpen,
  onClose,
  children,
  title,
  showHandle = true,
  showCloseButton = true,
  closeOnOutsideClick = true,
  enableSwipeDownToClose = true,
  className = "",
  contentClassName = "",
}) => {
  const swipeCloseResponder = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          if (!enableSwipeDownToClose) return false;
          const { dx, dy } = gestureState;
          return dy > 6 && Math.abs(dy) > Math.abs(dx) * 1.2;
        },
        onPanResponderRelease: (_, gestureState) => {
          if (!enableSwipeDownToClose) return;
          if (gestureState.dy > 80 || gestureState.vy > 0.95) {
            onClose();
          }
        },
      }),
    [enableSwipeDownToClose, onClose],
  );

  if (!isOpen) return null;

  return (
    <Portal
      visible={isOpen}
      onClose={onClose}
      animationType="slide"
      overlay
      closeOnOutsideClick={closeOnOutsideClick}
      overlayClassName="bg-black/70"
      className="flex-1 justify-end"
    >
      <View className="flex-1 justify-end">
        <View
          className={cn(
            "rounded-t-3xl border border-border-primary-dark/70 bg-bg-secondary-dark px-4 pb-6 pt-3",
            className,
          )}
        >
          <View {...swipeCloseResponder.panHandlers}>
            {showHandle ? (
              <View className="w-10 h-1 rounded-full bg-bg-quinary-dark self-center mb-4" />
            ) : null}
          </View>

          {(title || showCloseButton) && (
            <View className="flex-row items-center justify-between mb-4" {...swipeCloseResponder.panHandlers}>
              {title ? (
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="text-[28px] font-extrabold text-text-primary-dark uppercase"
                >
                  {title}
                </AppText>
              ) : (
                <View />
              )}

              {showCloseButton ? (
                <AppButton
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  onPress={onClose}
                  className="w-9 h-9 rounded-full bg-bg-quaternary-dark items-center justify-center"
                  accessibilityLabel="Close drawer"
                >
                  <Feather name="x" size={16} color="#64748b" />
                </AppButton>
              ) : null}
            </View>
          )}

          <View className={contentClassName}>{children}</View>
        </View>
      </View>
    </Portal>
  );
};

export default AppDrawer;
