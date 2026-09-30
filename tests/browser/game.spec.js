import { test, expect } from "@playwright/test";

test("a complete garden, pause, save and replay work in the rendered application", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: /grow together/ }).click();
  await expect(page.locator("#render-error")).toBeHidden();
  // Use the public UI to play the complete resource and restoration loop.
  for (let i = 0; i < 35; i++) {
    if (await page.locator("#win-dialog").isVisible()) break;
    const action = page.locator("#goal-action");
    await expect(action).toBeEnabled({ timeout: 30000 });
    await action.click();
    await expect
      .poll(
        async () =>
          (await page.locator("#win-dialog").isVisible()) ||
          (await action.isEnabled()),
        { timeout: 30000 },
      )
      .toBe(true);
  }
  await expect(page.locator("#win-dialog")).toBeVisible();
  await expect(page.locator("#progress-label")).toHaveText("100%");
  await expect(page.locator("#flower-count")).toHaveText(
    "3 of 3 flower beds blooming",
  );
  await page.getByRole("button", { name: "Enjoy your garden" }).click();
  await page.reload();
  await page.locator("#begin").click();
  await expect(page.locator("#progress-label")).toHaveText("100%");
  await page.locator("#garden").focus();
  await page.keyboard.press("Escape");
  await expect(page.locator("#pause-dialog")).toBeVisible();
  await page.getByRole("button", { name: "Start a fresh garden" }).click();
  await page.getByRole("button", { name: "Start fresh", exact: true }).click();
  await expect(page.locator("#progress-label")).toHaveText("0%");
  await expect(page.locator("#seeds")).toHaveText("3");
  expect(errors).toEqual([]);
  await page.screenshot({
    path: "test-results/desktop-garden.png",
    fullPage: true,
  });
});

test("keyboard movement, pause freezing, settings, and simulated standard controller", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.testPad = {
      connected: true,
      mapping: "standard",
      axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
    };
    navigator.getGamepads = () => [window.testPad];
  });
  await page.goto("/");
  await expect(page.locator("#begin")).toBeVisible();
  const press = async (index) => {
    await page.evaluate(async (i) => {
      const frames = () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        );
      window.testPad.buttons[i].pressed = true;
      await frames();
      window.testPad.buttons[i].pressed = false;
      await frames();
    }, index);
  };
  await press(0);
  await expect(page.locator("#welcome")).toBeHidden();
  await press(2);
  await expect(page.locator('[data-helper="pebble"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await press(2);
  await expect(page.locator("#goal-action")).toBeDisabled();
  await press(9);
  await expect(page.locator("#pause-dialog")).toBeVisible();
  await page.waitForTimeout(700);
  await expect(page.locator("#progress-label")).toHaveText("0%");
  await press(9);
  await expect(page.locator("#pause-dialog")).toBeHidden();
  await expect(page.locator("#progress-label")).toHaveText("20%", {
    timeout: 12000,
  });
  await expect(page.locator("#input-mode")).toContainText("Controller");
  // Moving must still work after selecting a helper with a mouse (button focus).
  await page.locator('[data-helper="pebble"]').click();
  await page.keyboard.down("ArrowLeft");
  await page.waitForTimeout(500);
  await page.keyboard.up("ArrowLeft");
  await page.waitForTimeout(2200);
  const x = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("bloom-brigade-save-v1")).helpers.pebble
        .x,
  );
  expect(x).toBeLessThan(-2);
  await page.locator("#settings").click();
  await page.locator("#binding-left").fill("z");
  await page.locator("#binding-right").fill("z");
  await page.locator("#close-settings").click();
  await expect(page.locator("#binding-error")).toContainText("different keys");
  await page.locator("#binding-right").fill("x");
  await page.locator("#motion-toggle").check();
  await page.locator("#close-settings").click();
  await expect(page.locator("body")).toHaveClass(/reduce-motion/);
});

test("touch-sized layout is usable without horizontal overflow", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.goto("/");
  await page.locator("#begin").tap();
  await expect(page.locator(".touch-controls")).toBeVisible();
  await expect(page.locator("#input-mode")).toContainText("Touch");
  await expect(page.locator('[data-site="seeds"]')).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  );
  expect(overflow).toBe(false);
  await page.locator("#goal-action").tap();
  await page.locator("#goal-action").tap();
  await expect(page.locator("#progress-label")).toHaveText("20%", {
    timeout: 15000,
  });
  // Completed and unrelated task labels stay out of the small-screen view.
  await expect(page.locator("#site-labels button:visible")).toHaveCount(0);
  await page.screenshot({
    path: "test-results/mobile-garden.png",
    fullPage: true,
  });
  await context.close();
});
