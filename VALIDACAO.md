# Validação da Chess Academy

A implementação original foi mantida e organizada em módulos, com as sequências originais e o tema escuro preservados. Os arquivos SQL removidos anteriormente continuam removidos. O projeto e o build para GitHub Pages foram preparados para envio. Consulte a seção GitHub Pages do README para ativar a hospedagem.

## Problemas identificados e correções

| Problema                                                                       | Correção                                                                                            |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Parêntese incorreto em `setFeedbackType('good'}` impedia compilar              | Sintaxe corrigida; TypeScript e build executados                                                    |
| Servidor antigo ficou com cache desatualizado após reinstalar dependências     | Servidor encerrado e iniciado novamente; procedimento documentado                                   |
| Instalação falhava porque o cache padrão do npm não era gravável               | Instalação e reinstalação com cache em `/tmp/chess-academy-npm`                                     |
| Repetição revelava o próximo lance e sua explicação após erro                  | Mensagem informa somente o erro, sem revelar a resposta                                             |
| Arraste ilegal na repetição permitia continuar e contar uma tentativa com erro | Lance ilegal invalida a tentativa e reinicia mantendo os acertos anteriores                         |
| Sidebar desaparecia no mobile sem alternativa para navegar                     | Navegação mobile entre Início, Jogar, Aprender e Repetir                                            |
| Arraste HTML não cobria a interação por toque                                  | Pointer Events com identificação da casa de destino e supressão limitada do clique posterior        |
| Gravação no localStorage podia lançar exceção e quebrar a tela                 | Escrita protegida, aviso de armazenamento indisponível e progresso em memória                       |
| Dados de progresso podiam conter contagens fracionárias ou campos inválidos    | Normalização, valores inteiros entre zero e três e recuperação de JSON inválido                     |
| Clonagem da partida pressupunha sempre a posição inicial padrão                | Preservação da FEN inicial e de todo o histórico, incluindo direitos de roque e repetição           |
| Avaliação posicional de avanço de peões da CPU estava invertida                | Avanço avaliado igualmente para as duas cores, mantendo a busca iniciante                           |
| Promoção dependia do estado anterior do modal                                  | Resolução explícita do lance com escolha de dama, torre, bispo ou cavalo                            |
| Modal sem nomes para peças e sem gestão de foco                                | Nomes acessíveis, foco inicial, ciclo de Tab, Escape e restauração de foco                          |
| Fontes dependiam de requisições externas ao Google                             | Mesmas famílias empacotadas localmente, com fallback                                                |
| Código concentrado e sem testes executáveis                                    | Tabuleiro, promoção, lógica de jogo e progresso extraídos; suítes de lógica e navegador adicionadas |

## Verificações executadas

Ambiente: Node.js 24, React 19, Vite 6 e Chromium 151. O `package-lock.json` registra as versões instaladas e foi usado em uma reinstalação com `npm ci`.

- TypeScript da aplicação e dos testes.
- Build de produção.
- 44 testes de lógica, sem testes ignorados.
- 120 testes de navegador: 60 cenários executados em desktop Chromium e mobile Chromium com Pixel 7 emulado.
- Auditoria npm: nenhuma vulnerabilidade reportada no momento da execução.
- Inspeção de capturas do layout e verificação de ausência de overflow horizontal em 320, 412, 768, 1024 e 1440 pixels.
- Verificação de carregamento das fontes locais sem requisições externas.
- Requisição HTTP ao servidor local e verificação funcional do build de produção no navegador.

## Cobertura funcional

