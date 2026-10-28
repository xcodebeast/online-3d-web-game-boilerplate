import { createRoot, events, type ReconcilerRoot } from "@react-three/fiber";
import {
  type JSX,
  // biome-ignore lint/correctness/noUnresolvedImports: React exposes Suspense through a conditional CommonJS entry.
  Suspense,
  useInsertionEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { GameScene } from "./game-scene.tsx";

const labels = {
  canvas: "Interactive 3D game",
  unavailable:
    "The 3D scene is unavailable. You can still use the score button above.",
};
type CanvasRoot = ReconcilerRoot<HTMLCanvasElement>;

/** Keeps the renderer and camera sized to the canvas without rebuilding the root. */
const observeCanvas = (
  canvas: HTMLCanvasElement,
  root: CanvasRoot,
  onFailure: () => void,
): (() => void) => {
  let disposed = false;
  const resize = (): void => {
    const { width, height, top, left } = canvas.getBoundingClientRect();
    if (width === 0 || height === 0) {
      return;
    }
    root
      .configure({ events, dpr: [1, 2], size: { width, height, top, left } })
      .then(() => {
        if (!disposed) {
          root.render(
            <Suspense fallback={null}>
              <GameScene />
            </Suspense>,
          );
        }
      })
      .catch(() => {
        if (!disposed) {
          disposed = true;
          observer.disconnect();
          onFailure();
        }
      });
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  return (): void => {
    disposed = true;
    observer.disconnect();
  };
};

/** Owns a minimal Fiber root, its resize observer, and its GPU resources. */
export const GameCanvas = (): JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<CanvasRoot | null>(null);
  const [failed, setFailed] = useState(false);
  // Like Fiber's Canvas, final removal owns disposal; StrictMode effect replay must not destroy the root.
  useInsertionEffect(
    () => (): void => {
      rootRef.current?.unmount();
      rootRef.current = null;
    },
    [],
  );
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const root = rootRef.current ?? createRoot(canvas);
    rootRef.current = root;
    return observeCanvas(canvas, root, (): void => {
      rootRef.current?.unmount();
      rootRef.current = null;
      setFailed(true);
    });
  }, []);
  if (failed) {
    return <p role="alert">{labels.unavailable}</p>;
  }
  return (
    <canvas
      className="block min-h-0 w-full flex-1 touch-none"
      aria-label={labels.canvas}
      ref={canvasRef}
    />
  );
};
