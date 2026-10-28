import { Client, type Room } from "@colyseus/sdk";
import { useCallback, useState } from "react";
import type { GameState } from "../../../../libs/common/src/lib/entities/GameState.ts";
import { Rooms } from "../../../../libs/common/src/lib/types.ts";

interface Network {
  client: Client;
  joinOrCreateGame: () => Promise<Room<GameState>>;
  joinGame: (roomId: string) => Promise<Room<GameState>>;
  createGame: () => Promise<Room<GameState>>;
}

/** Creates a ready client before exposing matchmaking operations. */
export const useNetwork = (): Network => {
  const [client] = useState(
    () =>
      new Client(import.meta.env.VITE_WS_SERVER_URL ?? "ws://localhost:3000"),
  );
  const joinOrCreateGame = useCallback(
    () => client.joinOrCreate<GameState>(Rooms.game),
    [client],
  );
  const joinGame = useCallback(
    (roomId: string) => client.joinById<GameState>(roomId),
    [client],
  );
  const createGame = useCallback(
    () => client.create<GameState>(Rooms.game),
    [client],
  );
  return { client, joinOrCreateGame, joinGame, createGame };
};
