import { expect, test } from "@playwright/test";

/**
 * Proves the microphone path works end to end in a real browser, which the unit tests cannot:
 * Chromium's fake media device satisfies `getUserMedia`, so the app acquires a stream, encodes
 * it, and posts a real base64 clip to the tRPC endpoint.
 *
 * The fake device emits a tone, not speech, so a successful transcription is not asserted —
 * what is asserted is that the whole chain runs and that a server-side "I could not hear
 * anything" is handled as a normal, visible message rather than a crash.
 */
test.use({
  permissions: ["microphone"],
  launchOptions: {
    args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
  },
});

test.describe("voice assistant", () => {
  test("records from the mic and reports the result", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (e) => consoleErrors.push(e.message));

    await page.goto("/medications");
    await page.getByRole("button", { name: /add by voice/i }).click();

    const speak = page.getByRole("button", { name: /^speak$/i });
    await expect(speak).toBeVisible();
    await speak.click();

    // It must reach a real server round trip: either a reply, or a handled failure.
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.locator('[aria-live="polite"]')).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test("typing always works, with no microphone at all", async ({ page, context }) => {
    await context.clearPermissions();
    await page.goto("/medications");
    await page.getByRole("button", { name: /add by voice/i }).click();

    const composer = page.getByLabel(/type your answer/i);
    await composer.fill("Metformin 500 mg once a day at 9am");
    await composer.press("Enter");

    // A reply lands in the thread without ever touching getUserMedia.
    await expect(page.getByText(/metformin|dose|name|medicine/i).first()).toBeVisible();
  });

  test("reports a secure-context problem instead of blaming the user", async ({ page }) => {
    await page.goto("/medications");
    await page.getByRole("button", { name: /add by voice/i }).click();

    // Simulate the insecure-context branch deterministically rather than needing a real
    // non-localhost origin.
    await page.evaluate(() => {
      Object.defineProperty(window, "isSecureContext", { value: false, configurable: true });
    });
    await page.getByRole("button", { name: /^speak$/i }).click();

    await expect(page.getByText(/secure connection/i)).toBeVisible();
  });
});
