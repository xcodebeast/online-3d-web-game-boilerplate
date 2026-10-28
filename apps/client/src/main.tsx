// biome-ignore lint/correctness/noUnresolvedImports: React exports StrictMode through its conditional CommonJS entry point.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/app.tsx";
import "./styles.css";

const root = document.querySelector("#root");
if (!root) {
  throw new Error("The root element is missing");
}
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
