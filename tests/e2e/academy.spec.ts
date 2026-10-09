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
    .filter({ has: page.getByText(o.name, { exact: true }) })
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
    const row = page
      .locator(".repeat-item")
      .filter({ has: page.getByText(o.name, { exact: true }) });
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
test("custom random training honors individual targets, alternates colors and finishes", async ({
  page,
}) => {
  await page.evaluate(() => {
    Math.random = () => 0;
  });
  await go(page, "Central de repetição", "Repetir");
  await page.getByText("Selecionar aberturas (0)", { exact: true }).click();
  await page
    .getByRole("checkbox", { name: "Gambito da Rainha", exact: true })
    .check();
  await page
    .getByRole("checkbox", { name: "Defesa Siciliana", exact: true })
    .check();
  await page
    .getByRole("spinbutton", {
      name: "Repetições de Gambito da Rainha",
      exact: true,
    })
    .fill("1");
  await page
    .getByRole("spinbutton", {
      name: "Repetições de Defesa Siciliana",
      exact: true,
    })
    .fill("2");
  await page
    .getByRole("button", { name: "Iniciar treino aleatório", exact: true })
    .click();
  for (const [index, id] of ["gambito", "siciliana", "siciliana"].entries()) {
    const opening = openings.find((o) => o.id === id)!;
    await tick(page);
    await expect(
      page.getByRole("heading", { name: new RegExp(`^${opening.name} MODO`) }),
    ).toBeVisible();
    await expect(page.locator(".square").first()).toHaveAttribute(
      "data-square",
      opening.color === "w" ? "a8" : "h1",
    );
    // An error starts a new attempt but keeps session goals and completed openings.
    if (index === 1) {
      await clickMove(page, "a7", "a6");
      await expect(page.locator(".feedback.bad")).toBeVisible();
      await tick(page, 2000);
      await tick(page);
      await expect(
        page
          .locator(".training-session-row")
          .filter({ hasText: "Gambito da Rainha" }),
      ).toContainText("1/1");
    }
    const c = new Chess();
    for (const san of opening.line) {
      const own = c.turn() === opening.color;
      const m = c.moves({ verbose: true }).find((m) => m.san === san)!;
      if (own) {
        await expect(page.locator(".hint-target")).toHaveCount(0);
        await clickMove(page, m.from, m.to);
        await tick(page, 1200);
      }
      c.move(san);
    }
    if (index < 2) {
      await expect(
        page.getByRole("heading", { name: "Sequência perfeita!", exact: true }),
      ).toBeVisible();
      await tick(page, 2200);
    }
  }
  await expect(
    page.getByRole("heading", { name: "Treino concluído!", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".training-session-row").filter({ hasText: "Siciliana" }),
  ).toContainText("2/2");
  expect(await wins(page, "gambito")).toBe(1);
  expect(await wins(page, "siciliana")).toBe(2);
  await tick(page, 5000);
  await expect(
    page.getByRole("heading", { name: "Treino concluído!", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Voltar à central", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Central de repetição", exact: true }),
  ).toBeVisible();
});
test("training configuration prevents empty selection and invalid repetition counts", async ({
  page,
}) => {
  await go(page, "Central de repetição", "Repetir");
  const start = page.getByRole("button", {
    name: "Iniciar treino aleatório",
    exact: true,
  });
  await expect(start).toBeDisabled();
  await page.getByText("Selecionar aberturas (0)", { exact: true }).click();
  await page
    .getByRole("checkbox", { name: "Abertura Italiana", exact: true })
    .check();
  const count = page.getByRole("spinbutton", {
    name: "Repetições de Abertura Italiana",
    exact: true,
  });
  await count.fill("0");
  await expect(start).toBeDisabled();
  await count.fill("1.5");
  await expect(start).toBeDisabled();
  await count.fill("4");
  await expect(start).toBeEnabled();
  await start.click();
  await expect(page.locator(".training-session")).toContainText("0/4");
  await expect(page.locator(".memory-count strong")).toHaveText(["0", "4"]);
  await expect(page.locator(".step-eyebrow")).toHaveText("REPETIÇÃO 1 DE 4");
  await page
    .getByRole("button", { name: "Encerrar treino", exact: true })
    .click();
  await tick(page, 3000);
  await expect(
    page.getByRole("heading", { name: "Central de repetição", exact: true }),
  ).toBeVisible();
  expect(await wins(page, "italiana")).toBe(0);
});
test("fullscreen board fits viewport and instructions can be shown, hidden and exited", async ({
  page,
}) => {
  await beginTutorial(page, openings[0]);
  await page.getByRole("button", { name: "Tela cheia", exact: true }).click();
  await expect(page.locator(".board-fullscreen")).toBeVisible();
  await expect(page.locator(".right-column")).toBeHidden();
  await expect(page.locator(".hint-target")).toHaveCount(0);
  const size = page.viewportSize()!;
  const box = (await page.locator(".board").boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(60);
  expect(box.x + box.width).toBeLessThanOrEqual(size.width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(size.height + 1);
  await page
    .getByRole("button", { name: "Mostrar instruções", exact: true })
    .click();
  await expect(page.locator(".right-column")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Sua vez: e4", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".hint-target")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Ocultar instruções", exact: true })
    .click();
  await clickMove(page, "e2", "e4");
  await tick(page);
  await expect(page.locator(".board-fullscreen")).toBeVisible();
  await page
    .getByRole("button", { name: "Mostrar instruções", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Sua vez: Nf3", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page.locator(".board-fullscreen")).toHaveCount(0);
  await expect(page.locator(".history .panel-heading span")).toHaveText(
    "2 meios-lances",
  );
});
test("fullscreen fallback works without browser API and Escape restores layout", async ({
  page,
}) => {
  await page.evaluate(() => {
    HTMLElement.prototype.requestFullscreen =
      undefined as unknown as typeof HTMLElement.prototype.requestFullscreen;
  });
  await go(page, "Jogo livre", "Jogar");
  await page.getByRole("button", { name: "Tela cheia", exact: true }).click();
  await page.setViewportSize({ width: 700, height: 360 });
  const box = (await page.locator(".board").boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(361);
  expect(box.x + box.width).toBeLessThanOrEqual(701);
  await page.keyboard.press("Escape");
  await expect(page.locator(".board-fullscreen")).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
    "hidden",
  );
});
test("expanded catalog has five white and nine black lessons and preserves legacy totals", async ({
  page,
}) => {
  await page.evaluate(
    (key) =>
      localStorage.setItem(
        key,
        JSON.stringify({
          gambito: { studied: true, wins: 3 },
          siciliana: { studied: true, wins: 2 },
        }),
      ),
    PROGRESS_KEY,
  );
  await page.reload();
  await go(page, "Aprender aberturas", "Aprender");
  await expect(page.locator(".opening-card")).toHaveCount(5);
  await page
    .getByRole("button", { name: "♚ Peças pretas", exact: true })
    .click();
  await expect(page.locator(".opening-card")).toHaveCount(9);
  await expect(
    page.getByRole("heading", {
      name: "Gambito da Rainha Recusado",
      exact: true,
    }),
  ).toBeVisible();
  await go(page, "Central de repetição", "Repetir");
  await expect(page.locator(".repeat-item")).toHaveCount(14);
  await expect(page.locator(".repeat-summary")).toContainText(
    "1 de 14 aberturas dominadas",
  );
  await expect(page.locator(".repeat-summary")).toContainText("5 de 42");
  await page.getByText("Selecionar aberturas (0)", { exact: true }).click();
  await expect(page.getByRole("checkbox")).toHaveCount(14);
  await page
    .getByRole("checkbox", { name: "Defesa Caro-Kann", exact: true })
    .check();
  await page
    .getByRole("button", { name: "Iniciar treino aleatório", exact: true })
    .click();
  await tick(page);
  await expect(page.locator(".square").first()).toHaveAttribute(
    "data-square",
    "h1",
  );
  await expect(
    page.getByRole("heading", { name: /Defesa Caro-Kann MODO/ }),
  ).toBeVisible();
  expect(await wins(page, "gambito")).toBe(3);
});
