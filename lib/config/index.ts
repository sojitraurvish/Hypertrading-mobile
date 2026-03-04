import { ENVIRONMENT, ENVIRONMENT_TYPES } from "../constants";

export const DEFAULT_LANGUAGE = "en";

export const API_BASE_URL = `http://localhost:9000`;

export const jwtToken =
  "Bearer " +
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OGI1YmNiODE4ZDA5YTBjMWIwY2Y0ZSIsImlhdCI6MTc1NDA1MTIxOCwiZXhwIjoxNzU2NjQzMjE4fQ.GF3h2xAwvr-PegUXXbX7rLFrA4BTkbC4NKatt3vbScg";

export const APP_NAME = "Hyper Trading";

export const OG_TITLE = "Hyper Trading | Advanced Hyperliquid Trading Platform";
export const OG_DESC = `Professional trading platform for Hyperliquid. Execute trades, monitor positions, and manage your portfolio with advanced tools and real-time market data.`;
export const KEYWORDS = `hyperliquid, crypto trading, perpetual futures, decentralized exchange, trading platform, crypto derivatives`;
export const FB_APP_ID = "";

export const isTestnet = ENVIRONMENT === ENVIRONMENT_TYPES.DEVELOPMENT;

// Hyperliquid App URLs - dynamically based on environment
export const WEB_URL = isTestnet
  ? "https://app.hyperliquid-testnet.xyz"
  : "https://app.hyperliquid.xyz";

// Hyperliquid API URLs - dynamically based on environment
export const HYPERLIQUID_API_URL = isTestnet
  ? "https://api.hyperliquid-testnet.xyz/exchange"
  : "https://api.hyperliquid.xyz/exchange";

// Hyperliquid WebSocket URLs - dynamically based on environment
export const HYPERLIQUID_WS_URL = isTestnet
  ? "wss://api.hyperliquid-testnet.xyz/ws"
  : "wss://api.hyperliquid.xyz/ws";

// Hyperliquid App Routes
export const EXPLORER_URL = `${WEB_URL}/explorer`;
export const EXPLORER_TX_URL = `${EXPLORER_URL}/tx`;
export const HISTORICAL_ORDERS_URL = `${WEB_URL}/historicalOrders`;
export const FUNDING_HISTORY_URL = `${WEB_URL}/fundingHistory`;
export const TRADE_HISTORY_URL = `${WEB_URL}/tradeHistory`;
export const REFERRAL_URL = `${WEB_URL}/referral`;

const COIN_ICON_BASE_URL =
  "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color";
const COINCAP_ICON_BASE_URL = "https://static.coincap.io/assets/icons";

const normalizeCoinSymbol = (symbol: string): string =>
  symbol
    .split("-")[0]
    .split("/")[0]
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();

const getCoinSymbolAliases = (normalizedSymbol: string): string[] => {
  const aliases = new Set<string>([normalizedSymbol]);
  const noLeadingDigits = normalizedSymbol.replace(/^\d+/, "");

  if (noLeadingDigits) {
    aliases.add(noLeadingDigits);
  }

  return Array.from(aliases);
};

// Coin Icon URL Helper - uses static PNG icons for React Native reliability.
export const getCoinIconUrl = (symbol: string): string => {
  const normalizedSymbol = normalizeCoinSymbol(symbol);
  return `${COIN_ICON_BASE_URL}/${normalizedSymbol}.png`;
};

// Returns prioritized PNG URLs. Consumer should try these in order.
export const getCoinIconUrls = (symbol: string): string[] => {
  const normalizedSymbol = normalizeCoinSymbol(symbol);
  const aliases = getCoinSymbolAliases(normalizedSymbol);

  // Keep the fastest/static CDNs first. Slow or missing sources should be last.
  return aliases.flatMap((baseSymbol) => {
    const candidates = [
      `${COINCAP_ICON_BASE_URL}/${baseSymbol}@2x.png`,
      `${COIN_ICON_BASE_URL}/${baseSymbol}.png`,
      `${WEB_URL}/coins/${baseSymbol}.png`,
    ];

    return Array.from(new Set(candidates));
  });
};

// SEO Images - All images are in /public/images/
// Note: These are relative paths. Use getAbsoluteUrl() helper for absolute URLs
export const DESK_LOGO = "/images/logo.svg"; // Main logo (SVG format)
export const OG_IMAGE = "/images/og-image.svg"; // Open Graph image (1200x630px recommended, SVG format)
export const SMALL_LOGO = "/images/logo.svg"; // Small logo variant
// Note: SEO_LOGO should use getAbsoluteUrl() helper - do not use WEB_URL (that's for Hyperliquid app, not this site)

// Favicon - Using SVG favicon (modern browsers support SVG favicons)
export const FavIcon = "/images/favicon.svg"; // SVG favicon (fallback to /favicon.ico if needed)

// External URLs
export const EXTERNAL_URLS = {
  // Social Media
  TWITTER: "https://twitter.com",
  DISCORD: "https://discord.com",
  GITHUB: "https://github.com",
  LINKEDIN: "https://www.linkedin.com/company/hypertrading",

  // Support
  SUPPORT_EMAIL: "mailto:support@hypertrading.com",

  // Wallets
  METAMASK_DOWNLOAD: "https://metamask.io/download/",
  METAMASK_ICON:
    "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg",
  ETHEREUM_WALLETS: "https://ethereum.org/en/wallets/find-wallet/",
} as const;

// Application Routes
export const ROUTES = {
  HOME: "/",
  TRADE: "/trade",
  MARKETS: "/markets",
  VAULTS: "/vaults",
  STAKING: "/staking",
  PORTFOLIO: "/portfolio",
  REFERRALS: "/referrals",
  LEADERBOARD: "/leaderboard",
  DOCS: "/docs",
  BLOG: "/blog",
  FAQ: "/faq",
  SUPPORT: "/support",
  STATUS: "/status",
  ABOUT: "/about",
  CAREERS: "/careers",
  CONTACT: "/contact",
  PRESS: "/press",
  TERMS: "/terms",
  PRIVACY: "/privacy",
  COOKIES: "/cookies",
  FEES: "/fees",
} as const;

export const SEO_SCHEMA = {
  CONTEXT: "http://schema.org",
  TYPE: "Organization",
  NAME: APP_NAME,
  CONTACT_POINT: {
    TYPE: "ContactPoint",
    TELEPHONE: "+1-800-HYPER-TRD",
    CONTACT_TYPE: "Customer Service",
  },
  SAME_AS: [EXTERNAL_URLS.LINKEDIN, EXTERNAL_URLS.TWITTER],
  TYPE_PRIMARY: "WebSite",
  TYPE_SECONDARY: "FAQPage",
  TYPE_TERTIARY: "Question",
  TYPE_QUATERNARY: "Answer",
  POTENTIAL_ACTION: {
    TYPE: "SearchAction",
    TARGET: "{search_term_string}",
    QUERY_INPUT: "required name=search_term_string",
  },
};

export const BUILDER_CONFIG = {
  BUILDER_FEE_ADDRESS:
    "0xb5789FbdA5C37267781Df8baD3738E911D5F500d" as `0x${string}`,
  BUILDER_FEE_RATE: 100,
} as const;
