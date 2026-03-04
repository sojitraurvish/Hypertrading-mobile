import { AppText } from "@/components/ui/app-text";
import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils/tailwind-configs";
import { Slider } from "@miblanchard/react-native-slider";
import React from "react";
import { View } from "react-native";

interface SizeSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const SizeSlider: React.FC<SizeSliderProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2">
        <View className={cn("flex-1 px-1", disabled ? "opacity-50" : "")}>
          <Slider
            value={[value]}
            onValueChange={(vals) => {
              const next = Array.isArray(vals) ? vals[0] : vals;
              if (typeof next === "number") {
                onChange(Math.round(next));
              }
            }}
            minimumValue={0}
            maximumValue={100}
            step={1}
            trackClickable
            disabled={disabled}
            containerStyle={{ marginHorizontal: 0 }}
            minimumTrackTintColor="#66ef7a"
            maximumTrackTintColor="#2a3347"
            thumbTintColor="#66ef7a"
            thumbStyle={{
              width: 20,
              height: 20,
              borderRadius: 10,
              borderWidth: 3,
              borderColor: "#0d1117",
            }}
            trackStyle={{ height: 7, borderRadius: 999 }}
          />
        </View>
        <View
          className={cn(
            "h-8 min-w-[58px] rounded-full border border-border-primary-dark/70 bg-bg-quaternary-dark items-center justify-center px-2",
            disabled ? "opacity-50" : "",
          )}
        >
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-[15px] leading-[18px] text-text-primary-dark font-bold"
            numberOfLines={1}
          >
            {Math.round(value)} %
          </AppText>
        </View>
      </View>
    </View>
  );
};

export default SizeSlider;
