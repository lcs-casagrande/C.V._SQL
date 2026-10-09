# Chess Academy

Plataforma de xadrez em React 19, TypeScript e Vite 6, aproveitando a implementação inicial enviada. Tema escuro, tabuleiro próprio, 14 aberturas guiadas e três finais essenciais. Não requer backend, banco SQL, login ou chaves de API.

## Executar

Requisitos: Node.js 20.19+ ou 22.12+ (validado com Node 24), npm e internet para a primeira instalação.

```bash
npm ci
npm run dev -- --port 5173 --strictPort
```

Endereço local: `http://localhost:5173`. O endereço é local à máquina que executa o Vite; neste ambiente na nuvem, não é um link de publicação nem um endereço público.

Pare o servidor antes de reinstalar dependências com `npm ci`. Caso um servidor antigo mostre `504 Outdated Optimize Dep`, reinicie com `npm run dev -- --force --port 5173 --strictPort`.

Neste ambiente o cache padrão do npm não é gravável. Use `npm ci --cache /tmp/chess-academy-npm` para instalar sem alterar as permissões do sistema.

## Verificar

```bash
npm run typecheck   # aplicação e testes
npm run build       # TypeScript + versão de produção em dist/
npm test            # regras, computador, aberturas e progresso
npm run test:e2e    # navegador desktop e mobile emulado
npm run check       # todas as verificações acima
```

Os testes de navegador usam o Chromium do sistema quando `/usr/bin/chromium` existe. Em outra máquina, instale o navegador com `npx playwright install chromium`, ou defina `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` com o caminho de um Chromium existente. Playwright inicia o Vite na porta 5173, ou reutiliza o servidor de desenvolvimento já aberto nessa porta. Não reutilize um servidor de produção para essa suíte: os cenários de regras especiais usam a página de testes `tests/board.html`, que não entra no build de produção.

Para conferir o build:

```bash
npm run preview -- --port 4173 --strictPort
```

O relatório HTML do Playwright fica em `playwright-report/index.html`; capturas e traces de falhas ficam em `test-results/`. Esses resultados, `node_modules/` e `dist/` são ignorados pelo Git.

## Funcionalidades

- **Jogo livre:** escolha entre brancas e pretas, respostas automáticas de um computador iniciante, histórico, reinício, desistência e seletor de promoção.
- **Tutoriais:** 14 aberturas, separadas pela cor de estudo. Explicação antes do lance, respostas automáticas, dicas e correção de erros mantendo a posição.
- **Repetição:** sequência sem dicas; erros encerram a tentativa e iniciam outra sem apagar acertos. Só a sequência completa conta. Três acertos, mesmo intercalados por erros, marcam a abertura como Dominada.
- **Progresso:** `localStorage`, chave `chess-academy-progress-v1`. Dados inválidos são normalizados e armazenamento bloqueado mostra um aviso sem quebrar a sessão.
- **Finais:** mate com rei e dama, mate com rei e torre e promoção com rei e peão. Tutorial conceitual e prática livre sem dicas; três objetivos concluídos na prática marcam o exercício como Dominado. Progresso separado na chave `chess-academy-endgames-v1`.
- **Interface:** tabuleiro responsivo, clique, arraste nativo com mouse, arraste por Pointer Events no toque, navegação mobile e animações que respeitam a preferência de movimento reduzido.
- **Fontes locais:** DM Sans e Outfit distribuídas pelo Fontsource; o site não busca fontes em serviços externos durante o uso.

## Organização

```text
src/
  main.tsx             telas, navegação e fluxo de partida/aula
  Board.tsx            tabuleiro e interação por clique, mouse e toque
  PromotionDialog.tsx  escolha de promoção e foco de teclado
  chess.ts             resolução de movimentos, clonagem, resultados e CPU
  progress.ts          carregamento, gravação e contagem de progresso
  openings.ts          sequências SAN e explicações das 14 aberturas
  endgameData.ts       FENs, objetivos e conteúdos dos três finais
  EndgameCatalog.tsx   catálogo e domínio dos finais
  EndgameTraining.tsx  tutorial e prática livre
  EndgameEngine.ts     defesa local, feedback e critérios reais de conclusão
  EndgameProgress.ts   persistência independente dos finais
  MoveHistory.tsx      histórico, incluindo posições com pretas iniciando
  style.css            identidade visual e responsividade
tests/
  chess.test.ts        regras e lógica de jogo
  progress.test.ts     persistência e contagem
  endgames.test.ts     objetivos, defesa legal e progresso de finais
  endgame-harness.tsx  falhas controladas com a interface real de finais
  e2e/                 testes reais de navegador
  board-harness.tsx    posições controladas usando os componentes reais
```

