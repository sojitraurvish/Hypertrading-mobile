import "event-target-polyfill";
import "fast-text-encoding";

if (typeof globalThis.CustomEvent === "undefined") {
  const CustomEventPolyfill = function CustomEvent<T = unknown>(
    type: string,
    params?: CustomEventInit<T>,
  ) {
    const event = new Event(type, params) as Event & { detail: T };
    event.detail = params?.detail as T;
    return event;
  };

  globalThis.CustomEvent = CustomEventPolyfill as unknown as typeof CustomEvent;
}
