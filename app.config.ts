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
        name: "Hypertrading (Dev)",
        bundleIdentifier: "com.chainlytics.hypertrading.dev",
        packageName: "com.chainlytics.hypertrading.dev",
        icon: "./assets/images/ios-icon.png",
        adaptiveIcon: "./assets/images/android-icon-dev.png",
        scheme: "app-scheme-dev",

    },
    preview: {
        name: "Hypertrading (Preview)",
        bundleIdentifier: "com.chainalysis.hypertrading.preview",
        packageName: "com.chainlytics.hypertrading.preview",
        icon: "./assets/images/ios-icon.png",
        adaptiveIcon: "./assets/images/android-icon-preview.png",
        scheme: "app-scheme-preview",
    },
    production: {
        name: "Hypertrading",
        bundleIdentifier: "com.chainalysis.hypertrading",
        packageName: "com.chainlytics.hypertrading",
        icon: "./assets/images/ios-icon.png",
        adaptiveIcon: "./assets/images/android-icon-prod.png",
        scheme: "app-scheme-prod",
    },
} as const;

export default ({config}:ConfigContext):ExpoConfig =>{
  
  const APP_ENV = IS_PRODUCTION ? "production" : IS_PREVIEW ? "preview" : "development";
  const { name: APP_NAME, bundleIdentifier: BUNDLE_IDENTIFIER, packageName: PACKAGE_NAME, icon: ICON, adaptiveIcon: ADAPTIVE_ICON, scheme: SCHEME } = ENV_CONFIG[APP_ENV];
  
  console.log("APP_ENV", APP_ENV);
  
  return {
    ...config,
    "name": APP_NAME,
    "slug": PROJECT_SLUG,
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": SCHEME,
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": BUNDLE_IDENTIFIER,
    },
    "android": {
      "package": PACKAGE_NAME,
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",
        "foregroundImage": ADAPTIVE_ICON,
        "backgroundImage": ADAPTIVE_ICON,
        "monochromeImage": ADAPTIVE_ICON
      },
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false
    },
    "web": {
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff",
          "dark": {
            "backgroundColor": "#000000"
          }
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true,
      "reactCompiler": true
    },
    "extra": {
      "router": {},
      "eas": {
        "projectId": EAS_PROJECT_ID
      }
    },
    "owner": OWNER
  };
}
