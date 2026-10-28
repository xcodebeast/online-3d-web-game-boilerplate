import { Text } from "@react-three/drei";
import { extend, type ThreeElements, useFrame } from "@react-three/fiber";
import { type JSX, useRef, useState } from "react";
import {
  AmbientLight,
  BoxGeometry,
  Mesh,
  MeshStandardMaterial,
  PointLight,
  SpotLight,
} from "three";
import { EventTypes } from "../../../../libs/common/src/lib/types.ts";
import { useGameStore } from "../stores/game.store.ts";

// Register only the objects this scene uses so unused Three.js exports can be removed.
const Ambient = extend(AmbientLight);
const BoxShape = extend(BoxGeometry);
const GameMesh = extend(Mesh);
const StandardMaterial = extend(MeshStandardMaterial);
const Point = extend(PointLight);
const Spot = extend(SpotLight);
const labels = { gameButton: "Click me (Game)" };
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
    <GameMesh
      {...props}
      ref={ref}
      scale={getScale(clicked)}
      onClick={toggle}
      onPointerOver={pointerOver}
      onPointerOut={pointerOut}
    >
      <BoxShape args={[1, 1, 1]} />
      <StandardMaterial color={getColor(hovered)} />
    </GameMesh>
  );
};

export const GameScene = (): JSX.Element => {
  const room = useGameStore((state) => state.room);
  const increaseScore = (): void => room?.send(EventTypes.increaseScore);
  return (
    <>
      <Ambient intensity={Math.PI / 2} />
      <Spot
        position={[10, 10, 10]}
        angle={spotlightAngle}
        penumbra={1}
        decay={0}
        intensity={Math.PI}
      />
      <Point position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
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
    </>
  );
};
