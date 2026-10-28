// biome-ignore lint/correctness/noUnresolvedImports: Page is a TypeScript re-export from Playwright's conditional CommonJS entry.
import type { Page } from "@playwright/test";
import { expect, test as it } from "@playwright/test";

const firstScore = /Player .+ score: 1$/u;
const scoreAfterResize = 3;

/** Verifies that scoring can proceed independently of renderer loading. */
const scoreFromUi = async (page: Page): Promise<void> => {
  const button = page.getByRole("button", { name: "Click me (UI)" });
  await expect(button).toBeEnabled();
  await button.click();
  await expect(page.getByText(firstScore)).toBeVisible();
};

/** The centered world-space text is interactive only after the scene has rendered. */
const scoreFromScene = async (page: Page, score: number): Promise<void> => {
  const canvas = page.getByLabel("Interactive 3D game");
  await expect(canvas).toBeVisible();
  await expect(async () => {
    await canvas.click();
    await expect(
      page.getByText(new RegExp(`Player .+ score: ${score}$`, "u")),
    ).toBeVisible();
  }).toPass();
};

const scoreDuringSceneDownload = async (page: Page): Promise<void> => {
  let releaseScene: () => void = (): void => {
    throw new Error("Scene gate was not initialized");
  };
  const sceneGate = new Promise<void>((resolve) => {
    releaseScene = resolve;
  });
  await page.route("**/assets/game-canvas-*.js", async (route) => {
    await sceneGate;
    await route.continue();
  });
  try {
    await page.goto("/");
    await expect(page.getByRole("status")).toHaveText("Loading 3D scene…");
    await expect(page.locator("canvas")).toHaveCount(0);
    await scoreFromUi(page);
  } finally {
    releaseScene();
  }
};

it("score UI is usable while the scene loads, then WebGL scoring survives resizing", async ({
  page,
}) => {
  await scoreDuringSceneDownload(page);
  await scoreFromScene(page, 2);
  await page.setViewportSize({ width: 800, height: 600 });
  await scoreFromScene(page, scoreAfterResize);
  await expect(page.getByLabel("Interactive 3D game")).toBeVisible();
});

it("a failed scene chunk leaves score controls usable and shows a recovery message", async ({
  page,
}) => {
  await page.route("**/assets/game-canvas-*.js", (route) => route.abort());
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText(
    "Reload the page to try again",
  );
  await scoreFromUi(page);
});
