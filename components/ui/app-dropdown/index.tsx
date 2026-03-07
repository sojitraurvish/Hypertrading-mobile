import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { VARIANT_TYPES } from "@/lib/constants";
import { Feather } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { Modal, Pressable, View, useWindowDimensions } from "react-native";

type DropdownOption = {
  label: string;
  value: string;
};

type AppDropdownProps = {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  className?: string;
};

export const AppDropdown: React.FC<AppDropdownProps> = ({
  value,
  options,
  onChange,
  className = "",
}) => {
  const [open, setOpen] = useState(false);
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
  const selected = options.find((option) => option.value === value);
  const toggleOpen = () => {
    if (open) {
      setOpen(false);
      return;
    }
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      const minWidth = Math.max(72, width);
      const left = Math.max(8, Math.min(x + width - minWidth, screenWidth - minWidth - 8));
      const top = y + height + 4;
      setMenuPosition({ top, left, minWidth });
      setOpen(true);
    });
  };

  return (
    <View className={`relative ${className}`}>
      <View ref={triggerRef} collapsable={false}>
        <AppButton
          variant={VARIANT_TYPES.NOT_SELECTED}
          className={`h-10 px-3.5 rounded-xl border flex-row items-center justify-between ${
            open
              ? "bg-bg-quaternary-dark border-accent-green/25"
              : "bg-bg-quaternary-dark border-border-primary-dark/30"
          }`}
          onPress={toggleOpen}
        >
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-[12px] text-text-primary-dark font-semibold mr-2"
          >
            {selected?.label ?? value}
          </AppText>
          <Feather
            name={open ? "chevron-up" : "chevron-down"}
            size={14}
            color="#6b7280"
          />
        </AppButton>
      </View>
      {open ? (
        <Modal
          transparent
          visible={open}
          animationType="none"
          onRequestClose={() => setOpen(false)}
        >
          <Pressable
            style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
            onPress={() => setOpen(false)}
          />
          <View
            style={{
              position: "absolute",
              top: menuPosition.top,
              left: menuPosition.left,
              minWidth: menuPosition.minWidth,
            }}
            className="rounded-2xl bg-bg-quaternary-dark border border-border-primary-dark/30 overflow-hidden z-30"
          >
            {options.map((option) => (
              <AppButton
                key={option.value}
                variant={VARIANT_TYPES.NOT_SELECTED}
                className={
                  option.value === value
                    ? "h-11 px-3.5 bg-accent-green/8 flex-row items-center justify-between border-b border-border-primary-dark/25 last:border-b-0"
                    : "h-11 px-3.5 bg-bg-quaternary-dark flex-row items-center justify-between border-b border-border-primary-dark/25 last:border-b-0"
                }
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className={
                    option.value === value
                      ? "text-[13px] text-text-primary-dark font-semibold"
                      : "text-[13px] text-text-tertiary-dark font-medium"
                  }
                >
                  {option.label}
                </AppText>
                {option.value === value ? (
                  <Feather name="check" size={13} color="#4ade80" />
                ) : null}
              </AppButton>
            ))}
          </View>
        </Modal>
      ) : null}
    </View>
  );
};

export default AppDropdown;
