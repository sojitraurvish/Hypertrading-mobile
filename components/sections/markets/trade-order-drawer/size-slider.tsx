import { AppText } from "@/components/ui/app-text";
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
        <View className={cn("flex-1 py-1", disabled ? "opacity-50" : "")}>
          <Slider
            value={[value]}
            onValueChange={(vals) => {
              const next = Array.isArray(vals) ? vals[0] : vals;
              if (typeof next === "number") {
                onChange(next);
              }
            }}
            minimumValue={0}
            maximumValue={100}
            step={1}
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
        <View className={cn("min-w-12 items-end", disabled ? "opacity-50" : "")}>
          <AppText
            className="text-[11px] text-text-tertiary-dark tabular-nums"
            numberOfLines={1}
          >
            {value} %
          </AppText>
        </View>
      </View>
    </View>
  );
};

export default SizeSlider;
