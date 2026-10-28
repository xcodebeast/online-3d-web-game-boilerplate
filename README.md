# Online 3D Web Game Boilerplate

A React and Three.js client with a Colyseus multiplayer server, shared TypeScript schemas, and Zustand state. Nx coordinates the apps; Bun runs development, builds, tests, and the server.

## Setup

Install [Bun](https://bun.sh/) 1.4.4 or newer, then:

```sh
git clone https://github.com/xcodebeast/online-3d-web-game-boilerplate.git
cd online-3d-web-game-boilerplate
bun install --frozen-lockfile
cp apps/client/.env.example apps/client/.env
cp apps/server/.env.example apps/server/.env
bun run dev
```

Open [http://localhost:8080](http://localhost:8080). The server listens on port 3000. To run apps separately, use `bun run client:serve` and `bun run server:serve`.

Set `VITE_WS_SERVER_URL` in the client's environment to the browser-accessible WebSocket endpoint. Use `wss://` when serving the client over HTTPS. Set `PORT` in the server's environment to change its listening port.

## Checks

```sh
bun run check       # Biome, TypeScript, tests, and both production builds
bun run lint:fix    # Apply safe Biome fixes
bun run format     # Format supported files
bun run test:browser # Production-browser regression tests (build first)
```

Biome replaces ESLint and Prettier. Every rule group, including nursery, is enabled at error severity; warnings fail CI too. Project, type-aware, React, test, and Tailwind domains are enabled; domains for unused frameworks are disabled to avoid conflicting rules. Any necessary framework-specific suppression must stay local and explain why it exists. React Three Fiber attributes are allowed in the scene file; unrelated unknown attributes remain errors. TypeScript also runs in strict mode. Bun is the package manager and runtime; project scripts explicitly run JavaScript CLIs with Bun.

Dependencies are pinned to stable registry releases and resolved in `bun.lock`. Unused ESLint, Prettier, SWC, esbuild, and Vitest tooling has been removed. Tests use Bun's built-in runner. Tailwind 4 uses its Vite plugin. Colyseus uses the current `@colyseus/sdk` client and directly declares the schema, core, and transport packages shared by the apps.

## Production

```sh
bun run build
bun run start
```

Build output goes into `dist/apps/client` and `dist/apps/server`. Serve the client as static files; `bun run start` launches the built server.

With Docker installed, build and launch both apps from source:

```sh
docker compose up --build
```

The client is available on port 8080 and the server on port 3000. For a remote deployment, set `VITE_WS_SERVER_URL` before building the client, for example:

```sh
VITE_WS_SERVER_URL=wss://game.example.com docker compose build client
```

The URL is embedded at build time. The server container runs as the unprivileged `bun` user.

## Shared code

`libs/common/src` holds schemas and message constants. Import individual modules directly; explicit relative imports work consistently in Vite, Bun, TypeScript, and Biome.

## Contributing

Run `bun run check` before opening a pull request.

## Client bundle

The score controls and networking load first. The WebGL scene loads independently with a loading message and an error boundary, so a slow or failed scene download does not block scoring. The scene uses Fiber's `createRoot` API and typed `extend` registrations rather than registering the full Three.js namespace with `Canvas`. Keep new scene features inside that lazy boundary.

Vite keeps Three.js core and renderer modules in separate cacheable chunks. Every client build enforces three limits: 140 KiB of initial gzip JavaScript (including static imports and preloaded dependencies), 375 KiB of total gzip JavaScript, and 450 KiB per minified JavaScript chunk. Changing chunk names or moving code between chunks cannot bypass the initial or total budgets.

Browser tests run against production builds and cover scoring during a delayed scene download, 3D text interaction before and after resizing, and recovery from a failed scene chunk. To run them locally:

```sh
bun run build
bun --bun playwright install chromium
bun run test:browser
```
