import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size?: number;
  color?: string;
};

const OfframpIcon: React.FC<Props> = ({
  size = 24,
  color = "currentColor",
}) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Container (U-shaped wallet) */}
      <Path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
      {/* Arrow pointing up out of container */}
      <Path d="M12 17V5" />
      <Path d="M8 9l4-4 4 4" />
    </Svg>
  );
};

export default OfframpIcon;
