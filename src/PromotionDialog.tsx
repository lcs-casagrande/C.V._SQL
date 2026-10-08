import { useEffect, useRef } from "react";
import { glyph } from "./Board";
import type { Color } from "./openings";
import type { PromotionPiece } from "./chess";
export function PromotionDialog({
  color,
  onChoose,
  onCancel,
}: {
  color: Color;
  onChoose: (piece: PromotionPiece) => void;
  onCancel: () => void;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector("button")?.focus();
    return () => previous?.focus();
  }, []);
  return (
    <div className="modal-backdrop">
      <div
        ref={dialog}
        className="promotion-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Promover peão"
        onKeyDown={(event) => {
          if (event.key === "Escape") onCancel();
          if (event.key === "Tab") {
            const buttons = Array.from(
              dialog.current?.querySelectorAll("button") || [],
            );
            const index = buttons.indexOf(
              document.activeElement as HTMLButtonElement,
            );
            event.preventDefault();
            buttons[
              (index + (event.shiftKey ? -1 : 1) + buttons.length) %
                buttons.length
            ]?.focus();
          }
        }}
      >
        <h3>Promover peão</h3>
        <p>Escolha a peça para a promoção.</p>
        <div className="promotion-choices">
          {(["q", "r", "b", "n"] as const).map((piece) => (
            <button
              key={piece}
              aria-label={
                { q: "Dama", r: "Torre", b: "Bispo", n: "Cavalo" }[piece]
              }
              onClick={() => onChoose(piece)}
            >
              {glyph[color + piece]}
            </button>
          ))}
        </div>
        <button className="secondary-btn" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
