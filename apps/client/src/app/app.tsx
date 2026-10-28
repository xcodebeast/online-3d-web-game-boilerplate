import type { Room } from "@colyseus/sdk";
import { Text } from "@react-three/drei";
import { Canvas, type ThreeElements, useFrame } from "@react-three/fiber";
import { type JSX, useEffect, useRef, useState } from "react";
import type { Mesh } from "three";
import type { GameState } from "../../../../libs/common/src/lib/entities/GameState.ts";
import { EventTypes } from "../../../../libs/common/src/lib/types.ts";
import { useNetwork } from "../hooks/useNetwork.tsx";
import { useGameStore } from "../stores/game.store.ts";

const labels = {
  gameButton: "Click me (Game)",
  uiButton: "Click me (UI)",
  scores: "Player scores:",
  connectionError: "Unable to connect to the game",
};
const enlargedScale = 1.5;
const spotlightAngle = 0.15;
const boxOffset = 5;

const getScale = (clicked: boolean): number => {
  if (clicked) {
    return enlargedScale;
  }
  return 1;
};
const getColor = (hovered: boolean): string => {
  if (hovered) {
    return "hotpink";
  }
  return "orange";
};

/** Animates the sample cube without updating React state every frame. */
const Box = (props: ThreeElements["mesh"]): JSX.Element => {
  const ref = useRef<Mesh>(null);
  const [hovered, hover] = useState(false);
  const [clicked, click] = useState(false);
  const toggle = (): void => click(!clicked);
  const pointerOver = (): void => hover(true);
  const pointerOut = (): void => hover(false);
  useFrame((_state, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta;
      ref.current.rotation.y += delta;
    }
  });
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: R3F meshes are WebGL objects, not DOM elements; the score action also has a native button.
    <mesh
      {...props}
      ref={ref}
      scale={getScale(clicked)}
      onClick={toggle}
      onPointerOver={pointerOver}
      onPointerOut={pointerOut}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={getColor(hovered)} />
    </mesh>
  );
};

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

export const App = (): JSX.Element => {
  const room = useGameStore((state) => state.room);
  const increaseScore = (): void => room?.send(EventTypes.increaseScore);
  return (
    <div className="h-screen">
      <GameUi />
      <Canvas>
        <ambientLight intensity={Math.PI / 2} />
        <spotLight
          position={[10, 10, 10]}
          angle={spotlightAngle}
          penumbra={1}
          decay={0}
          intensity={Math.PI}
        />
        <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
        <Box position={[boxOffset, 0, 0]} />
        <Text
          scale={[1, 1, 2]}
          color="black"
          anchorX="center"
          anchorY="middle"
          onClick={increaseScore}
        >
          {labels.gameButton}
        </Text>
      </Canvas>
    </div>
  );
};
