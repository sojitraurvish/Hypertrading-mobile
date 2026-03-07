import { ConfigContext, ExpoConfig } from "expo/config";

// https://www.youtube.com/watch?v=uKGx3gRrhx0 for more information see this video
const EAS_PROJECT_ID = "b91007df-1c4c-408f-aed5-83ed43adb528";
const PROJECT_SLUG = "hyperliquid-mobile";
const OWNER = "hypertrading";

const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";
const IS_PRODUCTION = process.env.APP_VARIANT === "production";

const ENV_CONFIG = {
  development: {
    name: "HyperPerp (Dev)",
    bundleIdentifier: "com.chainlytics.hypertrading.dev",
    packageName: "com.chainlytics.hypertrading.dev",
    icon: "./assets/images/ios-icon.png",
    adaptiveIcon: "./assets/images/android-icon-dev.png",
    scheme: "app-scheme-dev",
  },
  preview: {
    name: "HyperPerp (Preview)",
    bundleIdentifier: "com.chainalysis.hypertrading.preview",
    packageName: "com.chainlytics.hypertrading.preview",
    icon: "./assets/images/ios-icon.png",
    adaptiveIcon: "./assets/images/android-icon-preview.png",
    scheme: "app-scheme-preview",
  },
  production: {
    name: "HyperPerp",
    bundleIdentifier: "com.chainalysis.hypertrading",
    packageName: "com.chainlytics.hypertrading",
    icon: "./assets/images/ios-icon.png",
    adaptiveIcon: "./assets/images/android-icon-prod.png",
    scheme: "app-scheme-prod",
  },
} as const;

export default ({ config }: ConfigContext): ExpoConfig => {
  const APP_ENV = IS_PRODUCTION
    ? "production"
    : IS_PREVIEW
      ? "preview"
      : "development";
  const {
    name: APP_NAME,
    bundleIdentifier: BUNDLE_IDENTIFIER,
    packageName: PACKAGE_NAME,
    icon: ICON,
    adaptiveIcon: ADAPTIVE_ICON,
    scheme: SCHEME,
  } = ENV_CONFIG[APP_ENV];

  console.log("APP_ENV", APP_ENV);

  const SPLASH_IMAGE = "./assets/images/splash-icon.png";
  const SPLASH_BACKGROUND = "#070B14";

  return {
    ...config,
    name: APP_NAME,
    slug: PROJECT_SLUG,
    version: "1.0.0",
    orientation: "portrait",
    icon: ICON,
    splash: {
      image: SPLASH_IMAGE,
      resizeMode: "contain",
      backgroundColor: SPLASH_BACKGROUND,
    },
    scheme: SCHEME,
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: BUNDLE_IDENTIFIER,
      splash: {
        image: SPLASH_IMAGE,
        resizeMode: "contain",
        backgroundColor: SPLASH_BACKGROUND,
      },
      infoPlist: {
        LSApplicationQueriesSchemes: [
          "metamask",
          "trust",
          "safe",
          "rainbow",
          "uniswap",
        ],
      },
    },
    android: {
      package: PACKAGE_NAME,
      splash: {
        image: SPLASH_IMAGE,
        resizeMode: "contain",
        backgroundColor: SPLASH_BACKGROUND,
      },
      adaptiveIcon: {
        backgroundColor: SPLASH_BACKGROUND,
        foregroundImage: ADAPTIVE_ICON,
        monochromeImage: ADAPTIVE_ICON,
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [{ scheme: SCHEME }],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: SPLASH_IMAGE,
          imageWidth: 220,
          resizeMode: "contain",
          backgroundColor: SPLASH_BACKGROUND,
          dark: {
            backgroundColor: SPLASH_BACKGROUND,
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: EAS_PROJECT_ID,
      },
    },
    owner: OWNER,
  };
};
