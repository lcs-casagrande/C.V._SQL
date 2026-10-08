import { test, expect, type Page } from "@playwright/test";
import { Chess } from "chess.js";
import { openings, type Opening } from "../../src/openings";
import { PROGRESS_KEY } from "../../src/progress";
async function tick(page: Page, ms = 1400) {
  await page.clock.runFor(ms);
}
async function clickMove(page: Page, from: string, to: string) {
  await page.locator(`[data-square="${from}"]`).click();
  await page.locator(`[data-square="${to}"]`).click();
}
async function go(page: Page, desktop: string, mobile: string) {
  const narrow = page.viewportSize()!.width <= 600;
  await (
    narrow
      ? page
          .getByRole("navigation", { name: "Navegação principal" })
          .getByRole("button", { name: mobile, exact: true })
      : page
          .locator(".sidebar nav")
          .getByRole("button", { name: desktop, exact: true })
  ).click();
}
async function wins(page: Page, id: string) {
  return page.evaluate(
    ({ key, id }) => JSON.parse(localStorage.getItem(key) || "{}")[id]?.wins,
    { key: PROGRESS_KEY, id },
  );
}
async function beginTutorial(page: Page, o: Opening) {
  await go(page, "Aprender aberturas", "Aprender");
  await page
    .getByRole("button", {
      name: o.color === "w" ? "♔ Peças brancas" : "♚ Peças pretas",
      exact: true,
    })
    .click();
  await page
    .locator(".opening-card")
    .filter({ has: page.getByRole("heading", { name: o.name, exact: true }) })
    .getByRole("button", { name: "Aprender", exact: true })
    .click();
  await tick(page);
}
async function beginPractice(page: Page, o: Opening) {
  await go(page, "Central de repetição", "Repetir");
  await page
    .locator(".repeat-item")
    .filter({ hasText: o.name })
    .getByRole("button", { name: "Praticar", exact: true })
    .click();
  await tick(page);
}
async function executeLine(page: Page, o: Opening, tutorial: boolean) {
  const c = new Chess();
  for (const san of o.line) {
    const own = c.turn() === o.color;
    const move = c.moves({ verbose: true }).find((m) => m.san === san)!;
    if (own) {
      if (tutorial) {
        await expect(
          page.getByRole("heading", { name: `Sua vez: ${san}`, exact: true }),
        ).toBeVisible();
        await expect(page.locator(".lesson-explanation")).toHaveText(
          o.notes[san],
        );
        await expect(page.locator(".hint-target")).toHaveCount(1);
      } else {
        await expect(
          page.locator(".hint,.hint-target,.move-dot,.capture-ring"),
        ).toHaveCount(0);
        await expect(page.locator(".lesson-card")).not.toContainText(
          "Sua vez:",
        );
      }
      await clickMove(page, move.from, move.to);
      await tick(page);
    }
    c.move(san);
  }
  await expect(
    page.getByRole("heading", {
      name: tutorial ? "Abertura aprendida!" : "Sequência perfeita!",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".move-row strong")).toHaveText(o.line);
}
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("response", (response) => {
    if (
      response.url().startsWith("http://127.0.0.1:5173/") &&
      response.status() >= 400
    )
      errors.push(`HTTP ${response.status()}: ${response.url()}`);
  });
  (page as Page & { runtimeErrors: string[] }).runtimeErrors = errors;
  await page.clock.install();
  await page.goto("/");
});
test.afterEach(async ({ page }) => {
  expect((page as Page & { runtimeErrors: string[] }).runtimeErrors).toEqual(
    [],
  );
});
test("all main pages navigate and fit the viewport", async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: /Domine o tabuleiro/ }),
  ).toBeVisible();
  for (const [desktop, mobile, heading] of [
    ["Jogo livre", "Jogar", "Jogo livre"],
    ["Aprender aberturas", "Aprender", "Treinar aberturas"],
    ["Central de repetição", "Repetir", "Central de repetição"],
    ["Visão geral", "Início", "Domine o tabuleiro."],
  ] as const) {
    await go(page, desktop, mobile);
    await expect(
      page.getByRole("heading", { name: new RegExp(heading) }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.screenshot({
    path: `test-results/home-${page.viewportSize()!.width}.png`,
    fullPage: true,
  });
});
for (const o of openings) {
  test(`${o.name}: explanation, retry without reset, automatic replies and orientation`, async ({
    page,
  }) => {
    await beginTutorial(page, o);
    await expect(page.locator(".square").first()).toHaveAttribute(
      "data-square",
      o.color === "w" ? "a8" : "h1",
    );
    const first = o.color === "w" ? 0 : 1;
    const c = new Chess();
    for (const san of o.line.slice(0, first)) c.move(san);
    const wrong = c
      .moves({ verbose: true })
      .find((m) => m.san !== o.line[first])!;
    await clickMove(page, wrong.from, wrong.to);
    await expect(page.locator(".feedback.bad")).toContainText(
      `pede ${o.line[first]}`,
    );
    await expect(
      page.locator(`[data-square="${wrong.from}"] .piece`),
    ).toBeVisible();
    await expect(page.locator(".lesson-kicker")).toContainText(
      `${first}/${o.line.length}`,
    );
    await executeLine(page, o, true);
    expect(await wins(page, o.id)).toBe(0);
    expect(
      await page.evaluate(
        ({ key, id }) => JSON.parse(localStorage.getItem(key)!)[id].studied,
        { key: PROGRESS_KEY, id: o.id },
      ),
    ).toBe(true);
    await page.reload();
    expect(
      await page.evaluate(
        ({ key, id }) => JSON.parse(localStorage.getItem(key)!)[id].studied,
        { key: PROGRESS_KEY, id: o.id },
      ),
    ).toBe(true);
  });
  test(`${o.name}: three nonconsecutive successes, no hints, mastery survives reload`, async ({
    page,
  }) => {
    await beginPractice(page, o);
    await executeLine(page, o, false);
    expect(await wins(page, o.id)).toBe(1);
    await page
      .getByRole("button", { name: "Praticar novamente", exact: true })
      .click();
    await tick(page);
    const c = new Chess();
    if (o.color === "b") c.move(o.line[0]);
    const expected = o.line[o.color === "w" ? 0 : 1];
    const wrong = c.moves({ verbose: true }).find((m) => m.san !== expected)!;
    await clickMove(page, wrong.from, wrong.to);
    await expect(page.locator(".feedback.bad")).toContainText(
      "tentativa teve um erro",
    );
    await expect(page.locator(".feedback.bad")).not.toContainText(
      `pede ${expected}`,
    );
    await expect(page.locator(".hint-target")).toHaveCount(0);
    expect(await wins(page, o.id)).toBe(1);
    await tick(page, 3000);
    await tick(page);
    expect(await wins(page, o.id)).toBe(1);
    await executeLine(page, o, false);
    expect(await wins(page, o.id)).toBe(2);
    await page
      .getByRole("button", { name: "Praticar novamente", exact: true })
      .click();
    await tick(page);
    await executeLine(page, o, false);
    expect(await wins(page, o.id)).toBe(3);
    await expect(page.locator(".dominated")).toContainText("Abertura dominada");
    await page.reload();
    await go(page, "Central de repetição", "Repetir");
    const row = page.locator(".repeat-item").filter({ hasText: o.name });
    await expect(row.locator(".status")).toHaveText("Dominada");
    await expect(row.locator(".filled")).toHaveCount(3);
    expect(await wins(page, o.id)).toBe(3);
  });
}
test("free game: both sides, automatic computer, history, restart and resignation cancellation", async ({
  page,
}) => {
  await go(page, "Jogo livre", "Jogar");
  await clickMove(page, "e2", "e4");
  await expect(page.locator(".player-status").first()).toHaveText(
    "Pensando...",
  );
  await tick(page);
  await expect(page.locator(".history .panel-heading span")).toHaveText(
    "2 meios-lances",
  );
  await expect(page.locator(".move-row strong").first()).toHaveText("e4");
  await page.getByRole("button", { name: "Nova partida", exact: true }).click();
  await expect(page.locator(".history-empty")).toBeVisible();
  await page.getByRole("button", { name: "♚ Pretas", exact: true }).click();
  await tick(page);
  await expect(page.locator(".square").first()).toHaveAttribute(
    "data-square",
    "h1",
  );
  await expect(page.locator(".history .panel-heading span")).toHaveText(
    "1 meios-lances",
  );
  await clickMove(page, "e7", "e5");
  await tick(page);
  await expect(page.locator(".history .panel-heading span")).toHaveText(
    "3 meios-lances",
  );
  await page.getByRole("button", { name: "♔ Brancas", exact: true }).click();
  await clickMove(page, "d2", "d4");
  await page
    .getByRole("button", { name: "Desistir da partida", exact: true })
    .click();
  await tick(page);
  await expect(page.locator(".result-card")).toContainText(
    "Você desistiu. Vitória das pretas.",
  );
  await expect(page.locator(".history .panel-heading span")).toHaveText(
    "1 meios-lances",
  );
  await page
    .getByRole("button", { name: "Jogar novamente", exact: true })
    .click();
  await expect(page.locator(".history-empty")).toBeVisible();
  await page.screenshot({
    path: `test-results/game-${page.viewportSize()!.width}.png`,
    fullPage: true,
  });
});
test("rapid restart and navigation cancel stale opponent callbacks", async ({
  page,
}) => {
  await go(page, "Jogo livre", "Jogar");
  await clickMove(page, "e2", "e4");
  await page.getByRole("button", { name: "Nova partida", exact: true }).click();
  await tick(page);
  await expect(page.locator(".history-empty")).toBeVisible();
  await beginTutorial(page, openings[2]);
  await page.getByRole("button", { name: "Reiniciar", exact: true }).click();
  await tick(page);
  await expect(page.locator(".history .panel-heading span")).toHaveText(
    "1 meios-lances",
  );
  await go(page, "Visão geral", "Início");
  await tick(page);
  await expect(
    page.getByRole("heading", { name: /Domine o tabuleiro/ }),
  ).toBeVisible();
});
test("native mouse drag or touch pointer drag moves a piece and CPU answers", async ({
  page,
  isMobile,
}) => {
  await go(page, "Jogo livre", "Jogar");
  const from = page.locator('[data-square="e2"] .piece'),
    to = page.locator('[data-square="e4"]');
  if (isMobile) {
    const start = (await from.boundingBox())!,
      end = (await to.boundingBox())!;
    const session = await page.context().newCDPSession(page);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [
        { x: start.x + start.width / 2, y: start.y + start.height / 2 },
      ],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: end.x + end.width / 2, y: end.y + end.height / 2 }],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await session.detach();
  } else await from.dragTo(to);
  await tick(page);
  await expect(page.locator(".move-row strong").first()).toHaveText("e4");
  await expect(page.locator(".history .panel-heading span")).toHaveText(
    "2 meios-lances",
  );
});
test("invalid drag fails a practice attempt without awarding success", async ({
  page,
}) => {
  await beginPractice(page, openings[0]);
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  const from = page.locator('[data-square="e2"] .piece');
  await from.dispatchEvent("dragstart", { dataTransfer });
  await page
    .locator('[data-square="e5"]')
    .dispatchEvent("drop", { dataTransfer });
  await expect(page.locator(".feedback.bad")).toContainText(
    "Movimento inválido",
  );
  expect(await wins(page, "italiana")).toBe(0);
  await tick(page, 2200);
  await executeLine(page, openings[0], false);
  expect(await wins(page, "italiana")).toBe(1);
});
test("blocked storage shows a notice while the app remains usable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = function () {
      throw new DOMException("Blocked", "SecurityError");
    };
  });
  await page.reload();
  await expect(page.getByRole("status")).toContainText("não será salvo");
  await beginTutorial(page, openings[0]);
  await executeLine(page, openings[0], true);
});
test("broken saved progress does not crash the home page", async ({ page }) => {
  await page.evaluate(
    (key) => localStorage.setItem(key, "{invalid"),
    PROGRESS_KEY,
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: /Domine o tabuleiro/ }),
  ).toBeVisible();
  expect(await wins(page, "italiana")).toBe(0);
});
test("layout remains usable at 320px, tablet and compact desktop widths", async ({
  page,
}) => {
  for (const width of [320, 768, 1024]) {
    await page.setViewportSize({ width, height: 1000 });
    await go(page, "Jogo livre", "Jogar");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const board = await page.locator(".board").boundingBox();
    expect(board!.width).toBeGreaterThan(260);
    expect(Math.abs(board!.width - board!.height)).toBeLessThan(2);
    await clickMove(page, "e2", "e4");
    await tick(page);
    await expect(page.locator(".history .panel-heading span")).toHaveText(
      "2 meios-lances",
    );
  }
});
test("bundled fonts load without external requests", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (request) => {
    if (
      /^https?:/.test(request.url()) &&
      !request.url().startsWith("http://127.0.0.1:5173/")
    )
      external.push(request.url());
  });
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(() =>
      document.fonts.check('400 16px "DM Sans Variable"'),
    ),
  ).toBe(true);
  expect(
    await page.evaluate(() =>
      document.fonts.check('700 24px "Outfit Variable"'),
    ),
  ).toBe(true);
  expect(external).toEqual([]);
});