| Área          | Cenários executados                                                                                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Páginas       | Início, jogo livre, catálogo por cor, tutorial, central e repetição; navegação desktop/mobile                                                                                                |
| Jogo livre    | Lance do usuário seguido da CPU, CPU inicia quando usuário escolhe pretas, orientação por cor, SAN no histórico, reinício, desistência durante espera e cancelamento de callbacks ao navegar |
| Interação     | Clique origem/destino, arraste nativo do mouse e eventos de toque reais via protocolo do Chromium                                                                                            |
| Roque         | Curto e longo das brancas com rei/torre corretos; roque das pretas; proibição através de xeque e após perda de direitos                                                                      |
| En passant    | Captura, remoção do peão correto e expiração do direito de captura                                                                                                                           |
| Promoção      | Escolha obrigatória das quatro peças, ambas as cores; cancelar sem modificar a posição; teclado e foco                                                                                       |
| Xeque e mate  | Destaque do rei, rejeição de lance inseguro, xeque-mate e bloqueio de interação ao terminar                                                                                                  |
| Empates       | Afogamento, material insuficiente, repetição tripla preservada após clonagem e regra dos 50 lances                                                                                           |
| 14 tutoriais  | Sequência completa de cada abertura, explicação antes do lance, erro corrigível sem perder a posição, respostas automáticas e orientação das pretas                                          |
| 14 repetições | Três execuções completas com um erro entre acertos, sem dicas antecipadas, sem perda de progresso, estado Dominada e persistência após reload                                                |
| Armazenamento | Tutorial não conta como repetição; teto de três acertos; JSON inválido; armazenamento bloqueado sem erro não tratado                                                                         |

As regras especiais foram executadas em posições controladas usando o mesmo `Board`, `PromotionDialog`, `resolveMove`, `cloneGame` e `resultText` utilizados pela aplicação. Isso permite testar promoções e finais de partida sem depender de escolhas aleatórias da CPU. As partidas normais, aulas e repetições foram testadas na aplicação completa. A verificação de ausência de erros de JavaScript/console e respostas HTTP de erro cobre os testes da aplicação completa.

## Limites

- Mobile emulado no Chromium; não houve execução em aparelho físico, Safari ou Firefox.
- A CPU permanece iniciante e não possui avaliação de força ou rating certificado.
- Progresso local por navegador/origem; não há conta, sincronização ou restauração de partidas em andamento.
- Empates suportados por `chess.js` são encerrados automaticamente; não há interface de reivindicação de empate em regras de torneio.
- O build para `/C.V._SQL/` foi validado no navegador com carregamento de assets, tabuleiro e resposta da CPU. A ativação e o acesso público ao GitHub Pages não puderam ser confirmados por bloqueio de rede à API do GitHub e ao domínio github.io. Não houve validação da restauração em uma nova tarefa na nuvem.

## Ajustes incorporados nesta versão

- Nome alterado para Gambito da Rainha, preservando o identificador `gambito` e o progresso salvo.
- Treino aleatório na central: seleção de aberturas, metas individuais de 1 a 20 acertos, troca automática de cor/orientação e término ao atingir todas as metas.
- Erros repetem a tentativa atual sem apagar acertos. Metas da sessão independentes do domínio permanente.
- Testado em desktop e mobile com Gambito da Rainha (1 acerto) e Siciliana (2 acertos), incluindo erro entre acertos, encerramento manual, seleção vazia e metas inválidas.
- Publicação autorizada pelo usuário em 9 de outubro de 2026; os ajustes abaixo integram a versão enviada à produção.

### Tabuleiro em tela cheia

Botão disponível no jogo, tutorial e repetição; tabuleiro dimensionado por largura/altura da janela, painel de instruções opcional, reinício e saída sem perda da posição. Tela cheia nativa quando disponível e modo ampliado como alternativa. Testes em desktop/mobile cobrem encaixe do tabuleiro, painel e dicas, movimentação, preservação do histórico, Escape e viewport horizontal de 700×360. Publicação integrada à versão atual.

### Expansão para 14 aberturas

Adicionadas 10 aberturas, mantendo as quatro existentes: 5 opções para brancas e 9 para pretas. Prefixos conferidos contra a tabela solicitada, com continuações curtas e explicações de cada lance. Todas as linhas são legais. Progresso e percentuais derivados do tamanho do catálogo (14 aberturas, 42 acertos), sem reiniciar registros antigos. Testes de migração verificam os identificadores originais e a inicialização das novas aberturas. Catálogo, treino aleatório, tutoriais e repetições foram ampliados; alterações integradas à versão atual.

