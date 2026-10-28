import type { Room } from "@colyseus/sdk";
// biome-ignore lint/correctness/noUnresolvedImports: React exposes Suspense through a conditional CommonJS entry.
import { type JSX, lazy, Suspense, useEffect, useState } from "react";
import type { GameState } from "../../../../libs/common/src/lib/entities/GameState.ts";
import { EventTypes } from "../../../../libs/common/src/lib/types.ts";
import { useNetwork } from "../hooks/useNetwork.tsx";
import { SceneBoundary } from "../scene/scene-boundary.tsx";
import { useGameStore } from "../stores/game.store.ts";

const labels = {
  loadingScene: "Loading 3D scene…",
  uiButton: "Click me (UI)",
  scores: "Player scores:",
  connectionError: "Unable to connect to the game",
};
const GameCanvas = lazy(async () => {
  const { GameCanvas: Canvas } = await import("../scene/game-canvas.tsx");
  return { default: Canvas };
});

/** Owns the room subscription and releases late connections after unmount. */
const GameUi = (): JSX.Element => {
  const { room, players, unpackServerData, reset } = useGameStore();
  const { joinOrCreateGame } = useNetwork();
  const [error, setError] = useState<string | null>(null);
  const increaseScore = (): void => room?.send(EventTypes.increaseScore);
  useEffect(() => {
    let disposed = false;
    let activeRoom: Room<GameState> | undefined;
    const onStateChange = (state: GameState): void => {
      if (activeRoom) {
        unpackServerData(activeRoom, state);
      }
    };
    const onConnectionError = (cause: unknown): void => {
      if (disposed) {
        return;
      }
      if (cause instanceof Error) {
        setError(cause.message);
        return;
      }
      setError(labels.connectionError);
    };
    const onConnected = async (joinedRoom: Room<GameState>): Promise<void> => {
      if (disposed) {
        await joinedRoom.leave();
        return;
      }
      activeRoom = joinedRoom;
      joinedRoom.onStateChange(onStateChange);
    };
    joinOrCreateGame().then(onConnected).catch(onConnectionError);
    return (): void => {
      disposed = true;
      if (activeRoom) {
        activeRoom.onStateChange.remove(onStateChange);
        activeRoom.leave().catch(onConnectionError);
      }
      reset();
    };
  }, [joinOrCreateGame, unpackServerData, reset]);
  return (
    <div className="flex justify-between p-2">
      <button type="button" disabled={!room} onClick={increaseScore}>
        {labels.uiButton}
      </button>
      {error !== null && <p role="alert">{error}</p>}
      {players.length > 0 && (
        <div className="flex flex-col gap-y-2">
          <h1>{labels.scores}</h1>
          {players.map(({ id, score }) => (
            <p key={id}>{`Player ${id} score: ${score}`}</p>
          ))}
        </div>
      )}
    </div>
  );
};

export const App = (): JSX.Element => (
  <div className="flex h-screen flex-col">
    <GameUi />
    <SceneBoundary>
      <Suspense fallback={<p role="status">{labels.loadingScene}</p>}>
        <GameCanvas />
      </Suspense>
    </SceneBoundary>
  </div>
);
