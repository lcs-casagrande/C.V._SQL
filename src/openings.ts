export type Color = "w" | "b";
export type Opening = {
  id: string;
  name: string;
  short: string;
  color: Color;
  subtitle: string;
  objective: string;
  line: string[];
  notes: Record<string, string>;
  responseNotes: Record<string, string>;
  icon: string;
};
export const openings: Opening[] = [
  {
    id: "italiana",
    name: "Abertura Italiana",
    short: "Italiana",
    color: "w",
    subtitle: "Desenvolvimento rápido e pressão em f7",
    objective: "Desenvolver as peças, dominar o centro e preparar o roque.",
    line: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5"],
    notes: {
      e4: "Avance o peão do rei duas casas. Você ganha espaço no centro e libera as diagonais do bispo e da dama.",
      Nf3: "Desenvolva o cavalo de g1 para f3. Ele ataca o peão e5 e prepara o roque.",
      Bc4: "Leve o bispo de f1 para c4. Ele mira a região sensível de f7, próxima ao rei adversário.",
    },
    responseNotes: {
      e5: "As pretas também ocupam o centro e liberam suas peças.",
      Nc6: "O cavalo protege e5 e se desenvolve para uma casa ativa.",
      Bc5: "As pretas desenvolvem o bispo e miram f2, criando uma posição simétrica.",
    },
    icon: "♗",
  },
  {
    id: "gambito",
    name: "Gambito da Dama",
    short: "Gambito da Dama",
    color: "w",
    subtitle: "Pressão estratégica sobre o centro",
    objective:
      "Disputar o controle central e pressionar o peão d5, na linha do Gambito da Dama Recusado.",
    line: ["d4", "d5", "c4", "e6", "Nc3", "Nf6"],
    notes: {
      d4: "Avance o peão da dama até d4 para ocupar o centro e controlar e5.",
      c4: "Ofereça o peão de c4 para atacar a sustentação do peão preto em d5. É a ideia do gambito.",
      Nc3: "Desenvolva o cavalo de b1 para c3 e aumente seu controle de e4 e d5.",
    },
    responseNotes: {
      d5: "As pretas contestam o centro com o próprio peão da dama.",
      e6: "As pretas recusam o gambito, apoiam d5 e mantêm uma estrutura sólida.",
      Nf6: "O cavalo se desenvolve e pressiona a casa e4.",
    },
    icon: "♕",
  },
  {
    id: "siciliana",
    name: "Defesa Siciliana",
    short: "Siciliana",
    color: "b",
    subtitle: "Contra-ataque assimétrico e ativo",
    objective:
      "Contestar d4, criar assimetria e preparar contra-ataques pelo centro.",
    line: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6"],
    notes: {
      c5: "Mova o peão de c7 para c5. Você controla d4 e cria uma estrutura assimétrica.",
      d6: "Jogue d7–d6 para sustentar o centro e liberar o bispo de c8.",
      cxd4: "Capture com o peão de c5 em d4. Você troca um peão lateral pelo peão central branco.",
      Nf6: "Desenvolva o cavalo de g8 para f6, atacando imediatamente o peão e4.",
    },
    responseNotes: {
      e4: "As brancas ocupam o centro e liberam o bispo e a dama.",
      Nf3: "As brancas desenvolvem o cavalo e preparam o avanço d4.",
      d4: "As brancas abrem o centro e oferecem uma troca de peões.",
      Nxd4: "O cavalo recaptura em d4, assumindo uma posição central ativa.",
    },
    icon: "♞",
  },
  {
    id: "francesa",
    name: "Defesa Francesa",
    short: "Francesa",
    color: "b",
    subtitle: "Solidez e pressão sobre e4",
    objective:
      "Construir uma estrutura sólida e desafiar o centro branco, na linha inicial da Variante Clássica.",
    line: ["e4", "e6", "d4", "d5", "Nc3", "Nf6"],
    notes: {
      e6: "Avance e7–e6. Este lance prepara d5 e apoia uma estrutura central sólida.",
      d5: "Avance d7–d5. Agora você desafia diretamente o centro branco.",
      Nf6: "Desenvolva o cavalo de g8 para f6 e pressione o peão de e4.",
    },
    responseNotes: {
      e4: "As brancas começam ocupando o centro.",
      d4: "As brancas formam um centro de peões forte em e4 e d4.",
      Nc3: "O cavalo apoia e4 e se desenvolve para uma casa natural.",
    },
    icon: "♜",
  },
];
export function lineText(line: string[]) {
  return line
    .reduce(
      (s, m, i) =>
        s +
        (i % 2 === 0 ? `${i / 2 + 1}. ${m}` : ` ${m}`) +
        (i % 2 === 1 ? "  " : ""),
      "",
    )
    .trim();
}
