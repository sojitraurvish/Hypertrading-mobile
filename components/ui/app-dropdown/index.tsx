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
          className="px-2 py-1 rounded-md bg-[#0f0f0f] border border-border-primary-dark/60 flex-row items-center"
          onPress={toggleOpen}
        >
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-[11px] text-text-primary-dark font-semibold mr-1"
          >
            {selected?.label ?? value}
          </AppText>
          <Feather
            name={open ? "chevron-up" : "chevron-down"}
            size={12}
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
            className="rounded-md bg-[#0f0f0f] border border-border-primary-dark/60 overflow-hidden z-30"
          >
            {options.map((option) => (
              <AppButton
                key={option.value}
                variant={VARIANT_TYPES.NOT_SELECTED}
                className={
                  option.value === value
                    ? "px-2 py-2 bg-[#151515]"
                    : "px-2 py-2 bg-[#0f0f0f]"
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
                      ? "text-[10px] text-text-primary-dark font-semibold"
                      : "text-[10px] text-text-tertiary-dark font-semibold"
                  }
                >
                  {option.label}
                </AppText>
              </AppButton>
            ))}
          </View>
        </Modal>
      ) : null}
    </View>
  );
};

export default AppDropdown;
