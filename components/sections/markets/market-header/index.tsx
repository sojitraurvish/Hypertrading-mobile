import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils/tailwind-configs";
import React, { useRef, useEffect } from "react";
import { View, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";
import { AppText } from "@/components/ui/app-text";
import { AppButton } from "@/components/ui/app-button";

const VARIANTS = {
  [VARIANT_TYPES.NOT_SELECTED]: "",
  [VARIANT_TYPES.PRIMARY]: "mx-4 mt-4",
} as const;

type VariantKeys = keyof typeof VARIANTS;

type Props = {
  variant?: VariantKeys;
  title?: string;
  subtitle?: string;
  isSearching?: boolean;
  searchQuery?: string;
  onSearchToggle?: () => void;
  onSearchChange?: (query: string) => void;
  className?: string;
};

export const MarketHeader: React.FC<Props> = ({
  variant = VARIANT_TYPES.PRIMARY,
  title = "Markets",
  subtitle = "REAL-TIME LIQUID HUB",
  isSearching = false,
  searchQuery = "",
  onSearchToggle,
  onSearchChange,
  className = "",
}) => {
  const baseClassName = VARIANTS[variant] || "";
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isSearching) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isSearching]);

  return (
    <View className={cn(baseClassName, className)}>
      {isSearching ? (
        <View className="flex-row items-center gap-3">
          <View className="flex-1 flex-row items-center bg-bg-quaternary-dark rounded-xl px-3 h-11">
            <Feather name="search" size={16} color="#6b7280" />
            <TextInput
              ref={inputRef}
              value={searchQuery}
              onChangeText={onSearchChange}
              placeholder="Search markets..."
              placeholderTextColor="#6b7280"
              autoCapitalize="characters"
              autoCorrect={false}
              className="flex-1 ml-2 text-sm text-white font-medium"
              selectionColor="#50fa7b"
            />
            {searchQuery.length > 0 && (
              <AppButton
                variant={VARIANT_TYPES.NOT_SELECTED}
                onPress={() => onSearchChange?.("")}
                className="p-1"
              >
                <Feather name="x" size={16} color="#6b7280" />
              </AppButton>
            )}
          </View>
          <AppButton
            variant={VARIANT_TYPES.NOT_SELECTED}
            onPress={onSearchToggle}
            className="py-2"
          >
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="text-text-tertiary-dark text-sm font-medium"
            >
              Cancel
            </AppText>
          </AppButton>
        </View>
      ) : (
        <View className="flex-row items-start justify-between">
          <View>
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="text-text-primary-dark text-3xl font-black"
            >
              {title}
            </AppText>
            <AppText
              variant={VARIANT_TYPES.NONARY}
              className="text-[10px] mt-1"
            >
              {subtitle}
            </AppText>
          </View>

          <AppButton
            variant={VARIANT_TYPES.QUATERNARY}
            className="w-10 h-10 items-center justify-center bg-bg-quaternary-dark rounded-xl"
            onPress={onSearchToggle}
          >
            <Feather name="search" size={20} color="#9ca3af" />
          </AppButton>
        </View>
      )}
    </View>
  );
};

export default MarketHeader;
