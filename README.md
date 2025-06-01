# Haiku Daily App

A beautiful React Native app that displays a new haiku every day, with a clean and modern UI.

## Features

- Daily haiku updates
- Beautiful animations
- Modern UI design
- Dark mode support

## Getting Started

### Prerequisites

- Node.js
- npm or yarn
- Expo Go app on your mobile device (for development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/haiku-app.git
cd haiku-app
```

2. Install dependencies:
```bash
npm install
```

Note: The `node_modules` directory is not included in the repository as it contains Expo dependencies that are automatically installed when you run `npm install`. These dependencies are required to run the app with Expo.

3. Start the development server (for Expo Go):
```bash
npx expo start
```

4. Scan the QR code with Expo Go (Android) or the Camera app (iOS)

### Building an APK

You can also build a standalone APK to install and run the app on any Android device:

```bash
npx eas build -p android --profile preview
```

After the build completes, download the APK from the Expo dashboard and install it on your device. The app will work as a standalone Android app.

## Development

The app is built with:
- React Native
- Expo
- TypeScript
- React Navigation

## License

This project is licensed under the MIT License - see the LICENSE file for details.
