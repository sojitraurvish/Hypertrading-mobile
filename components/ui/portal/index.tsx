import React from "react";
import { Modal, Pressable, View } from "react-native";

import { cn } from "@/lib/utils/tailwind-configs";

type PortalProps = {
  children: React.ReactNode;
  visible: boolean;
  className?: string;
  animationType?: "none" | "slide" | "fade";
  overlay?: boolean;
  overlayClassName?: string;
  closeOnOutsideClick?: boolean;
  onClose?: () => void;
};

export const Portal: React.FC<PortalProps> = ({
  children,
  visible,
  className = "",
  animationType = "fade",
  overlay = false,
  overlayClassName = "",
  closeOnOutsideClick = false,
  onClose,
}) => {
  const handleOverlayClick = () => {
    if (closeOnOutsideClick) {
      onClose?.();
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType={animationType}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        className={cn(
          "flex-1",
          overlay ? "bg-black/60" : "bg-transparent",
          overlayClassName,
        )}
        onPress={handleOverlayClick}
      >
        <Pressable
          className={cn("relative h-full w-full", className)}
          onPress={() => {}}
        >
          <View className="flex-1">{children}</View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default Portal;
