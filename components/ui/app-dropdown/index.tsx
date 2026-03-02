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
          className={`h-10 px-3 rounded-xl border flex-row items-center justify-between ${
            open
              ? "bg-bg-quaternary-dark border-[#78f39a]/45"
              : "bg-bg-quaternary-dark/80 border-border-primary-dark/70"
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
            color="#94a3b8"
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
            className="rounded-xl bg-bg-quaternary-dark border border-border-primary-dark/70 overflow-hidden z-30"
          >
            {options.map((option) => (
              <AppButton
                key={option.value}
                variant={VARIANT_TYPES.NOT_SELECTED}
                className={
                  option.value === value
                    ? "h-10 px-3 bg-bg-quaternary-dark flex-row items-center justify-between border-b border-border-primary-dark/40 last:border-b-0"
                    : "h-10 px-3 bg-bg-quaternary-dark/95 flex-row items-center justify-between border-b border-border-primary-dark/40 last:border-b-0"
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
                      ? "text-[12px] text-text-primary-dark font-semibold"
                      : "text-[12px] text-text-tertiary-dark font-semibold"
                  }
                >
                  {option.label}
                </AppText>
                {option.value === value ? (
                  <Feather name="check" size={13} color="#78f39a" />
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
