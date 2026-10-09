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
function lesson(
  id: string,
  name: string,
  short: string,
  color: Color,
  subtitle: string,
  objective: string,
  line: string[],
  explanations: string[],
  icon: string,
): Opening {
  const notes: Record<string, string> = {},
    responseNotes: Record<string, string> = {};
  line.forEach((san, index) => {
    (index % 2 === (color === "w" ? 0 : 1) ? notes : responseNotes)[san] =
      explanations[index];
  });
  return {
    id,
    name,
    short,
    color,
    subtitle,
    objective,
    line,
    notes,
    responseNotes,
    icon,
  };
}
export const openings: Opening[] = [
  {
    id: "italiana",
    name: "Abertura Italiana",
    short: "Italiana",
    color: "w",
    subtitle: "Equilibrada; desenvolvimento e possibilidades de ataque.",
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
    name: "Gambito da Rainha",
    short: "Gambito da Rainha",
    color: "w",
    subtitle: "Estratégico; pressão sobre o centro.",
    objective:
      "Disputar o controle central e pressionar o peão d5, na linha do Gambito da Rainha Recusado.",
    line: ["d4", "d5", "c4", "e6", "Nc3", "Nf6"],
    notes: {
      d4: "Avance o peão da rainha até d4 para ocupar o centro e controlar e5.",
      c4: "Ofereça o peão de c4 para atacar a sustentação do peão preto em d5. É a ideia do gambito.",
      Nc3: "Desenvolva o cavalo de b1 para c3 e aumente seu controle de e4 e d5.",
    },
    responseNotes: {
      d5: "As pretas contestam o centro com o próprio peão da rainha.",
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
    subtitle: "Dinâmico; desequilíbrio e contra-ataque.",
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
    subtitle: "Estratégico; disputa o centro e busca contra-ataque.",
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
  lesson(
    "escocesa",
    "Abertura Escocesa",
    "Escocesa",
    "w",
    "Ativa; abre o centro cedo.",
    "Abrir o centro com d4 e desenvolver as peças com atividade.",
    ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Nxd4", "Nf6"],
    [
      "Avance e2–e4 para ocupar o centro e liberar o bispo e a rainha.",
      "As pretas ocupam o centro com e5.",
      "Desenvolva o cavalo de g1 para f3, atacando e5.",
      "As pretas desenvolvem o cavalo de b8 para c6 e defendem e5.",
      "Avance d2–d4 para abrir o centro imediatamente: esta é a ideia da Escocesa.",
      "As pretas capturam de e5 em d4 e abrem a coluna e.",
      "Recapture com o cavalo de f3 em d4, centralizando uma peça desenvolvida.",
      "As pretas desenvolvem o cavalo de g8 para f6 e atacam e4.",
    ],
    "♘",
  ),
  lesson(
    "gambito-rei",
    "Gambito do Rei",
    "Gambito do Rei",
    "w",
    "Agressivo; oferece um peão e expõe o rei.",
    "Oferecer o peão f para ganhar atividade, reconhecendo o risco para o próprio rei.",
    ["e4", "e5", "f4", "exf4", "Nf3", "g5"],
    [
      "Ocupe o centro com e2–e4 e libere suas peças.",
      "As pretas respondem com e5 e disputam o centro.",
      "Avance f2–f4 e ofereça esse peão para desviar e5. A proteção do rei fica mais fraca.",
      "As pretas aceitam o gambito, capturando de e5 em f4.",
      "Desenvolva o cavalo de g1 para f3. Ele controla h4 e ajuda a preparar o roque.",
      "As pretas avançam g7–g5 para sustentar o peão de f4, também enfraquecendo seu rei.",
    ],
    "♔",
  ),
  lesson(
    "evans",
    "Gambito Evans",
    "Evans",
    "w",
    "Agressivo; oferece um peão para ganhar atividade.",
    "Desviar o bispo adversário e ganhar tempos para construir um centro forte.",
    ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "b4", "Bxb4", "c3", "Ba5"],
    [
      "Avance e2–e4 para controlar o centro.",
      "As pretas respondem com e5.",
      "Desenvolva o cavalo de g1 para f3 e ataque e5.",
      "As pretas defendem e5 com o cavalo em c6.",
      "Desenvolva o bispo de f1 para c4 e pressione f7.",
      "As pretas posicionam seu bispo em c5, mirando f2.",
      "Avance b2–b4, oferecendo o peão para afastar o bispo de c5 e ganhar atividade.",
      "O bispo preto aceita o gambito, capturando em b4.",
      "Avance c2–c3 para atacar o bispo e preparar d4. O ganho é de tempo e centro, não de material.",
      "As pretas recuam o bispo de b4 para a5, mantendo a diagonal ativa.",
    ],
    "♗",
  ),
  lesson(
    "rainha-recusado",
    "Gambito da Rainha Recusado",
    "Rainha Recusado",
    "b",
    "Sólido; sustenta o centro.",
    "Apoiar d5 com e6 e desenvolver as peças, observando a limitação temporária do bispo de c8.",
    ["d4", "d5", "c4", "e6", "Nc3", "Nf6"],
    [
      "As brancas ocupam o centro com d4.",
      "Avance d7–d5 para disputar o centro e controlar e4.",
      "As brancas jogam c4, pressionando seu peão de d5.",
      "Avance e7–e6 para sustentar d5: você recusa o gambito, embora limite por enquanto o bispo de c8.",
      "As brancas desenvolvem o cavalo de b1 para c3, aumentando a pressão central.",
      "Desenvolva o cavalo de g8 para f6, apoiando d5 e controlando e4.",
    ],
    "♕",
  ),
  lesson(
    "eslava",
    "Defesa Eslava",
    "Eslava",
    "b",
    "Sólido; apoia d5 sem bloquear o bispo de c8 com …e6.",
    "Sustentar d5 com c6 e manter aberta a diagonal do bispo de c8.",
    ["d4", "d5", "c4", "c6", "Nf3", "Nf6"],
    [
      "As brancas ocupam o centro com d4.",
      "Avance d7–d5 para controlar o centro.",
      "As brancas atacam seu centro com c4.",
      "Avance c7–c6 para sustentar d5. Ao contrário de e6, esse lance não fecha a diagonal do bispo de c8.",
      "As brancas desenvolvem o cavalo de g1 para f3.",
      "Desenvolva o cavalo de g8 para f6, reforçando d5 e disputando e4.",
    ],
    "♜",
  ),
  lesson(
    "caro-kann",
    "Defesa Caro-Kann",
    "Caro-Kann",
    "b",
    "Sólido; desafia o centro com apoio dos peões.",
    "Preparar d5 com c6 e desenvolver o bispo antes de fechar sua diagonal com e6.",
    ["e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Bf5"],
    [
      "As brancas ocupam o centro com e4.",
      "Avance c7–c6 para preparar d5 com apoio de um peão.",
      "As brancas constroem um centro amplo com d4.",
      "Avance d7–d5 para desafiar o peão e4, apoiado por c6.",
      "As brancas desenvolvem o cavalo de b1 para c3 e defendem e4.",
      "Capture de d5 em e4 para esclarecer a tensão central.",
      "O cavalo branco de c3 recaptura em e4.",
      "Desenvolva o bispo de c8 para f5 antes de jogar e6, evitando prendê-lo atrás dos peões.",
    ],
    "♝",
  ),
  lesson(
    "escandinava",
    "Defesa Escandinava",
    "Escandinava",
    "b",
    "Direto; desafia o centro imediatamente.",
    "Contestar e4 de imediato e reposicionar a rainha após a troca central.",
    ["e4", "d5", "exd5", "Qxd5", "Nc3", "Qa5"],
    [
      "As brancas abrem com e4.",
      "Avance d7–d5 e ataque o centro branco imediatamente.",
      "As brancas capturam de e4 em d5.",
      "Recapture com a rainha de d8 em d5. Ela recupera o peão, mas pode ser atacada por peças que se desenvolvem.",
      "As brancas desenvolvem o cavalo de b1 para c3, atacando a rainha em d5.",
      "Recue a rainha de d5 para a5, saindo do ataque e mantendo pressão na diagonal a5–e1.",
    ],
    "♛",
  ),
  lesson(
    "petroff",
    "Defesa Petroff",
    "Petroff",
    "b",
    "Geralmente sólido; contra-ataca o peão de e4.",
    "Responder ao ataque a e5 com pressão em e4, mantendo um desenvolvimento sólido.",
    ["e4", "e5", "Nf3", "Nf6", "Nxe5", "d6"],
    [
      "As brancas ocupam o centro com e4.",
      "Avance e7–e5 para disputar o centro de forma simétrica.",
      "O cavalo branco de g1 chega a f3 e ataca seu peão e5.",
      "Desenvolva o cavalo de g8 para f6 e contra-ataque e4: esta é a ideia da Petroff.",
      "As brancas capturam e5 com o cavalo de f3.",
      "Avance d7–d6 para atacar o cavalo em e5 antes de recuperar o peão. Isso evita a recaptura precipitada em e4.",
    ],
    "♞",
  ),
  lesson(
    "india-rei",
    "Defesa Índia do Rei",
    "Índia do Rei",
    "b",
    "Dinâmico; prepara pressão contra o centro branco.",
    "Desenvolver o bispo em fianqueto e preparar contra-ataques contra o centro branco.",
    ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6"],
    [
      "As brancas ocupam o centro com d4.",
      "Desenvolva o cavalo de g8 para f6 e controle e4.",
      "As brancas ganham espaço com c4.",
      "Avance g7–g6 para preparar o fianqueto do bispo de f8.",
      "As brancas desenvolvem o cavalo de b1 para c3 e reforçam o centro.",
      "Desenvolva o bispo de f8 para g7. Daqui ele pressiona a grande diagonal contra o centro branco.",
      "As brancas avançam e4 e formam um centro amplo.",
      "Avance d7–d6 para sustentar sua estrutura, liberar o bispo de c8 e preparar o roque e futuros contra-ataques.",
    ],
    "♝",
  ),
  lesson(
    "holandesa",
    "Defesa Holandesa",
    "Holandesa",
    "b",
    "Combativo; controla e4, mas enfraquece a proteção do rei.",
    "Controlar e4 com f5 e desenvolver as peças, reconhecendo as fragilidades criadas junto ao rei.",
    ["d4", "f5", "c4", "Nf6", "g3", "g6"],
    [
      "As brancas ocupam o centro com d4.",
      "Avance f7–f5 para controlar e4. Este lance cria possibilidades de ataque, mas enfraquece a proteção do seu rei.",
      "As brancas ganham espaço com c4.",
      "Desenvolva o cavalo de g8 para f6 e aumente o controle de e4.",
      "As brancas jogam g3, preparando o bispo em g2.",
      "Avance g7–g6 para preparar o bispo em g7, adotando uma estrutura de fianqueto na Holandesa.",
    ],
    "♟",
  ),
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
