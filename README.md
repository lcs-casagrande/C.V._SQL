# Chess Academy

Plataforma de xadrez em React 19, TypeScript e Vite 6, aproveitando a implementação inicial enviada. Tema escuro, tabuleiro próprio e quatro aberturas guiadas. Não requer backend, banco SQL, login ou chaves de API.

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
- **Tutoriais:** Italiana, Gambito da Dama Recusado, Siciliana e Francesa. Explicação antes do lance, respostas automáticas, dicas e correção de erros mantendo a posição.
- **Repetição:** sequência sem dicas; erros encerram a tentativa e iniciam outra sem apagar acertos. Só a sequência completa conta. Três acertos, mesmo intercalados por erros, marcam a abertura como Dominada.
- **Progresso:** `localStorage`, chave `chess-academy-progress-v1`. Dados inválidos são normalizados e armazenamento bloqueado mostra um aviso sem quebrar a sessão.
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
  openings.ts          sequências SAN e explicações das quatro aberturas
  style.css            identidade visual e responsividade
tests/
  chess.test.ts        regras e lógica de jogo
  progress.test.ts     persistência e contagem
  e2e/                 testes reais de navegador
  board-harness.tsx    posições controladas usando os componentes reais
```

`chess.js` controla movimentos legais, roque, en passant, xeque, promoção e empates. `lucide-react` fornece os ícones. A CPU faz uma busca superficial de dois meios-lances com avaliação material e alguma variação entre lances próximos; não usa Stockfish e não tem rating certificado.

As páginas são telas de uma aplicação de página única; o estado do jogo é de sessão. Atualizar a página mantém o progresso das aberturas, mas não restaura uma partida em andamento. O progresso não sincroniza entre dispositivos e é perdido ao limpar os dados do site.

Veja [o relatório de validação](VALIDACAO.md) para problemas corrigidos, cenários executados e limites da cobertura.

## GitHub Pages

O site é compilado para o caminho `/C.V._SQL/` com:

```bash
npm run build -- --base=/C.V._SQL/
```

A branch `gh-pages` contém somente o site compilado. O workflow `.github/workflows/pages.yml` atualiza essa branch automaticamente após alterações em `main`, sem substituir seu histórico.

Para ativar a hospedagem no GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: gh-pages → Folder: / (root) → Save**. O endereço previsto é `https://lcs-casagrande.github.io/C.V._SQL/`. A primeira publicação pode levar alguns minutos. Não selecione a pasta de código-fonte `main`: o site precisa dos arquivos compilados.
