// biome-ignore lint/nursery/noBunModules: Tests run exclusively in Bun's built-in runner.
import { expect, test as it } from "bun:test";
import { Server } from "@colyseus/core";
import { Client, type Room } from "@colyseus/sdk";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { useGameStore } from "../apps/client/src/stores/game.store.ts";
import { Colors, colorize } from "../apps/server/src/lib/log.ts";
import { GameRoom } from "../apps/server/src/rooms/GameRoom.ts";
import type { GameState } from "../libs/common/src/lib/entities/GameState.ts";
import { EventTypes, Rooms } from "../libs/common/src/lib/types.ts";

const stateTimeout = 5000;

/** Waits for a decoded state patch and removes the listener on every exit path. */
const waitForState = (
  room: Room<GameState>,
  predicate: (state: GameState) => boolean,
): Promise<void> =>
  new Promise((resolve, reject) => {
    const onChange = (state: GameState): void => {
      if (predicate(state)) {
        clearTimeout(timer);
        room.onStateChange.remove(onChange);
        resolve();
      }
    };
    const timer = setTimeout(() => {
      room.onStateChange.remove(onChange);
      reject(new Error("Timed out waiting for a game state patch"));
    }, stateTimeout);
    room.onStateChange(onChange);
    if (room.state?.players) {
      onChange(room.state);
    }
  });

const connect = async (
  server: Server,
  transport: WebSocketTransport,
): Promise<Client> => {
  await server.listen(0, "127.0.0.1");
  const address = transport.server?.address();
  if (!address || typeof address === "string") {
    throw new Error("Expected a TCP server address");
  }
  return new Client(`ws://127.0.0.1:${address.port}`);
};

const increaseScore = async (
  first: Room<GameState>,
  second: Room<GameState>,
): Promise<void> => {
  const firstUpdate = waitForState(
    first,
    (state) => state.players.get(first.sessionId)?.score === 1,
  );
  const secondUpdate = waitForState(
    second,
    (state) => state.players.get(first.sessionId)?.score === 1,
  );
  first.send(EventTypes.increaseScore);
  await Promise.all([firstUpdate, secondUpdate]);
};

interface Snapshot {
  originalPlayers: { id: string; score: number }[];
  currentPlayers: { id: string; score: number }[];
  playerId: string;
}

const verifySnapshots = async (
  first: Room<GameState>,
  second: Room<GameState>,
): Promise<Snapshot> => {
  useGameStore.getState().unpackServerData(first, first.state);
  const originalPlayers = useGameStore.getState().players;
  await increaseScore(first, second);
  useGameStore.getState().unpackServerData(first, first.state);
  return {
    originalPlayers,
    currentPlayers: useGameStore.getState().players,
    playerId: first.sessionId,
  };
};

const verifyDeparture = async (
  first: Room<GameState>,
  second: Room<GameState>,
): Promise<void> => {
  const departure = waitForState(
    first,
    (state) => !state.players.has(second.sessionId),
  );
  await second.leave();
  await departure;
};

const runScenario = async (
  client: Client,
  rooms: Room<GameState>[],
): Promise<Snapshot> => {
  const first = await client.joinOrCreate<GameState>(Rooms.game);
  rooms.push(first);
  const second = await client.joinOrCreate<GameState>(Rooms.game);
  rooms.push(second);
  await waitForState(first, (state) => state.players.size === 2);
  await waitForState(second, (state) => state.players.size === 2);
  const snapshot = await verifySnapshots(first, second);
  await verifyDeparture(first, second);
  rooms.pop();
  return snapshot;
};

const startServer = async (): Promise<{ server: Server; client: Client }> => {
  const transport = new WebSocketTransport();
  const server = new Server({
    transport,
    greet: false,
    gracefullyShutdown: false,
  });
  server.define(Rooms.game, GameRoom);
  const client = await connect(server, transport);
  return { server, client };
};

it("two clients synchronize scores, immutable UI snapshots, and player departures", async () => {
  const { server, client } = await startServer();
  const rooms: Room<GameState>[] = [];
  try {
    const snapshot = await runScenario(client, rooms);
    expect(snapshot.currentPlayers).not.toBe(snapshot.originalPlayers);
    expect(
      snapshot.originalPlayers.find((player) => player.id === snapshot.playerId)
        ?.score,
    ).toBe(0);
    expect(
      snapshot.currentPlayers.find((player) => player.id === snapshot.playerId)
        ?.score,
    ).toBe(1);
  } finally {
    await Promise.all(rooms.map((room) => room.leave()));
    await server.gracefullyShutdown(false);
    useGameStore.getState().reset();
  }
});

it("error log colors include a red escape sequence and reset", () => {
  const red = "\x1b[1;31;47m";
  const reset = "\x1b[0m";
  expect(colorize("error", Colors.red)).toBe(`${red}error${reset}`);
});
