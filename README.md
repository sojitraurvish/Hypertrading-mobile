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

- [To start the project:] [npx expo start --clear]


https://www.youtube.com/watch?v=tacJUeBYPYc&t=5s
eas credentials
// to generate sha 1 key


// it is hard to create build every time when you change you package so people use expo go and it's app
// expo go help you to build you app fast

// to craete development build
// npx expo install expo-dev-client    

// eas build --profile development --plateform <android> for ios device you have to register first

native app bundle + js bundle that run  in case of expo go app it runs as native app bundle and js bundel runs inside it

in case of dev buid you create this native bundle your self(expo go version created by your self) with relaing one aloredy exist like expo app and dev build all you to run native libraries

// there are two way to create dev builds
// locally -> reqire x code and adroid studio and simulators
// eas - expo applicatoin services - to build in cloud and install in device
ask for package for dev build com.comapu,app also for ios

1) locally
// npx expo prebuild - generate native code for android and ios using technic called continuse native gneration

// it generates two folder andorid and ios - you are not allowed ot modify this folder's code because every time when you run eas expo prebuild then these folders are auto generated, so next time when you run the new chagnes are overriden

// npx expo run:ios - run the native code in ios simulator 
// npx expo run:andoid 

2) eas cli - to check dev  build in real device

// make sure you have eas cli install 
// npm install -g eas-cli
// eas -v

// eas login

//eas whoami - know acc info

// eas init - initalize new eas porject in my project, also add project id  extra object in app.json
// select your acc

// eas build:configure - create file and apply diff setting that i want to apply on each build hit all for both platform ios and android and you can see the eas.json file is created and here you file diff option for dev(  "developmentClient": true, this option show dev option on dev build), preview, and production , if you do not want to depend local server of your project then create preview and production build

// to create build
// eas build --profile development --plateform <android, ios, all>   // when you run this command then make sure there does not ios and andoid folder exists in you project which might got created when you created local build with prebuild, or you can add those both folder into git ignore or .easignore
// --profile development form above file dev option it selects
// before this way if you have created build via above way and in your directory andorid and ios folder exists then
expo think you have made some change in these folders and it is not going to reveal the ios or android porject if
we container these two folder in our project so add those folder names in .giignore /ios /andorid

if you did not instealled expo-dev-client then inatall it because it allow us to install this on real device

it ask you for apple creads because we want to install it on real device and then we need to generate a certificate from
apple so that they gave us permissions to install this in a real device and we also have to register our device if you
do not have device you can add cli will ask you

so now it will push my code to eas cloud and start building my app and you check it by going to dashboard

once build is completed share this like to your actual device and install the build and 

<!-- to GET the ssh key to add for google login -->
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android


https://www.youtube.com/watch?v=FdjczjkwQKE
https://www.youtube.com/watch?v=uQCE9zl3dXU
https://reactnative.directory/?search=%40react-native-google-signin%2Fgoogle- // this thired party libry doe not work with expo go




<!-- build verion manange -->
https://www.youtube.com/watch?v=C8x4N9UmzS8
<!-- multiple varients see this again-->
https://www.youtube.com/watch?v=UtJJCAfrjIg

<!-- production build for android -->
https://www.youtube.com/watch?v=nxlt8uwqhpE
<!-- production build for ios -->
https://www.youtube.com/watch?v=VZL_e0cEwo8

<!-- How to use over the air updates to share previews with your team | EAS Tutorial -->
https://www.youtube.com/watch?v=vPKh-tNm-yI

<!-- How to create and share internal distribution builds | EAS Tutorial -->
https://www.youtube.com/watch?v=1fQuGLHxWks

<!-- How to manage Multiple App Environments with Expo -->
https://www.youtube.com/watch?v=uKGx3gRrhx0

<!-- entire playlist -->
https://www.youtube.com/watch?v=uQCE9zl3dXU&list=PLsXDmrmFV_AS14tZCBin6m9NIS_VCUKe2


"tu":"expo start --tunnel"
"pb": "npx expo rebuild --plateform android && npx expo run:android"

https://www.youtube.com/watch?v=O2kxRkiWv0M



// can add this in eas.json file for custom env if you want to create, it do not ask you for creds or certificate and you can run in simulator https://www.youtube.com/watch?v=uKGx3gRrhx0
 "ios-simulator": {
      "extends": "development",
      "ios": {
        "simulator": true
      }
    },

// if you have created env var in dashboard
eas env:pull