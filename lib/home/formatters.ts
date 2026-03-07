const numberFormatter = new Intl.NumberFormat("en-US");

export function formatUsd(value: number, maxFractionDigits = 2): string {
  if (!Number.isFinite(value)) return "$0.00";
  return `$${numberFormatter.format(
    Number(value.toFixed(Math.max(0, maxFractionDigits))),
  )}`;
}

export function formatUsdCompact(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return formatUsd(value, 2);
}

export function formatSignedPercent(value: number, fractionDigits = 2): string {
  if (!Number.isFinite(value)) return "0.00%";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(fractionDigits)}%`;
}

export function formatSignedUsd(value: number): string {
  if (!Number.isFinite(value)) return "$0.00";
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatUsd(value, 2)}`;
}

export function parseNumberLoose(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatAgeLabel(timestampMs: number): string {
  const deltaMs = Math.max(0, Date.now() - timestampMs);
  const seconds = Math.floor(deltaMs / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h`;
}
