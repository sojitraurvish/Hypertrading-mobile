import { Feather } from "@expo/vector-icons";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
const EXIT_ANIMATION_DURATION = 300;
let toastId = 0;

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "bg-[#0b1512] border border-green-400/30",
  error: "bg-[#180d12] border border-red-400/32",
  info: "bg-[#0b1320] border border-blue-400/30",
  warning: "bg-[#1b1509] border border-amber-400/30",
  notification: "bg-[#0f1520] border border-slate-300/24",
  loading: "bg-[#0a1712] border border-emerald-400/28",
};

const TITLE_STYLES: Record<ToastVariant, string> = {
  success: "text-green-300",
  error: "text-red-300",
  info: "text-blue-300",
  warning: "text-amber-300",
  notification: "text-slate-200",
  loading: "text-emerald-300",
};

const MESSAGE_STYLES: Record<ToastVariant, string> = {
  success: "text-[#c7d2fe]",
  error: "text-[#e2e8f0]",
  info: "text-[#dbeafe]",
  warning: "text-[#fef3c7]",
  notification: "text-[#e2e8f0]",
  loading: "text-[#dcfce7]",
};

const ICON_BG_STYLES: Record<ToastVariant, string> = {
  success: "bg-green-400/12",
  error: "bg-red-400/14",
  info: "bg-blue-400/14",
  warning: "bg-yellow-400/14",
  notification: "bg-slate-300/12",
  loading: "bg-emerald-300/14",
};

const ICON_COLORS: Record<ToastVariant, string> = {
  success: "#22C55E",
  error: "#F87171",
  info: "#60A5FA",
  warning: "#F59E0B",
  notification: "#CBD5E1",
  loading: "#34D399",
};

const ACCENT_STYLES: Record<ToastVariant, string> = {
  success: "bg-green-400",
  error: "bg-red-400",
  info: "bg-blue-400",
  warning: "bg-amber-400",
  notification: "bg-slate-300",
  loading: "bg-emerald-400",
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

const LoadingIndicator = () => (
  <ActivityIndicator size="small" color="#4ADE80" />
);

const ToastIcon: React.FC<{ variant: ToastVariant }> = ({ variant }) => {
  if (variant === "loading") {
    return <LoadingIndicator />;
  }

  const iconName: Record<
    Exclude<ToastVariant, "loading">,
    "check-circle" | "x-circle" | "info" | "alert-triangle" | "bell"
  > = {
    success: "check-circle",
    error: "x-circle",
    info: "info",
    warning: "alert-triangle",
    notification: "bell",
  };

  return (
    <Feather name={iconName[variant]} size={16} color={ICON_COLORS[variant]} />
  );
};

export const AppToast: React.FC<AppToastProps> = ({
  position = DEFAULT_POSITION,
}) => {
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastsRef = useRef<ToastItem[]>([]);
  const timeoutMap = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const animatedMap = useRef<
    Record<string, { opacity: Animated.Value; translateY: Animated.Value }>
  >({});
  const [containerWidth, setContainerWidth] = useState(0);

  const getAnimatedValues = useCallback(
    (toast: Pick<ToastItem, "id" | "position">) => {
      const existing = animatedMap.current[toast.id];
      if (existing) return existing;

      const fromTop = toast.position.startsWith("top");
      const values = {
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(fromTop ? -12 : 12),
      };
      animatedMap.current[toast.id] = values;
      return values;
    },
    [],
  );

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
          duration: EXIT_ANIMATION_DURATION,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(values.translateY, {
          toValue: toOffset,
          duration: EXIT_ANIMATION_DURATION,
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
        setToasts((current) => {
          const samePositionToasts = current.filter(
            (toast) => toast.position === nextToast.position,
          );
          if (samePositionToasts.length < 2) {
            return [...current, nextToast];
          }

          const oldestId = samePositionToasts[0]?.id;
          if (!oldestId) return [...current, nextToast];

          if (timeoutMap.current[oldestId]) {
            clearTimeout(timeoutMap.current[oldestId]);
            delete timeoutMap.current[oldestId];
          }
          delete animatedMap.current[oldestId];

          return [
            ...current.filter((toast) => toast.id !== oldestId),
            nextToast,
          ];
        });
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
    <Modal transparent statusBarTranslucent animationType="none" visible>
      <View style={StyleSheet.absoluteFillObject}>
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={() => appToast.dismiss()}
          accessibilityRole="button"
          accessibilityLabel="Dismiss toast notifications"
        />
        <View
          pointerEvents="box-none"
          className={containerClassName}
          style={[styles.overlayContainer, containerStyle]}
          onLayout={onContainerLayout}
        >
          {positionedToasts.map((toast) => (
            <Animated.View
              key={toast.id}
              className={cn(
                "mb-2.5 overflow-hidden rounded-2xl px-3 py-3.5 flex-row gap-2.5",
                toast.title ? "items-start" : "items-center",
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
                  "absolute left-0 top-0 bottom-0 w-[3px]",
                  ACCENT_STYLES[toast.variant],
                )}
              />
              <View
                className={cn(
                  "w-7 h-7 rounded-full items-center justify-center self-center",
                  toast.title ? "mt-0.5" : "",
                  ICON_BG_STYLES[toast.variant],
                )}
              >
                <ToastIcon variant={toast.variant} />
              </View>

              <View
                className={cn(
                  "flex-1 self-center",
                  toast.title ? "" : "min-h-7 justify-center",
                )}
              >
                {toast.title ? (
                  <AppText
                    className={cn(
                      "text-[13px] leading-[16px] font-semibold",
                      TITLE_STYLES[toast.variant],
                    )}
                  >
                    {toast.title}
                  </AppText>
                ) : null}

                {toast.message ? (
                  <AppText
                    className={cn(
                      "text-[13px] font-medium",
                      toast.title ? "leading-[18px]" : "leading-4",
                      toast.title ? "mt-0.5" : "",
                      MESSAGE_STYLES[toast.variant],
                    )}
                    style={[
                      styles.toastMessageText,
                      !toast.title ? styles.singleLineMessageText : null,
                    ]}
                    numberOfLines={toast.title ? undefined : 1}
                    ellipsizeMode="tail"
                  >
                    {toast.message}
                  </AppText>
                ) : null}
              </View>

              <Pressable
                onPress={() => appToast.dismiss(toast.id)}
                className={cn(
                  "w-7 h-7 rounded-full items-center justify-center self-center bg-black/25 border border-white/10",
                  toast.title ? "mt-0.5" : "",
                )}
                hitSlop={8}
                disabled={toast.isExiting}
              >
                <Feather name="x" size={14} color="#9CA3AF" />
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    // Ensure toast overlay renders above other absolute/fixed layers.
    zIndex: 99999,
    elevation: 99999,
  },
  toastShadow: {
    shadowColor: "#000",
    shadowOpacity: Platform.OS === "ios" ? 0.24 : 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  toastMessageText: {
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  singleLineMessageText: {
    paddingTop: 0,
    paddingBottom: 0,
  },
});

export default AppToast;
