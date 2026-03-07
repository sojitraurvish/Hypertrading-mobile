import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils/tailwind-configs";
import type { TimeInForceOption } from "@/types/trade-order-drawer";
import { Feather } from "@expo/vector-icons";
import React, { useMemo, useRef, useState } from "react";
import { Modal, Pressable, View, useWindowDimensions } from "react-native";

interface TIFDropdownProps {
  value: TimeInForceOption;
  onChange: (value: TimeInForceOption) => void;
  disabled?: boolean;
}

const options: TimeInForceOption[] = ["GTC", "IOC", "ALO"];

const tooltipContent: Record<
  TimeInForceOption,
  { name: string; description: string }
> = {
  GTC: {
    name: "Good Til Cancel",
    description: "will rest until filled or canceled.",
  },
  IOC: {
    name: "Immediate Or Cancel",
    description: "Any portion that is not immediately filled will be canceled.",
  },
  ALO: {
    name: "Add Liquidity Only",
    description:
      "will exist only as a limit order on the book. Also known as post-only.",
  },
};

const TIFDropdown: React.FC<TIFDropdownProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const triggerRef = useRef<View>(null);
  const { width: screenWidth } = useWindowDimensions();
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
    minWidth: number;
  }>({
    top: 0,
    left: 0,
    minWidth: 72,
  });

  const selectedInfo = useMemo(() => tooltipContent[value], [value]);

  const handleToggle = () => {
    if (disabled) return;
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      const minWidth = Math.max(72, width);
      const left = Math.max(
        8,
        Math.min(x + width - minWidth, screenWidth - minWidth - 8),
      );
      const top = y + height + 4;
      setMenuPosition({ top, left, minWidth });
      setIsOpen(true);
    });
  };

  return (
    <View className="relative w-full gap-1.5">
      <View className="flex-row items-center justify-between">
        <AppText
          variant={VARIANT_TYPES.NOT_SELECTED}
          className="text-[11px] text-text-octonary-dark"
        >
          Time In Force
        </AppText>
        <AppButton
          variant={VARIANT_TYPES.NOT_SELECTED}
          isDisabled={disabled}
          onPress={() => setShowTooltip((prev) => !prev)}
          className="h-5 w-5 rounded-full border border-border-primary-dark/20 bg-bg-quaternary-dark/70 items-center justify-center"
          accessibilityLabel="Toggle TIF help"
        >
          <Feather name="info" size={11} color="#6b7280" />
        </AppButton>
      </View>

      {showTooltip && !disabled ? (
        <View className="rounded-xl border border-border-primary-dark/20 bg-bg-quaternary-dark/95 px-3 py-2.5">
          <View className="gap-2.5">
            {options.map((option) => {
              const info = tooltipContent[option];
              return (
                <View key={option}>
                  <AppText
                    variant={VARIANT_TYPES.NOT_SELECTED}
                    className="text-[11px] font-semibold text-text-secondary-dark"
                  >
                    {option} ({info.name})
                  </AppText>
                  <AppText
                    variant={VARIANT_TYPES.NOT_SELECTED}
                    className="text-[11px] text-text-octonary-dark mt-0.5"
                  >
                    {info.description}
                  </AppText>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      <View ref={triggerRef} collapsable={false}>
        <AppButton
          variant={VARIANT_TYPES.NOT_SELECTED}
          onPress={handleToggle}
          isDisabled={disabled}
          className={cn(
            "w-full h-10 rounded-xl border px-3 py-1.5 flex-row items-center justify-between",
            isOpen
              ? "bg-bg-quaternary-dark border-accent-green/30"
              : "bg-bg-quaternary-dark/80 border-border-primary-dark/20",
            disabled ? "opacity-50" : "",
          )}
        >
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-[12px] text-text-primary-dark font-semibold"
          >
            {value}
          </AppText>
          <Feather
            name={isOpen ? "chevron-up" : "chevron-down"}
            size={14}
            color="#6b7280"
          />
        </AppButton>
      </View>

      {isOpen && !disabled ? (
        <Modal
          transparent
          visible={isOpen}
          animationType="none"
          onRequestClose={() => setIsOpen(false)}
        >
          <Pressable
            style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
            onPress={() => setIsOpen(false)}
          />
          <View
            style={{
              position: "absolute",
              top: menuPosition.top,
              left: menuPosition.left,
              minWidth: menuPosition.minWidth,
            }}
            className="rounded-xl bg-bg-quaternary-dark border border-border-primary-dark/20 overflow-hidden z-30"
          >
            {options.map((option) => (
              <AppButton
                key={option}
                variant={VARIANT_TYPES.NOT_SELECTED}
                className={cn(
                  "h-10 px-3 flex-row items-center justify-between border-b border-border-primary-dark/25 last:border-b-0",
                  value === option
                    ? "bg-bg-quaternary-dark"
                    : "bg-bg-quaternary-dark/95",
                )}
                onPress={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
              >
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className={cn(
                    "text-[12px] font-semibold",
                    value === option
                      ? "text-text-primary-dark"
                      : "text-text-tertiary-dark",
                  )}
                >
                  {option}
                </AppText>
                {value === option ? (
                  <Feather name="check" size={13} color="#4ade80" />
                ) : null}
              </AppButton>
            ))}
          </View>
        </Modal>
      ) : null}

      <AppText
        variant={VARIANT_TYPES.NOT_SELECTED}
        className="text-[11px] text-text-octonary-dark"
      >
        {value} ({selectedInfo.name})
      </AppText>
    </View>
  );
};

export default TIFDropdown;