`chess.js` controla movimentos legais, roque, en passant, xeque, promoção e empates. `lucide-react` fornece os ícones. A CPU faz uma busca superficial de dois meios-lances com avaliação material e alguma variação entre lances próximos; não usa Stockfish e não tem rating certificado.

As páginas são telas de uma aplicação de página única; o estado do jogo é de sessão. Atualizar a página mantém o progresso das aberturas e dos finais, mas não restaura uma partida em andamento. O progresso não sincroniza entre dispositivos e é perdido ao limpar os dados do site.

Veja [o relatório de validação](VALIDACAO.md) para problemas corrigidos, cenários executados e limites da cobertura.

## GitHub Pages

O site é compilado para o caminho `/C.V._SQL/` com:

```bash
npm run build -- --base=/C.V._SQL/
```

A branch `gh-pages` contém somente o site compilado. O workflow `.github/workflows/pages.yml` atualiza essa branch automaticamente após alterações em `main`, sem substituir seu histórico.

Para ativar a hospedagem no GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: gh-pages → Folder: / (root) → Save**. O endereço previsto é `https://lcs-casagrande.github.io/C.V._SQL/`. A primeira publicação pode levar alguns minutos. Não selecione a pasta de código-fonte `main`: o site precisa dos arquivos compilados.

## Treino aleatório de aberturas

Na **Central de repetição**, abra **Selecionar aberturas**, marque as opções desejadas e informe de 1 a 20 repetições para cada abertura. **Iniciar treino aleatório** começa uma sessão sem dicas, com troca automática de abertura e orientação do tabuleiro conforme a cor. Quando existe outra abertura pendente, a mesma não aparece duas vezes seguidas.

Somente sequências completas e corretas contam. Um erro repete a tentativa atual e mantém os acertos anteriores. O treino termina quando todas as metas são atingidas; **Encerrar treino** permite sair antes. As metas da sessão são independentes da regra de três acertos para dominar uma abertura, mas os acertos também contribuem para esse domínio. A sessão atual não é restaurada após recarregar a página; o progresso de domínio continua salvo.

## Tabuleiro em tela cheia

No jogo livre, tutorial ou repetição, use **Tela cheia**. O tabuleiro se ajusta à largura e altura disponíveis, inclusive no celular em modo horizontal. **Mostrar instruções / Ocultar instruções** abre e fecha o painel lateral; no celular ele aparece sobre a lateral do tabuleiro. Quando o painel está oculto, as dicas visuais do tutorial também ficam ocultas. **Sair** ou **Esc** retorna ao layout normal mantendo a posição e o progresso. O modo ampliado funciona mesmo sem a API nativa de tela cheia do navegador.

## Catálogo de aberturas

- **Brancas (5):** Italiana, Escocesa, Gambito da Rainha, Gambito do Rei e Gambito Evans.
- **Pretas (9):** Gambito da Rainha Recusado, Eslava, Caro-Kann, Francesa, Siciliana, Escandinava, Petroff, Índia do Rei e Holandesa.

Os lances iniciais solicitados são seguidos por continuações curtas de uma variante representativa para praticar as respostas automáticas. Todas as aberturas estão disponíveis no tutorial, repetição individual e seleção de treino aleatório. A notação interna usa SAN internacional (`N` para cavalo); as explicações descrevem as peças e casas em português. O catálogo tem 14 aberturas e 42 acertos de domínio. Os identificadores originais foram preservados, mantendo o progresso anterior.

## Treinamento de Finais

No início, escolha **Explorar finais**, ou use **Treinar finais / Finais** na navegação. Os três exercícios começam nas posições cadastradas em `endgameData.ts`. No final de peão, as pretas iniciam automaticamente.

**Aprender** mostra explicações e conceitos que podem ser consultados com os botões anterior/próximo. Os conceitos orientam o raciocínio; não há uma sequência obrigatória de lances. **Praticar** e **Praticar sem dicas** exibem somente o objetivo, o tabuleiro e o histórico durante a partida. Só uma conclusão independente iniciada na posição original soma um acerto, até três, sem apagar acertos após uma falha. É possível continuar praticando depois de dominar.

O adversário faz uma busca local determinística de três meios-lances. Utiliza mate, empate e perda de material reais, além de estimativas de mobilidade, borda, distância e avanço do peão para escolher a defesa. Não há tablebase ou garantia de defesa perfeita. O feedback usa fatos verificáveis, sem classificar uma posição como teoricamente ganha ou empatada pela estimativa.

No exercício de peão, promover a **dama** sem empate conclui o objetivo; isso não equivale necessariamente a xeque-mate. Promoções diferentes são legais, mas não contam para esse exercício. A tela cheia e o painel opcional também funcionam nos finais.
