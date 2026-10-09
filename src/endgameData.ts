export type EndgameId = "queen" | "rook" | "pawn";
export interface Endgame {
  id: EndgameId;
  name: string;
  title: string;
  fen: string;
  piece: "q" | "r" | "p";
  objective: string;
  intro: string[];
  stages: { title: string; text: string }[];
  concept: string;
  success: string;
}
export const endgameData: Endgame[] = [
  {
    id: "queen",
    name: "Mate com Dama",
    title: "Mate com Rei e Dama",
    fen: "k7/8/2K5/8/3Q4/8/8/8 w - - 0 1",
    piece: "q",
    objective: "Dar xeque-mate com rei e dama, sem afogar o rei adversário.",
    intro: [
      "Você possui um rei e uma dama contra um rei sozinho. Essa é uma posição teoricamente vencedora. Seu objetivo é encurralar o rei adversário e dar xeque-mate.",
      "A dama controla várias casas ao mesmo tempo, mas não deve trabalhar sozinha. Seu rei precisa participar para impedir a fuga do adversário.",
    ],
    stages: [
      {
        title: "A dama fecha o espaço",
        text: "A primeira tarefa é limitar o espaço disponível ao rei adversário. Utilize a dama para controlar fileiras, colunas e diagonais, diminuindo a área pela qual ele pode escapar. Mantenha a dama protegida ou fora do alcance do rei; nem todo lance precisa ser um xeque.",
      },
      {
        title: "Aproximar o rei",
        text: "Agora aproxime seu rei. Ele será responsável por controlar casas próximas ao rei adversário, enquanto a dama mantém a barreira. Os reis não podem ficar em casas adjacentes.",
      },
      {
        title: "Concluir o xeque-mate",
        text: "Com o rei adversário limitado, procure uma posição em que sua dama dê xeque e todas as casas de fuga estejam controladas. Cuidado com o afogamento: sem xeque e sem movimentos legais, a partida termina empatada.",
      },
    ],
    concept: "Controlar o espaço, aproximar o rei e impedir as casas de fuga.",
    success:
      "Excelente! Você executou o xeque-mate com rei e dama. Aprendeu a controlar o espaço, aproximar seu rei e impedir as casas de fuga.",
  },
  {
    id: "rook",
    name: "Mate com Torre",
    title: "Mate com Rei e Torre",
    fen: "k7/8/2K5/8/7R/8/8/8 w - - 0 1",
    piece: "r",
    objective: "Dar xeque-mate coordenando rei e torre.",
    intro: [
      "Você possui um rei e uma torre contra um rei sozinho. Essa posição também é vencedora, mas exige maior coordenação entre as peças.",
      "A torre funciona como uma barreira. Seu rei ajuda a reduzir o espaço do adversário até que seja possível aplicar o xeque-mate.",
    ],
    stages: [
      {
        title: "Construir uma barreira",
        text: "A torre controla uma fileira ou coluna inteira. Utilize esse controle para impedir que o rei adversário atravesse determinadas regiões do tabuleiro. Reduza a área disponível e mantenha sua torre protegida; nem todo lance precisa dar xeque.",
      },
      {
        title: "Aproximar o rei",
        text: "Com o caminho do rei adversário limitado pela torre, aproxime seu próprio rei. Ele ajudará a controlar as casas de fuga. Mudar a barreira e fazer lances de espera pode ser útil.",
      },
      {
        title: "Levar o adversário à borda",
        text: "Continue reduzindo o espaço disponível até conduzir o rei adversário à borda do tabuleiro. A torre sozinha normalmente não consegue finalizar o mate. Seu rei precisa impedir as casas de fuga.",
      },
      {
        title: "Dar xeque-mate",
        text: "Quando o rei adversário estiver na borda e as casas de fuga estiverem controladas, utilize a torre para aplicar o xeque-mate.",
      },
    ],
    concept: "Criar barreiras, coordenar as peças e conduzir o rei à borda.",
    success:
      "Parabéns! Você dominou o mate com rei e torre. Aprendeu a criar barreiras, coordenar suas peças e conduzir o rei adversário até a borda.",
  },
  {
    id: "pawn",
    name: "Promoção de Peão",
    title: "Promoção com Rei e Peão",
    fen: "4k3/8/4K3/4P3/8/8/8/8 b - - 0 1",
    piece: "p",
    objective:
      "Promover o peão a dama com apoio do rei, sem terminar em empate.",
    intro: [
      "Você possui um rei e um peão contra um rei sozinho. Seu objetivo é promover o peão, levando-o até a última fileira do tabuleiro.",
      "O segredo é utilizar seu rei para abrir caminho. Avançar o peão sem preparar sua passagem pode permitir que o adversário bloqueie a promoção.",
    ],
    stages: [
      {
        title: "Compreender a oposição",
        text: "Observe os reis. Quando estão na mesma coluna ou fileira, separados por uma casa, existe uma situação conhecida como oposição. O jogador obrigado a mover seu rei pode ter de abandonar uma casa importante, permitindo que o adversário conquiste espaço.",
      },
      {
        title: "Proteger o peão",
        text: "Seu rei deve ajudar a manter o peão seguro. Procure controlar as casas por onde o peão precisará passar. Não avance automaticamente: observe capturas, casas críticas e a resposta adversária.",
      },
      {
        title: "Avançar no momento correto",
        text: "Quando o rei adversário não conseguir bloquear o caminho, avance o peão com segurança. O peão não captura para frente e não pode avançar se a casa estiver bloqueada.",
      },
      {
        title: "Promoção",
        text: "Quando o peão alcançar a oitava fileira, poderá ser promovido. Neste exercício, escolha a dama para concluir o objetivo. A promoção encerra este exercício; normalmente ainda é necessário converter a vantagem em xeque-mate.",
      },
    ],
    concept:
      "Oposição, controle de casas críticas e momento correto para avançar.",
    success:
      "Excelente! Você conseguiu promover o peão utilizando seu rei como apoio. Aprendeu a importância da oposição, do controle de casas críticas e do momento correto para avançar.",
  },
];
