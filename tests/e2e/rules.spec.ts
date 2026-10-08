import { test, expect, type Page } from "@playwright/test";
import { Chess } from "chess.js";
async function setup(page: Page, fen: string, side = "w") {
  await page.goto(`/tests/board.html?${new URLSearchParams({ fen, side })}`);
}
async function move(page: Page, from: string, to: string) {
  await page.locator(`[data-square="${from}"]`).click();
  await page.locator(`[data-square="${to}"]`).click();
}
test("board executes both castlings and places the rook correctly", async ({
  page,
}) => {
  for (const [to, rook, san] of [
    ["g1", "f1", "O-O"],
    ["c1", "d1", "O-O-O"],
  ]) {
    await setup(page, "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
    await move(page, "e1", to);
    await expect(page.locator(`[data-square="${rook}"]`)).toHaveAttribute(
      "aria-label",
      new RegExp("branca r"),
    );
    await expect(page.getByTestId("history")).toHaveText(san);
  }
});
test("board executes en passant and removes the pawn on the neighboring square", async ({
  page,
}) => {
  await setup(
    page,
    "rnbqkbnr/1pp1pppp/p7/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3",
  );
  await move(page, "e5", "d6");
  await expect(page.locator('[data-square="d5"] .piece')).toHaveCount(0);
  await expect(page.locator('[data-square="d6"]')).toHaveAttribute(
    "aria-label",
    "d6 branca p",
  );
  await expect(page.getByTestId("history")).toHaveText("exd6");
});
for (const [name, piece] of [
  ["Dama", "q"],
  ["Torre", "r"],
  ["Bispo", "b"],
  ["Cavalo", "n"],
])
  test(`promotion dialog chooses ${name} for both colors`, async ({ page }) => {
    for (const [fen, from, to, side, color] of [
      ["7k/P7/8/8/8/8/8/7K w - - 0 1", "a7", "a8", "w", "branca"],
      ["7k/8/8/8/8/8/p7/7K b - - 0 1", "a2", "a1", "b", "preta"],
    ]) {
      await setup(page, fen, side);
      await move(page, from, to);
      await expect(
        page.getByRole("dialog", { name: "Promover peão" }),
      ).toBeVisible();
      await expect(page.locator(`[data-square="${from}"] .piece`)).toHaveCount(
        1,
      );
      await page.getByRole("button", { name, exact: true }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(page.locator(`[data-square="${to}"]`)).toHaveAttribute(
        "aria-label",
        `${to} ${color} ${piece}`,
      );
    }
  });
test("promotion cancellation preserves position; keyboard stays in the dialog", async ({
  page,
}) => {
  await setup(page, "7k/P7/8/8/8/8/8/7K w - - 0 1");
  await move(page, "a7", "a8");
  await expect(
    page.getByRole("button", { name: "Dama", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("button", { name: "Cancelar", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator('[data-square="a7"] .piece')).toHaveCount(1);
  await expect(page.getByTestId("history")).toBeEmpty();
});
test("king in check is highlighted and unsafe destinations are rejected", async ({
  page,
}) => {
  await setup(page, "4k3/8/8/8/8/8/4r3/4K3 w - - 0 1");
  await expect(page.locator('[data-square="e1"]')).toHaveClass(/incheck/);
  await expect(page.getByRole("status")).toHaveText("Em xeque");
  await move(page, "e1", "d2");
  await expect(page.getByTestId("history")).toBeEmpty();
  await move(page, "e1", "d1");
  await expect(page.getByTestId("history")).toHaveText("Kd1");
  await expect(page.locator(".incheck")).toHaveCount(0);
});
test("checkmate, stalemate, insufficient material and 50-move draw stop interaction", async ({
  page,
}) => {
  const mate = new Chess();
  for (const m of ["f3", "e5", "g4", "Qh4#"]) mate.move(m);
  for (const [fen, text] of [
    [mate.fen(), "Xeque-mate! Vitória das pretas."],
    ["7k/5Q2/6K1/8/8/8/8/8 b - - 0 1", "Empate por afogamento."],
    ["7k/8/6K1/8/8/8/8/8 w - - 0 1", "Empate por material insuficiente."],
    ["7k/8/6K1/8/8/8/8/R7 w - - 100 51", "Partida empatada."],
  ]) {
    await setup(page, fen);
    await expect(page.getByRole("status")).toHaveText(text);
    const original = await page.getByTestId("fen").textContent();
    await move(page, "h8", "g8");
    await expect(page.getByTestId("fen")).toHaveText(original!);
  }
});
test("triple repetition is detected through actual board moves and stops further play", async ({
  page,
}) => {
  await setup(page, new Chess().fen());
  for (let i = 0; i < 2; i++)
    for (const [from, to] of [
      ["g1", "f3"],
      ["g8", "f6"],
      ["f3", "g1"],
      ["f6", "g8"],
    ])
      await move(page, from, to);
  await expect(page.getByRole("status")).toHaveText(
    "Empate por repetição tripla.",
  );
  await move(page, "e2", "e4");
  await expect(page.getByTestId("history")).toHaveText(
    "Nf3 Nf6 Ng1 Ng8 Nf3 Nf6 Ng1 Ng8",
  );
});
