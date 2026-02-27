import "event-target-polyfill";
import "fast-text-encoding";

type EventInitLike = {
  bubbles?: boolean;
  cancelable?: boolean;
  composed?: boolean;
};

type CustomEventInitLike<T = unknown> = EventInitLike & {
  detail?: T;
};

type EventCtor = new (type: string, options?: EventInitLike) => Event;
type CustomEventCtor = new <T = unknown>(
  type: string,
  options?: CustomEventInitLike<T>,
) => CustomEvent<T>;

// Use React Native's internal Event constructor when available so events pass
// RN's strict `event instanceof Event` check in EventTarget.dispatchEvent.
const getReactNativeEventCtor = (): EventCtor | undefined => {
  try {
    return require("react-native/src/private/webapis/dom/events/Event")
      .default as EventCtor;
  } catch {
    return undefined;
  }
};

const getReactNativeCustomEventCtor = (): CustomEventCtor | undefined => {
  try {
    return require("react-native/src/private/webapis/dom/events/CustomEvent")
      .default as CustomEventCtor;
  } catch {
    return undefined;
  }
};

const ReactNativeEvent = getReactNativeEventCtor();
if (typeof ReactNativeEvent === "function") {
  // Force RN's Event so dispatchEvent instanceof checks pass reliably.
  globalThis.Event = ReactNativeEvent as unknown as typeof Event;
}

const ReactNativeCustomEvent = getReactNativeCustomEventCtor();
if (typeof ReactNativeCustomEvent === "function") {
  // Force RN's CustomEvent for libraries that dispatch custom events.
  globalThis.CustomEvent = ReactNativeCustomEvent as typeof CustomEvent;
} else if (typeof globalThis.CustomEvent !== "function") {
  const EventConstructor = ReactNativeEvent ?? globalThis.Event;

  if (typeof EventConstructor === "function") {
    class CustomEventPolyfill<T = unknown> extends (EventConstructor as EventCtor) {
      detail: T | null;

      constructor(type: string, params?: CustomEventInitLike<T>) {
        super(type, params);
        this.detail = (params?.detail ?? null) as T | null;
      }
    }

    globalThis.CustomEvent =
      CustomEventPolyfill as unknown as typeof CustomEvent;
  }
}