### Módulo 3 — Treinamento de Finais

Integrado ao painel e à navegação desktop/mobile com catálogo, categorias, objetivos e domínio individual. Posições originais: rei c6/dama d4 contra rei a8; rei c6/torre h4 contra rei a8; rei e6/peão e5 contra rei e8, com pretas iniciando neste último.

Tutorial e prática reutilizam `Board`, `PromotionDialog`, `resolveMove` e o histórico. Lances legais alternativos são aceitos. Tutorial apresenta conceitos antes da execução; os botões permitem consultar etapas livremente. Prática não exibe dicas, destinos legais ou comentários estratégicos antes da conclusão. Mate/empate/perda de material/promoção são identificados no estado real da partida. A promoção a dama é o objetivo do final de peão, sem confundi-la com mate.

**Testes do módulo:** 12 testes de lógica e oito cenários de navegador executados em desktop e mobile (16 execuções). Soluções completas dos três exercícios no tutorial e na prática, defesa automática legal, pretas iniciando, histórico correto, ausência de dicas, tutorial sem contar acertos, sucesso na prática, afogamento entre acertos, domínio após três conclusões, persistência após reload, torre e peão capturados, clique, arraste do mouse, toque via Chromium, movimento de rei inseguro, tela cheia, painel de instruções e ausência de overflow em 360 pixels. Lógica também cobre captura da dama, promoção alternativa e armazenamento inválido/bloqueado. As falhas controladas usam uma página de teste excluída do build de produção.

**Versão de produção:** aberta via `vite preview` na porta 4173; exercício de promoção executado até a conclusão e gravação de um acerto, sem erros de JavaScript nem respostas HTTP de erro. Capturas do catálogo desktop e tutorial mobile inspecionadas; largura de 360 pixels sem overflow horizontal.

**Ajustes identificados durante a implementação:** o histórico antigo supunha brancas iniciando; agora usa cor e número real de cada lance. O tabuleiro permite que os finais comuniquem tentativas ilegais por clique sem alterar a partida. O armazenamento dos finais é separado do existente e a contabilização ocorre uma única vez por tentativa concluída na prática.

**Limitações:** sem tablebase; busca defensiva de três meios-lances com heurísticas, sem garantia de jogo perfeito. Feedback sobre controle de casas e capturas é objetivo e não certifica a avaliação teórica de uma posição. Etapas conceituais são navegadas pelo aluno, sem exigir lances específicos. Mobile emulado em Chromium; Safari, Firefox e aparelho físico não foram testados. Progresso é local ao navegador e tentativas em andamento não são restauradas.

**Arquivos deste módulo:** novos `src/endgameData.ts`, `src/EndgameCatalog.tsx`, `src/EndgameTraining.tsx`, `src/EndgameEngine.ts`, `src/EndgameProgress.ts`, `src/MoveHistory.tsx`, `tests/endgames.test.ts`, `tests/e2e/endgames.spec.ts`, `tests/endgame-harness.tsx`, `tests/endgame.html`; ajustados `src/main.tsx`, `src/Board.tsx`, `src/style.css`, `README.md` e este relatório. Nenhuma dependência adicional ou serviço externo obrigatório.


### Preparação da publicação — 9 de outubro de 2026

Publicação autorizada pelo usuário. Build recompilado com `--base=/C.V._SQL/` e aberto no Chromium em viewport de 360 pixels; catálogo de três finais e tabuleiro carregaram sem erros de JavaScript ou HTTP. A suíte completa anterior passou com 44 testes de lógica e 120 execuções de navegador. O envio a `main` aciona o workflow existente de atualização da branch `gh-pages`. O acesso direto ao domínio público foi bloqueado pelo proxy deste ambiente (CONNECT 403); essa limitação não é um erro observado no site.
