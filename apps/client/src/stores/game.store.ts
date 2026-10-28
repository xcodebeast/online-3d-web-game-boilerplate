import type { Room } from "@colyseus/sdk";
import { create } from "zustand";
import type { GameState } from "../../../../libs/common/src/lib/entities/GameState.ts";

interface PlayerScore {
  id: string;
  score: number;
}
interface GameStore {
  room: Room<GameState> | null;
  players: PlayerScore[];
  unpackServerData: (room: Room<GameState>, state: GameState) => void;
  reset: () => void;
}

/** Copies mutable schema data so React receives a fresh snapshot per patch. */
export const useGameStore = create<GameStore>()((set) => ({
  room: null,
  players: [],
  unpackServerData: (room: Room<GameState>, state: GameState): void =>
    set({
      room,
      players: Array.from(
        state.players.values(),
        ({ id, score }): PlayerScore => ({
          id,
          score,
        }),
      ),
    }),
  reset: () => set({ room: null, players: [] }),
}));
