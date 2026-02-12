# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

- To start the project:

  ```bash
  npx expo start --clear
  ```

---

## EAS Credentials & SHA-1 Key

> **Reference:** [EAS Credentials Tutorial](https://www.youtube.com/watch?v=tacJUeBYPYc&t=5s)

To generate the SHA-1 key, use the `eas credentials` command.

---

## Understanding Expo Go vs Development Builds

It is hard to create a build every time you change your package, so people use **Expo Go** — it helps you build and test your app fast.

### How It Works

- **Expo Go:** The native app bundle + JS bundle run together. In the case of Expo Go, it runs as a pre-built native app bundle with your JS bundle running inside it.
- **Development Build:** You create the native bundle yourself (essentially your own version of Expo Go). Unlike the existing Expo Go app, a dev build allows you to run **native libraries**.

---

## Creating Development Builds

First, install the dev client:

```bash
npx expo install expo-dev-client
```

Then trigger a build:

```bash
eas build --profile development --platform <android|ios|all>
```

> **Note:** For iOS devices, you have to register your device first.

### Two Ways to Create Dev Builds

1. **Locally** — Requires Xcode, Android Studio, and simulators.
2. **EAS (Expo Application Services)** — Build in the cloud and install on a device.

When it asks for a package name for the dev build, provide it (e.g., `com.company.app`) for both Android and iOS.

---

### Option 1: Local Development Build

1. **Generate native code** using Continuous Native Generation:

   ```bash
   npx expo prebuild
   ```

   This generates two folders: `android` and `ios`. **Do not manually modify** the code in these folders — every time you run `npx expo prebuild`, these folders are auto-generated and any manual changes will be overridden.

2. **Run the native code** in simulators:

   ```bash
   # For iOS simulator
   npx expo run:ios

   # For Android emulator
   npx expo run:android
   ```

---

### Option 2: EAS CLI — Dev Build on a Real Device

1. **Install EAS CLI:**

   ```bash
   npm install -g eas-cli
   ```

2. **Verify installation:**

   ```bash
   eas -v
   ```

3. **Login to your Expo account:**

   ```bash
   eas login
   ```

4. **Check account info:**

   ```bash
   eas whoami
   ```

5. **Initialize a new EAS project** (also adds `projectId` to the `extra` object in `app.json`):

   ```bash
   eas init
   ```

   Select your account when prompted.

6. **Configure EAS build profiles:**

   ```bash
   eas build:configure
   ```

   This creates the `eas.json` file with different build profiles:
   - **development** — Has `"developmentClient": true` (this option shows dev options on the dev build).
   - **preview** — For internal testing.
   - **production** — For release builds.

   > If you do not want to depend on the local server of your project, create **preview** or **production** builds instead.

7. **Create the build:**

   ```bash
   eas build --profile development --platform <android|ios|all>
   ```

   - The `--profile development` flag selects the development configuration from `eas.json`.
   - **Important:** Make sure the `ios` and `android` folders do **not** exist in your project when running this command (they may have been created by a local `prebuild`). Either delete them or add them to `.gitignore` / `.easignore`:

     ```
     /ios
     /android
     ```

   - If those folders exist, Expo will think you've made manual changes to them and will not regenerate the native project.

8. **Install `expo-dev-client`** (if not already installed) — it allows installing the build on a real device:

   ```bash
   npx expo install expo-dev-client
   ```

9. **Apple Credentials (iOS only):**
   - EAS will ask for your Apple credentials because installing on a real device requires generating a certificate from Apple.
   - You also need to **register your device**. If you don't have a device registered, the CLI will guide you through adding one.

10. **Build & Install:**
    - EAS will push your code to the cloud and start building. You can monitor progress on the [EAS Dashboard](https://expo.dev).
    - Once the build is completed, share the link to your actual device and install the build.

---

## Google Login Setup

### Get the SHA Key for Google Login

```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

### Reference Links

- [Google Sign-In Tutorial 1](https://www.youtube.com/watch?v=FdjczjkwQKE)
- [Google Sign-In Tutorial 2](https://www.youtube.com/watch?v=uQCE9zl3dXU)
- [React Native Google Sign-In Library](https://reactnative.directory/?search=%40react-native-google-signin%2Fgoogle-)
  > **Note:** This third-party library does **not** work with Expo Go.

---

## Build Version Management

- [Build Version Management Tutorial](https://www.youtube.com/watch?v=C8x4N9UmzS8)
- [Multiple Variants Tutorial](https://www.youtube.com/watch?v=UtJJCAfrjIg) _(review again)_

---

## Production Builds

- [Production Build for Android](https://www.youtube.com/watch?v=nxlt8uwqhpE)
- [Production Build for iOS](https://www.youtube.com/watch?v=VZL_e0cEwo8)

---

## EAS Tutorials

- [Over-the-Air Updates — Share Previews with Your Team](https://www.youtube.com/watch?v=vPKh-tNm-yI)
- [Create and Share Internal Distribution Builds](https://www.youtube.com/watch?v=1fQuGLHxWks)
- [Manage Multiple App Environments with Expo](https://www.youtube.com/watch?v=uKGx3gRrhx0)
- [Entire EAS Playlist](https://www.youtube.com/watch?v=uQCE9zl3dXU&list=PLsXDmrmFV_AS14tZCBin6m9NIS_VCUKe2)

---

## Useful Scripts

Add these to your `package.json` scripts:

```json
"tu": "expo start --tunnel",
"pb": "npx expo rebuild --platform android && npx expo run:android"
```

> **Reference:** [Expo Tunnel Tutorial](https://www.youtube.com/watch?v=O2kxRkiWv0M)

---

## iOS Simulator Build Profile (EAS)

You can add this profile in your `eas.json` file to create a custom environment for the iOS simulator. It does **not** ask for credentials or certificates, and you can run it directly in the simulator.

> **Reference:** [Multiple App Environments Tutorial](https://www.youtube.com/watch?v=uKGx3gRrhx0)

```json
"ios-simulator": {
  "extends": "development",
  "ios": {
    "simulator": true
  }
}
```

---

## Pull Environment Variables from EAS Dashboard

If you have created environment variables in the EAS Dashboard, pull them locally with:

```bash
eas env:pull
```