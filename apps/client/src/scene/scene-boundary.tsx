import { Component, type PropsWithChildren, type ReactNode } from "react";

interface SceneState {
  failed: boolean;
}
const unavailable =
  "The 3D scene could not load. Reload the page to try again; the score button above still works.";

/** Keeps matchmaking and score controls available if a scene chunk fails to load. */
// biome-ignore lint/style/useReactFunctionComponents: React error boundaries require the class lifecycle API.
export class SceneBoundary extends Component<PropsWithChildren, SceneState> {
  override state: SceneState = { failed: false };
  static getDerivedStateFromError(): SceneState {
    return { failed: true };
  }
  override render(): ReactNode {
    if (this.state.failed) {
      return <p role="alert">{unavailable}</p>;
    }
    return this.props.children;
  }
}
