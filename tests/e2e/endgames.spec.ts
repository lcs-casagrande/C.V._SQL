import { test, expect, type Page } from "@playwright/test";
import { Chess } from "chess.js";
import { endgameData, type Endgame } from "../../src/endgameData";
import { chooseEndgameMove } from "../../src/EndgameEngine";
import { ENDGAME_PROGRESS_KEY } from "../../src/EndgameProgress";
const lines: Record<string, string[]> = {
  queen: ["Kb6", "Qc5", "Qc6+", "Qb7#"],
  rook: ["Kc7", "Rh6", "Kb6", "Rh8#"],
  pawn: ["Kd7", "e6", "e7+", "e8=Q+"],
};
async function tick(page: Page) {
  await page.clock.runFor(1200);
}
async function move(page: Page, from: string, to: string) {
  await page.locator(`[data-square="${from}"]`).click();
  await page.locator(`[data-square="${to}"]`).click();
}
async function catalog(page: Page) {
  await page.getByRole("button", { name: /Explorar finais/ }).click();
}
async function begin(page: Page, e: Endgame, practice = true) {
  await page
    .locator(".endgame-card")
    .filter({ has: page.getByRole("heading", { name: e.name, exact: true }) })
    .getByRole("button", {
      name: practice ? "Praticar" : "Aprender",
      exact: true,
    })
    .click();
  await tick(page);
}
async function complete(page: Page, e: Endgame) {
  const g = new Chess(e.fen);
  for (const san of lines[e.id]) {
    if (g.turn() === "b") {
      g.move(chooseEndgameMove(g, e)!);
    }
    const m = g.moves({ verbose: true }).find((m) => m.san === san)!;
    await move(page, m.from, m.to);
    if (m.promotion)
      await page.getByRole("button", { name: "Dama", exact: true }).click();
    g.move(m);
    await tick(page);
  }
  await expect(
    page.getByRole("heading", { name: "Objetivo concluído!" }),
  ).toBeVisible();
}
async function stored(page: Page, id: string) {
  return page.evaluate(
    ({ key, id }) => JSON.parse(localStorage.getItem(key) || "{}")[id].wins,
    { key: ENDGAME_PROGRESS_KEY, id },
  );
}
test.beforeEach(async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
});
for (const e of endgameData) {
  test(`${e.name}: complete tutorial and independent exercise`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await catalog(page);
    await begin(page, e, false);
    await expect(
      page.getByRole("heading", { name: `1. ${e.stages[0].title}` }),
    ).toBeVisible();
    await expect(page.getByText(e.intro[0], { exact: true })).toBeVisible();
    await expect(
      page.locator(
        `[data-square="${e.id === "queen" ? "d4" : e.id === "rook" ? "h4" : "e5"}"]`,
      ),
    ).toHaveAttribute("aria-label", new RegExp(`branca ${e.piece}`));
    if (e.id === "pawn") {
      await expect(page.locator(".move-row strong").first()).toHaveText("—");
      await expect(page.locator(".move-row strong").nth(1)).toHaveText("Kf8");
    }
    await complete(page, e);
    expect(await stored(page, e.id)).toBe(0);
    await page
      .getByRole("button", { name: "Praticar sem dicas", exact: true })
      .click();
    await tick(page);
    await expect(page.getByText(e.intro[0], { exact: true })).toHaveCount(0);
    await page
      .locator(
        `[data-square="${e.id === "queen" ? "d4" : e.id === "rook" ? "h4" : "e5"}"]`,
      )
      .click();
    await expect(page.locator(".legal-dot,.legal-ring,.hint")).toHaveCount(0);
    await page
      .locator(
        `[data-square="${e.id === "queen" ? "d4" : e.id === "rook" ? "h4" : "e5"}"]`,
      )
      .click();
    await complete(page, e);
    expect(await stored(page, e.id)).toBe(1);
    await page.reload();
    await catalog(page);
    await expect(
      page
        .locator(".endgame-card")
        .filter({
          has: page.getByRole("heading", { name: e.name, exact: true }),
        }),
    ).toContainText("1/3");
    expect(errors).toEqual([]);
  });
}
test("Queen: stalemate preserves progress; three nonconsecutive completions master exercise", async ({
  page,
}) => {
  await catalog(page);
  await begin(page, endgameData[0]);
  for (let i = 0; i < 3; i++) {
    await complete(page, endgameData[0]);
    expect(await stored(page, "queen")).toBe(i + 1);
    await page
      .getByRole("button", { name: "Tentar novamente", exact: true })
      .click();
    await move(page, "d4", "b6");
    await expect(
      page.getByRole("heading", { name: "Tente novamente" }),
    ).toBeVisible();
    await expect(page.locator(".endgame-result")).toContainText("Afogamento");
    expect(await stored(page, "queen")).toBe(i + 1);
    await page
      .getByRole("button", { name: "Tentar novamente", exact: true })
      .click();
  }
  await page.reload();
  await catalog(page);
  await expect(page.locator(".endgame-card").first()).toContainText(
    "3/3 · Dominado",
  );
  await expect(page.getByText("Finais dominados: 1 de 3")).toBeVisible();
});
test("Endgame fullscreen, instructions toggle and responsive catalog", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await catalog(page);
  await expect(page.locator(".endgame-card")).toHaveCount(3);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await begin(page, endgameData[1], false);
  await page.getByRole("button", { name: "Tela cheia", exact: true }).click();
  await expect(page.locator(".right-column")).toBeHidden();
  const box = await page.locator(".board").boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(740);
  await page
    .getByRole("button", { name: "Mostrar instruções", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "1. Construir uma barreira" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Ocultar instruções", exact: true })
    .click();
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await move(page, "c6", "b7");
  await expect(page.getByRole("status")).toHaveText(
    "Esse movimento não é permitido pelas regras do xadrez. Escolha outra casa.",
  );
});
for (const [id, fen] of [
  ["rook", "8/8/8/8/2K5/8/1R6/k7 b - - 0 1"],
  ["pawn", "8/8/8/8/2K5/8/1P6/k7 b - - 0 1"],
] as const) {
  test(`${id}: captured essential material fails in training UI`, async ({
    page,
  }) => {
    await page.goto(`/tests/endgame.html?${new URLSearchParams({ id, fen })}`);
    await tick(page);
    await expect(
      page.getByRole("heading", { name: "Tente novamente" }),
    ).toBeVisible();
    await expect(page.locator(".endgame-result")).toContainText(
      "Material perdido",
    );
    await expect(page.getByTestId("wins")).toHaveText("0");
  });
}
test("Free endgame moves allow desktop dragging and actual mobile touch", async ({
  page,
}) => {
  await catalog(page);
  await begin(page, endgameData[0]);
  const from = page.locator('[data-square="d4"]'),
    to = page.locator('[data-square="d5"]');
  if (test.info().project.name === "mobile-chromium") {
    const a = (await from.boundingBox())!,
      b = (await to.boundingBox())!;
    const client = await page.context().newCDPSession(page);
    for (const [type, x, y] of [
      ["touchStart", a.x + a.width / 2, a.y + a.height / 2],
      ["touchMove", b.x + b.width / 2, b.y + b.height / 2],
      ["touchEnd", 0, 0],
    ] as const) {
      await client.send("Input.dispatchTouchEvent", {
        type,
        touchPoints: type === "touchEnd" ? [] : [{ x, y }],
      });
    }
  } else await from.dragTo(to);
  await expect(to).toHaveAttribute("aria-label", "d5 branca q");
  await tick(page);
  await expect(page.locator(".move-list")).toContainText("Qd5");
  expect(await stored(page, "queen")).toBe(0);
});
