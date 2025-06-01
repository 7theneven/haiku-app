# Haiku Daily

A beautiful, minimalist Android app that delivers a daily haiku at your chosen time. Each haiku is uniquely generated using AI, focusing on themes of nature, love, sea, forest, soul, and body.

## Features

- Daily AI-generated haikus
- Customizable notification time
- Daily reminders
- Clean, minimalist design
- Smooth animations
- Automatic dark/light mode support

## Technical Details

- Built with React Native and Expo
- Uses Groq API for haiku generation
- Implements local notifications for daily reminders
- Stores user preferences and haikus locally

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npx expo start
   ```

3. Build for Android:
   ```bash
   npx eas build -p android --profile preview
   ```

## Development

- `app/` - Main application code
- `assets/` - Images and fonts
- `app.json` - App configuration
- `eas.json` - Build configuration

## License

MIT
