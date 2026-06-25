# Twitch Toolbox

Twitch Toolbox is a desktop app built with Tauri, React, and Vite for managing Twitch chat automation. The initial MVP is a customizable Twitch chat auto-cron scheduler that uses the Twitch API and Twitch authentication to schedule chat actions over time.

The long-term scope is intentionally open-ended. The scheduler is the first core workflow, and the app is designed to grow into a broader creator automation toolbox over time.

## MVP

The first release focuses on:

- Connecting to Twitch with user authentication
- Configuring scheduled chat actions
- Defining recurring cron-based schedules
- Customizing message content and execution behavior
- Laying the foundation for future Twitch tooling

## Planned Scope

Future versions may expand into additional Twitch automation and creator workflow features, such as:

- More advanced scheduling rules
- Chat command automation
- Streamer workflow utilities
- Template-based message presets
- Dashboard and analytics features
- Additional Twitch API integrations

## Tech Stack

- Node 24
- Tauri 2
- React 19
- Vite 7
- TypeScript

## Prerequisites

- Node.js 24
- npm
- Rust toolchain for Tauri desktop builds
- Platform-specific Tauri dependencies for your OS

## Getting Started

Install dependencies:

```bash
npm install
```

Run the app in development mode:

```bash
npm run tauri dev
```

Build the frontend:

```bash
npm run build
```

Preview the Vite build locally:

```bash
npm run preview
```

## Project Scripts

- `npm run dev` starts the Vite development server
- `npm run build` type-checks and builds the frontend
- `npm run preview` previews the production frontend build
- `npm run tauri` invokes the Tauri CLI

