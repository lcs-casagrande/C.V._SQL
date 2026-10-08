# Validação da Chess Academy

A implementação original foi mantida e organizada em módulos, com as quatro sequências de abertura e o tema escuro preservados. Os arquivos SQL removidos anteriormente continuam removidos. O projeto e o build para GitHub Pages foram preparados para envio. Consulte a seção GitHub Pages do README para ativar a hospedagem.

## Problemas identificados e correções

| Problema                                                                       | Correção                                                                                            |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Parêntese incorreto em `setFeedbackType('good'}` impedia compilar              | Sintaxe corrigida; TypeScript e build executados                                                    |
| Servidor antigo ficou com cache desatualizado após reinstalar dependências | Servidor encerrado e iniciado novamente; procedimento documentado |
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
- 17 testes de lógica, sem testes ignorados.
- 54 testes de navegador: 27 cenários executados em desktop Chromium e mobile Chromium com Pixel 7 emulado.
- Auditoria npm: nenhuma vulnerabilidade reportada no momento da execução.
- Inspeção de capturas do layout e verificação de ausência de overflow horizontal em 320, 412, 768, 1024 e 1440 pixels.
- Verificação de carregamento das fontes locais sem requisições externas.
- Requisição HTTP ao servidor local e verificação funcional do build de produção no navegador.

## Cobertura funcional

| Área              | Cenários executados                                                                                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Páginas           | Início, jogo livre, catálogo por cor, tutorial, central e repetição; navegação desktop/mobile                                                                                                |
| Jogo livre        | Lance do usuário seguido da CPU, CPU inicia quando usuário escolhe pretas, orientação por cor, SAN no histórico, reinício, desistência durante espera e cancelamento de callbacks ao navegar |
| Interação         | Clique origem/destino, arraste nativo do mouse e eventos de toque reais via protocolo do Chromium                                                                                            |
| Roque             | Curto e longo das brancas com rei/torre corretos; roque das pretas; proibição através de xeque e após perda de direitos                                                                      |
| En passant        | Captura, remoção do peão correto e expiração do direito de captura                                                                                                                           |
| Promoção          | Escolha obrigatória das quatro peças, ambas as cores; cancelar sem modificar a posição; teclado e foco                                                                                       |
| Xeque e mate      | Destaque do rei, rejeição de lance inseguro, xeque-mate e bloqueio de interação ao terminar                                                                                                  |
| Empates           | Afogamento, material insuficiente, repetição tripla preservada após clonagem e regra dos 50 lances                                                                                           |
| Quatro tutoriais  | Sequência completa de cada abertura, explicação antes do lance, erro corrigível sem perder a posição, respostas automáticas e orientação das pretas                                          |
| Quatro repetições | Três execuções completas com um erro entre acertos, sem dicas antecipadas, sem perda de progresso, estado Dominada e persistência após reload                                                |
| Armazenamento     | Tutorial não conta como repetição; teto de três acertos; JSON inválido; armazenamento bloqueado sem erro não tratado                                                                         |

As regras especiais foram executadas em posições controladas usando o mesmo `Board`, `PromotionDialog`, `resolveMove`, `cloneGame` e `resultText` utilizados pela aplicação. Isso permite testar promoções e finais de partida sem depender de escolhas aleatórias da CPU. As partidas normais, aulas e repetições foram testadas na aplicação completa. A verificação de ausência de erros de JavaScript/console e respostas HTTP de erro cobre os testes da aplicação completa.

## Limites

- Mobile emulado no Chromium; não houve execução em aparelho físico, Safari ou Firefox.
- A CPU permanece iniciante e não possui avaliação de força ou rating certificado.
- Progresso local por navegador/origem; não há conta, sincronização ou restauração de partidas em andamento.
- Empates suportados por `chess.js` são encerrados automaticamente; não há interface de reivindicação de empate em regras de torneio.
- O build para `/C.V._SQL/` foi validado no navegador com carregamento de assets, tabuleiro e resposta da CPU. A ativação e o acesso público ao GitHub Pages não puderam ser confirmados por bloqueio de rede à API do GitHub e ao domínio github.io. Não houve validação da restauração em uma nova tarefa na nuvem.
