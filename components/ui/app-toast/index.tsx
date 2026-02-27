import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { AppText } from "@/components/ui/app-text";
import { cn } from "@/lib/utils/tailwind-configs";

type ToastVariant =
  | "success"
  | "error"
  | "info"
  | "warning"
  | "notification"
  | "loading";

type ToastPosition =
  | "top-left"
  | "top-right"
  | "top-center"
  | "bottom-left"
  | "bottom-right"
  | "bottom-center";

type ToastContent = {
  title?: string;
  message?: string;
};

export type AppToastOptions = {
  duration?: number;
  position?: ToastPosition;
};

type ToastItem = ToastContent & {
  id: string;
  variant: ToastVariant;
  position: ToastPosition;
  duration: number | null;
  isExiting: boolean;
};

type ToastEvent =
  | { type: "show"; toast: Omit<ToastItem, "isExiting"> }
  | {
      type: "update";
      id: string;
      content: ToastContent;
      options?: AppToastOptions & { variant?: ToastVariant };
    }
  | { type: "dismiss"; id?: string };

type ToastListener = (event: ToastEvent) => void;

const listeners = new Set<ToastListener>();
const DEFAULT_DURATION = 4500;
const DEFAULT_POSITION: ToastPosition = "top-center";
let toastId = 0;

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "bg-bg-secondary-dark border border-green-500/25",
  error: "bg-bg-secondary-dark border border-red-500/25",
  info: "bg-bg-secondary-dark border border-border-secondary-dark",
  warning: "bg-bg-secondary-dark border border-yellow-500/25",
  notification: "bg-bg-secondary-dark border border-border-secondary-dark",
  loading: "bg-bg-secondary-dark border border-border-secondary-dark",
};

const TITLE_STYLES: Record<ToastVariant, string> = {
  success: "text-green-400",
  error: "text-red-400",
  info: "text-text-primary-dark",
  warning: "text-yellow-400",
  notification: "text-text-primary-dark",
  loading: "text-text-primary-dark",
};

const MESSAGE_STYLES: Record<ToastVariant, string> = {
  success: "text-text-secondary-dark",
  error: "text-text-secondary-dark",
  info: "text-text-secondary-dark",
  warning: "text-text-secondary-dark",
  notification: "text-text-secondary-dark",
  loading: "text-text-secondary-dark",
};

const ICON_BG_STYLES: Record<ToastVariant, string> = {
  success: "bg-green-500/15",
  error: "bg-red-500/15",
  info: "bg-blue-500/15",
  warning: "bg-yellow-500/15",
  notification: "bg-gray-500/20",
  loading: "bg-green-500/15",
};

const ICON_COLORS: Record<ToastVariant, string> = {
  success: "#4ADE80",
  error: "#F87171",
  info: "#60A5FA",
  warning: "#FACC15",
  notification: "#D1D5DB",
  loading: "#4ADE80",
};

const emit = (event: ToastEvent) => {
  listeners.forEach((listener) => listener(event));
};

