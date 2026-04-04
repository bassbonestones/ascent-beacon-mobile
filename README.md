# Ascent Beacon Mobile

React Native mobile app for the Ascent Beacon life alignment platform.

## Tech Stack

- **Framework**: React Native with Expo SDK 55
- **Language**: TypeScript (strict mode)
- **Navigation**: React Navigation v7
- **State**: React Context + custom hooks
- **Testing**: Jest + React Native Testing Library

## Getting Started

### Prerequisites

- Node.js v18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)

### Installation

```bash
npm install
```

### Running the App

```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run in web browser
npm run web
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── assistant/     # Chat/assistant components
│   ├── login/         # Auth flow components
│   ├── priorities/    # Priority management components
│   ├── values/        # Value management components
│   └── styles/        # Component styles
├── context/           # React Context providers
├── hooks/             # Custom React hooks
├── screens/           # Screen components
│   └── styles/        # Screen styles
├── services/          # API services
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## Key Features

- **Values Discovery**: AI-assisted exploration of personal values
- **Priorities Management**: Create and manage life priorities
- **Value-Priority Links**: Connect values to priorities
- **Weight Adjustment**: Balance importance across values

## Architecture

### State Management

- `AuthContext` - User authentication state
- Custom hooks for feature-specific state (e.g., `useValuesManagement`, `useAssistantChat`)

### API Layer

- `api.ts` - Unified API client using mixin pattern
- Type-safe request/response handling
- Automatic token refresh

### Testing Strategy

- Unit tests for hooks and utilities
- Component tests with React Native Testing Library
- 70%+ code coverage target

## Contributing

1. Follow TypeScript strict mode
2. Write tests for new features
3. Use existing patterns for consistency
4. Keep components under 300 lines

## License

Proprietary - Ascent Beacon