const subscribe = (listener: ToastListener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const parseContent = (content: string | ToastContent): ToastContent =>
  typeof content === "string" ? { message: content } : content;

const nextToastId = () => {
  toastId += 1;
  return `toast-${Date.now()}-${toastId}`;
};

const showToast = (
  variant: ToastVariant,
  content: string | ToastContent,
  options?: AppToastOptions & { autoClose?: boolean },
) => {
  const id = nextToastId();
  const parsed = parseContent(content);
  const autoClose =
    options?.autoClose ?? (variant === "loading" ? false : true);
  const duration = autoClose ? (options?.duration ?? DEFAULT_DURATION) : null;

  emit({
    type: "show",
    toast: {
      id,
      variant,
      title: parsed.title,
      message: parsed.message,
      position: options?.position ?? DEFAULT_POSITION,
      duration,
    },
  });

  return id;
};

export const appToast = {
  success: (content: string | ToastContent, options?: AppToastOptions) =>
    showToast("success", content, options),
  error: (content: string | ToastContent, options?: AppToastOptions) =>
    showToast("error", content, options),
  info: (content: string | ToastContent, options?: AppToastOptions) =>
    showToast("info", content, options),
  warning: (content: string | ToastContent, options?: AppToastOptions) =>
    showToast("warning", content, options),
  notification: (content: string | ToastContent, options?: AppToastOptions) =>
    showToast("notification", content, options),
  loading: (content: string | ToastContent, options?: AppToastOptions) =>
    showToast("loading", content, { ...options, autoClose: false }),
  update: (
    id: string,
    content: string | ToastContent,
    options?: AppToastOptions & { variant?: ToastVariant },
  ) => {
    emit({
      type: "update",
      id,
      content: parseContent(content),
      options,
    });
  },
  dismiss: (id?: string) => {
    emit({ type: "dismiss", id });
  },
};

type AppToastProps = {
  position?: ToastPosition;
};

const getContainerAlignment = (position: ToastPosition) => {
  if (position.endsWith("left")) {
    return "items-start";
  }
  if (position.endsWith("center")) {
    return "items-center";
  }
  return "items-end";
};

const getContainerPositionStyle = (
  position: ToastPosition,
  topInset: number,
  bottomInset: number,
) => {
  const isTop = position.startsWith("top");

  return {
    top: isTop ? topInset + 12 : undefined,
    bottom: isTop ? undefined : bottomInset + 12,
  };
};

const LoadingIndicator = () => <ActivityIndicator size="small" color="#4ADE80" />;

const ToastIcon: React.FC<{ variant: ToastVariant }> = ({ variant }) => {
  if (variant === "loading") {
    return <LoadingIndicator />;
  }

  const iconName: Record<Exclude<ToastVariant, "loading">, "check-circle" | "x-circle" | "info" | "alert-triangle" | "bell"> =
    {
      success: "check-circle",
      error: "x-circle",
      info: "info",
      warning: "alert-triangle",
      notification: "bell",
    };

  return <Feather name={iconName[variant]} size={16} color={ICON_COLORS[variant]} />;
};

export const AppToast: React.FC<AppToastProps> = ({ position = DEFAULT_POSITION }) => {
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastsRef = useRef<ToastItem[]>([]);
  const timeoutMap = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const animatedMap = useRef<
    Record<string, { opacity: Animated.Value; translateY: Animated.Value }>
  >({});
  const [containerWidth, setContainerWidth] = useState(0);

  const getAnimatedValues = useCallback((toast: Pick<ToastItem, "id" | "position">) => {
    const existing = animatedMap.current[toast.id];
    if (existing) return existing;

    const fromTop = toast.position.startsWith("top");
    const values = {
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(fromTop ? -12 : 12),
    };
    animatedMap.current[toast.id] = values;
    return values;
  }, []);

  const animateInToast = useCallback(
    (toast: Pick<ToastItem, "id" | "position">) => {
      const values = getAnimatedValues(toast);
      const fromTop = toast.position.startsWith("top");

      values.opacity.setValue(0);
      values.translateY.setValue(fromTop ? -12 : 12);

      Animated.parallel([
        Animated.timing(values.opacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(values.translateY, {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    },
    [getAnimatedValues],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    if (timeoutMap.current[id]) {
      clearTimeout(timeoutMap.current[id]);
      delete timeoutMap.current[id];
    }
    delete animatedMap.current[id];
  }, []);

  const dismissToast = useCallback(
    (id: string) => {
      const toast = toastsRef.current.find((item) => item.id === id);
      if (!toast || toast.isExiting) return;

      if (timeoutMap.current[id]) {
        clearTimeout(timeoutMap.current[id]);
        delete timeoutMap.current[id];
      }

      setToasts((current) =>
        current.map((item) =>
          item.id === id ? { ...item, isExiting: true } : item,
        ),
      );

      const values = getAnimatedValues(toast);
      const toOffset = toast.position.startsWith("top") ? -8 : 8;

      Animated.parallel([
        Animated.timing(values.opacity, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(values.translateY, {
          toValue: toOffset,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        removeToast(id);
      });
    },
    [getAnimatedValues, removeToast],
  );

  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      if (event.type === "show") {
        const nextToast: ToastItem = { ...event.toast, isExiting: false };
        setToasts((current) => [...current, nextToast]);
        animateInToast(nextToast);
        return;
      }

      if (event.type === "update") {
        setToasts((current) =>
          current.map((toast) => {
            if (toast.id !== event.id) return toast;

            const duration =
              event.options?.duration !== undefined
                ? event.options.duration
                : toast.duration;
            const autoClose = duration !== null && duration >= 0;

            return {
              ...toast,
              ...event.content,
              variant: event.options?.variant ?? toast.variant,
              position: event.options?.position ?? toast.position,
              duration: autoClose ? duration : null,
            };
          }),
        );
        return;
      }

      if (event.id) {
        dismissToast(event.id);
        return;
      }

      toastsRef.current.forEach((toast) => dismissToast(toast.id));
    });

    return () => {
      Object.values(timeoutMap.current).forEach(clearTimeout);
      timeoutMap.current = {};
      animatedMap.current = {};
      unsubscribe();
    };
  }, [animateInToast, dismissToast]);

  useEffect(() => {
    toastsRef.current = toasts;
  }, [toasts]);

  useEffect(() => {
    toasts.forEach((toast) => {
      const hasTimeout = Boolean(timeoutMap.current[toast.id]);
      if (toast.duration === null || hasTimeout || toast.isExiting) return;

      timeoutMap.current[toast.id] = setTimeout(() => {
        dismissToast(toast.id);
      }, toast.duration);
    });

    const activeIds = new Set(toasts.map((toast) => toast.id));
    Object.keys(timeoutMap.current).forEach((id) => {
      if (activeIds.has(id)) return;
      clearTimeout(timeoutMap.current[id]);
      delete timeoutMap.current[id];
    });
  }, [dismissToast, toasts]);

  const positionedToasts = useMemo(
    () => toasts.filter((toast) => toast.position === position),
    [position, toasts],
  );

  if (!positionedToasts.length) return null;

  const containerClassName = cn(
    "absolute left-0 right-0 z-[9999] px-4",
    getContainerAlignment(position),
  );

  const toastWidth = Math.min(560, Math.max(containerWidth - 8, 220));
  const containerStyle = getContainerPositionStyle(
    position,
    insets.top,
    insets.bottom,
  );

  const onContainerLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  return (
    <View
      pointerEvents="box-none"
      className={containerClassName}
      style={containerStyle}
      onLayout={onContainerLayout}
    >
      {positionedToasts.map((toast) => (
        <Animated.View
          key={toast.id}
          className={cn(
            "mb-2 rounded-2xl px-3.5 py-3 flex-row items-start gap-3",
            VARIANT_STYLES[toast.variant],
          )}
          style={[
            styles.toastShadow,
            {
              width: toastWidth,
              opacity:
                animatedMap.current[toast.id]?.opacity ??
                new Animated.Value(1),
              transform: [
                {
                  translateY:
                    animatedMap.current[toast.id]?.translateY ??
                    new Animated.Value(0),
                },
              ],
            },
          ]}
        >
          <View
            className={cn(
              "w-8 h-8 rounded-full items-center justify-center mt-0.5",
              ICON_BG_STYLES[toast.variant],
            )}
          >
            <ToastIcon variant={toast.variant} />
          </View>

          <View className="flex-1">
            {toast.title ? (
              <AppText
                className={cn("text-[13px] font-semibold", TITLE_STYLES[toast.variant])}
              >
                {toast.title}
              </AppText>
            ) : null}

            {toast.message ? (
              <AppText
                className={cn(
                  "text-xs mt-0.5 leading-[17px]",
                  MESSAGE_STYLES[toast.variant],
                )}
              >
                {toast.message}
              </AppText>
            ) : null}
          </View>

          <Pressable
            onPress={() => appToast.dismiss(toast.id)}
            className="w-7 h-7 rounded-full items-center justify-center bg-bg-tertiary-dark"
            hitSlop={8}
            disabled={toast.isExiting}
          >
            <Feather name="x" size={14} color="#9CA3AF" />
          </Pressable>
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  toastShadow: {
    shadowColor: "#000",
    shadowOpacity: Platform.OS === "ios" ? 0.28 : 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});

export default AppToast;
