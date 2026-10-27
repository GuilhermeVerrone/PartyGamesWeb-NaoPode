# Não Pode — Spec do Jogo Web

Versão digital de um party game de palavras proibidas, jogado em **um único dispositivo** (celular/tablet/notebook passado entre os jogadores) e hospedado na **Vercel**.

> Inspirado na mecânica do jogo físico "Não Pode" (Party Games). Este projeto é uma implementação independente: **nome visual, identidade e lista de palavras devem ser originais** (ver seção 12).

---

## 1. Visão geral

| Item | Definição |
|---|---|
| Gênero | Party game de adivinhação (estilo Taboo) |
| Jogadores | 4 a 8 (2 times; suporta 2 a 4 times como opção futura) |
| Duração | ~30 min por partida |
| Idade | 14+ |
| Idioma | Português do Brasil |
| Plataforma | Web responsiva, mobile-first, PWA instalável |
| Hospedagem | Vercel (site estático, sem backend no MVP) |

### Objetivo do jogo
Em cada vez, um jogador (o **passador**) tem **60 segundos** para fazer o próprio time adivinhar o maior número possível de **palavras-alvo**, sem falar nenhuma das **5 palavras proibidas** da carta. Se o passador falar uma proibida, o time adversário grita **"NÃO PODE!"**.

---

## 2. Escopo

### MVP (v1.0)
- Partida local, 2 times, passando o aparelho.
- Cronômetro de 60s por vez, configurável.
- Baralho com 350+ cartas originais, em categorias.
- Ações do passador: **Acertou**, **Pular**, **Não Pode!**.
- Placar, rodadas, tela de vencedor.
- Sons, vibração e animações básicas.
- Persistência da partida em andamento (localStorage).
- PWA (funciona offline após o primeiro acesso).

### Fora do MVP (roadmap)
- Multiplayer online (ver seção 16: duelo 1x1 por link, sem banco de dados).
- Mais de 2 times.
- Decks temáticos extras, criador de decks próprio.
- Ranking/estatísticas persistentes, contas de usuário.
- Modo "juiz automático" por reconhecimento de voz (experimental).

---

## 3. Regras implementadas

1. Os jogadores se dividem em **2 times** (mínimo 2 por time). Os times alternam as vezes.
2. Dentro de cada time, o papel de **passador** rotaciona a cada vez do time.
3. Na vez do time A: o passador vê a carta; os colegas de A adivinham; **os jogadores do time B fiscalizam** (veem a tela da carta e gritam "NÃO PODE!").
4. O passador não pode: falar a palavra-alvo, falar qualquer das 5 proibidas (nem derivações óbvias, ex.: "areia" → "arenoso"), usar mímica ou gestos, falar "rima com…", soletrar ou falar em outro idioma.
5. **Acertou:** carta descartada, **+1 ponto** para o time do passador, próxima carta.
6. **Pular:** carta descartada sem pontuar (limite configurável, padrão: ilimitado com penalidade de 0; opção "pular custa −1").
7. **Não Pode!:** toque do fiscalizador (botão grande, ou o próprio passador por honestidade, ver config). Efeito (configurável):
   - **Padrão ("Clássico")**: a carta é descartada, **+1 ponto para o time adversário** e **a vez termina**.
   - Variante "Suave": a carta é descartada, adversário +1 ponto e a vez continua.
8. Fim do tempo: a vez termina; a carta atual é descartada sem pontos.
9. A partida termina após **N rodadas** (uma rodada = todos os times jogaram 1 vez; padrão 4 rodadas por time, configurável 2–10) **ou** ao atingir **pontuação-alvo** (opcional, padrão desligado).
10. Vence o time com mais pontos. Empate → **rodada de desempate** (1 vez por time, 60s).

---

## 4. Fluxo de telas

```
Home → Configuração → Revelação de times → [Loop de rodadas] → Resultado
                                             │
                    Pronto? → Jogando → Fim da vez (resumo) → Placar parcial
```

### 4.1 Home
- Logo, botão **Novo Jogo**, **Continuar** (se houver partida salva), **Configurações** (som/vibração).

### 4.2 Configuração da partida
- Nomes dos times (padrão com sugestões divertidas) e **cor** de cada time.
- Lista de jogadores por time (nome); 2 a 4 por time; botão "Sortear times" a partir de uma lista única.
- Opções: duração da vez (30/45/60/90s), nº de rodadas, regra do Não Pode (Clássico/Suave), penalidade de pular, categorias de cartas habilitadas, pontuação-alvo.
- Validação: mínimo 4 jogadores totais, times com no mínimo 2 jogadores.

### 4.3 Tela "Passe o aparelho" (pré-vez)
- Mostra: time da vez, **nome do passador**, instrução "Passador, pegue o aparelho. Time X, fiquem de frente para ele; o time Y fiscaliza."
- Botão **"Estou pronto"** inicia contagem 3-2-1 e depois o cronômetro.
- Objetivo: evitar que a primeira carta apareça antes de o passador estar com o aparelho.

### 4.4 Tela de jogo (principal)
- **Topo:** cronômetro circular/barra (60s), placar do time da vez, pontos acumulados na vez.
- **Carta central:** palavra-alvo em destaque; abaixo, as 5 palavras proibidas em lista vermelha.
- **Botões (rodapé, grandes, ergonômicos para polegar):**
  - ✅ **Acertou**
  - ⏭️ **Pular**
  - 🚫 **NÃO PODE!** (botão vermelho de destaque)
- Últimos 10s: cronômetro pulsa/vibra, som de alerta.
- Gestos opcionais: deslizar → direita = Acertou, ← esquerda = Pular.
- Bloqueio de tela dormir (Screen Wake Lock API) durante a vez.

### 4.5 Fim da vez
- Resumo: lista de cartas jogadas com ícones (acertou / pulou / não pode / tempo), pontos ganhos e dados ao adversário.
- Permite **corrigir** o resultado de uma carta (desfazer erro de toque) antes de confirmar.
- Botão "Confirmar e continuar".

### 4.6 Placar parcial
- Entre as vezes: placar dos times, rodada atual, próximo passador.

### 4.7 Resultado final
- Time vencedor com animação (confetes), placar final, MVP (jogador com mais acertos), botão **Jogar de novo** (mesmos times) e **Novo jogo**.


---

## 5. Requisitos funcionais

| ID | Requisito |
|---|---|
| RF-01 | Criar partida com 2 times e 4–8 jogadores. |
| RF-02 | Rotacionar passadores de forma justa (cada jogador joga o mesmo nº de vezes, ±1). |
| RF-03 | Cronômetro preciso baseado em timestamp (`performance.now()`), não em `setInterval` acumulado; sobrevive a troca de aba. |
| RF-04 | Embaralhar o baralho (Fisher–Yates) e **nunca repetir carta** dentro da mesma partida. |
| RF-05 | Registrar histórico por carta: resultado, tempo gasto, vez, time. |
| RF-06 | Permitir **desfazer/corrigir** último toque durante a vez (botão "Desfazer", até 1 passo) e no resumo. |
| RF-07 | Persistir estado da partida em `localStorage` a cada transição; permitir retomar. |
| RF-08 | Aplicar regras configuráveis (Clássico/Suave, penalidade de pular, pontuação-alvo). |
| RF-09 | Sons (acerto, não pode, tick, fim) e vibração (`navigator.vibrate`) com toggle global. |
| RF-10 | Funcionar offline (service worker) após o primeiro carregamento. |
| RF-11 | Tela de desempate quando houver empate. |
| RF-12 | Opção de excluir categorias e de marcar "cartas inadequadas" (flag local para ocultar). |

## 6. Requisitos não funcionais

- **Performance:** LCP < 2,0s em 4G; bundle JS inicial < 150 kB gz; Lighthouse ≥ 90 em Performance/Acessibilidade/PWA.
- **Responsivo:** mobile-first (360px+), funciona em tablet e desktop; orientação retrato (landscape suportado).
- **Acessibilidade:** contraste WCAG AA, alvos de toque ≥ 48px, `aria-live` para o cronômetro/placar, não depender só de cor (ícones + texto), respeitar `prefers-reduced-motion`.
- **Privacidade:** nenhum dado pessoal enviado a servidor; nomes dos jogadores ficam só no aparelho; sem cookies de terceiros.
- **Compatibilidade:** últimas 2 versões de Chrome, Safari (iOS 15+), Firefox, Edge.
- **Confiabilidade:** estado restaurado após recarregar a página no meio da vez (retorna à tela "Passe o aparelho" com o tempo da vez reiniciado ou descontado, conforme config).

---

## 7. Modelo de dados

### 7.1 Carta (deck estático em JSON)

```ts
type Card = {
  id: string;            // "c-0001"
  word: string;          // palavra-alvo, ex.: "Churrasco"
  forbidden: [string, string, string, string, string]; // exatamente 5
  category: CategoryId;  // "comida" | "lugares" | "objetos" | "pessoas" | "acoes" | "cultura" | ...
  difficulty: 1 | 2 | 3; // 1 fácil, 3 difícil
};
```

Arquivo: `src/data/cards.json` (carregado no cliente; ~350–500 cartas ≈ 40–60 kB, comprimido pela Vercel).

**Validações automáticas (script de CI `npm run validate:cards`):**
- Exatamente 5 proibidas por carta.
- Proibidas não podem conter a palavra-alvo nem variações triviais (mesmo radical, ignorando acentos/caixa).
- Sem palavras-alvo duplicadas.
- ≥ 350 cartas no total; ≥ 25 por categoria.
- Sem conteúdo ofensivo (lista de bloqueio básica).

### 7.2 Estado da partida

```ts
type Team = { id: "A" | "B"; name: string; color: string; players: Player[]; score: number; nextPlayerIdx: number };
type Player = { id: string; name: string; hits: number };

type Settings = {
  turnSeconds: 30 | 45 | 60 | 90;
  roundsPerTeam: number;            // 2–10
  naoPodeMode: "classic" | "soft";  // classic = encerra a vez
  skipPenalty: 0 | 1;
  targetScore: number | null;
  categories: CategoryId[];
  sound: boolean;
  vibration: boolean;
};

type CardResult = "hit" | "skip" | "naopode" | "timeout";
type TurnLog = { teamId: "A" | "B"; playerId: string; round: number; entries: { cardId: string; result: CardResult }[] };

type GameState = {
  phase: "setup" | "handoff" | "playing" | "turnSummary" | "scoreboard" | "tiebreak" | "finished";
  settings: Settings;
  teams: [Team, Team];
  currentTeamIdx: 0 | 1;
  round: number;
  deck: string[];          // ids restantes (embaralhados)
  currentCardId: string | null;
  turnEndsAt: number | null; // timestamp ms
  history: TurnLog[];
};
```

Gerenciamento de estado: **Zustand** (ou `useReducer`) com máquina de estados explícita (XState opcional) para as fases; persistência com `zustand/middleware/persist`.

---

## 8. Regras de pontuação (resumo)

| Evento | Time do passador | Time adversário |
|---|---|---|
| Acertou | +1 | 0 |
| Pular | 0 (ou −1 se penalidade ativa) | 0 |
| Não Pode! (Clássico) | 0 | +1 e a vez termina |
| Não Pode! (Suave) | 0 | +1 e a vez continua |
| Tempo esgotado | 0 | 0 |

---

## 9. UI / UX

- **Estilo:** festivo, alto contraste, tipografia grande e arredondada, cartão com aparência de carta física (cantos arredondados, sombra).
- **Paleta sugerida:** fundo roxo-escuro/azul-noite; Time A laranja, Time B turquesa; botão "NÃO PODE!" vermelho vivo; acerto verde.
- **Tipografia:** fonte display para título/palavra-alvo (ex.: Fredoka, Baloo 2) e sans legível para proibidas (ex.: Inter/Nunito).
- **Animações:** entrada/saída da carta (slide), "stamp" vermelho "NÃO PODE!" ao acionar, confetes na vitória (leve, sem libs pesadas ou `canvas-confetti`).
- **Feedback sensorial:** vibração curta no acerto, longa no Não Pode; sons curtos (< 1s) gerados pela **Web Audio API** (osciladores), sem arquivos de áudio.
- **Dark mode** como padrão; sem modo claro no MVP.

---

## 10. Stack técnica

| Camada | Escolha |
|---|---|
| Framework | **Vite + React + TypeScript (SPA)**, `BrowserRouter` |
| Estilo | Tailwind CSS |
| Estado | Zustand + persist |
| Animações | Framer Motion (ou CSS puro) |
| PWA | `vite-plugin-pwa` (manifest + service worker) |
| Testes | Vitest (lógica) + Playwright (fluxo E2E) |
| Lint/format | ESLint + Prettier |
| Analytics (opcional) | Vercel Web Analytics (sem cookies) |

O jogo é **100% client-side**: o build gera arquivos estáticos em `dist/`; `vercel.json` faz rewrite de todas as rotas para `index.html`. Não há API.

### Estrutura de pastas

```
nao-pode/
├─ spec.md
├─ public/
│  ├─ manifest.webmanifest
│  ├─ icons/
│  └─ robots.txt
├─ src/
│  ├─ main.tsx / App.tsx        # rotas
│  ├─ pages/
│  │  ├─ Home.tsx
│  │  ├─ Setup.tsx
│  │  ├─ Play.tsx               # handoff + jogo + resumos
│  │  ├─ Result.tsx
│  │  ├─ About.tsx
│  │  └─ online/ (Create, Join, Duel)
│  ├─ online/                   # host.ts, guest.ts, mensagens (PeerJS, import dinâmico)
│  ├─ components/
│  │  ├─ Card.tsx
│  │  ├─ Timer.tsx
│  │  ├─ Scoreboard.tsx
│  │  ├─ ActionButtons.tsx
│  │  └─ TurnSummary.tsx
│  ├─ game/
│  │  ├─ store.ts               # Zustand
│  │  ├─ rules.ts               # funções puras de pontuação/rotação
│  │  ├─ deck.ts                # embaralhar, filtrar categorias
│  │  └─ types.ts
│  ├─ data/cards.json
│  ├─ hooks/ (useTimer, useWakeLock, useSound, useHaptics)
│  └─ lib/
├─ scripts/validate-cards.ts
├─ tests/ (unit + e2e)
└─ package.json
```

---

## 11. Deploy na Vercel

1. Criar repositório no GitHub (`nao-pode`) e subir o código.
2. Em vercel.com → **Add New → Project** → importar o repositório.
3. Framework preset: **Vite** (detectado automaticamente). Build: `vite build`; Output: `dist`.
4. Sem variáveis de ambiente no MVP.
5. Cada `push` na `main` gera deploy de produção; PRs geram **Preview Deployments**.
6. (Opcional) Domínio customizado em *Settings → Domains*.
7. `vercel.json`: rewrite `/(.*)` → `/index.html`; cache longo para assets com hash; `Cache-Control: no-cache` para `sw.js`; cabeçalho `X-Robots-Tag: noindex`.
8. CI (GitHub Actions) rodando `lint`, `test` e `validate:cards` antes do merge.

---

## 12. Conteúdo e questões legais

- O jogo físico "Não Pode" é produto comercial da Party Games; **não copiar** suas cartas, textos, ilustrações, logo ou nome comercial.
- Todas as **350+ palavras e proibidas devem ser criadas originalmente** (ou geradas e revisadas manualmente), sem transcrição das cartas do jogo físico.
- Escolher um **nome próprio** para o projeto/marca (ex.: "Cuidado com a Língua", "Fala Aí, Mas Não Pode") para evitar confusão e infração de marca; "Não Pode" pode ser usado como bordão/botão dentro do jogo, mas confirmar riscos de marca antes de publicar com esse título.
- Mecânicas de jogo (regras) não são protegidas por direito autoral, mas a apresentação, arte e textos são.
- Incluir página de "Sobre" com créditos e aviso de que é um projeto independente.
- Conteúdo das cartas: sem termos discriminatórios, sexuais explícitos ou ofensivos (classificação 14+).

### Categorias iniciais sugeridas (≥ 25 cartas cada)
Comida e bebida · Lugares · Objetos do dia a dia · Profissões · Animais · Esportes · Cultura pop BR (sem usar trechos protegidos, apenas nomes genéricos de gêneros/ícones) · Ações/verbos · Festas e datas · Tecnologia · Natureza.

---

## 13. Critérios de aceite do MVP

- [ ] Consigo criar uma partida com 4–8 jogadores em até 60 segundos.
- [ ] O cronômetro roda exatamente 60s (±0,2s) e continua correto ao trocar de aba/bloquear tela por alguns segundos.
- [ ] Nenhuma carta se repete numa mesma partida.
- [ ] Acertou/Pular/Não Pode! atualizam placar conforme a tabela da seção 8.
- [ ] O passador rotaciona corretamente em ambos os times.
- [ ] Posso corrigir um resultado errado no resumo da vez.
- [ ] Recarregar a página no meio da partida permite continuar.
- [ ] O jogo funciona offline depois do primeiro acesso.
- [ ] Lighthouse mobile ≥ 90 (Perf/A11y/PWA).
- [ ] Deploy público na Vercel acessível por URL, com Preview em PRs.
- [ ] `validate:cards` passa com ≥ 350 cartas válidas.

---

## 14. Roadmap pós-MVP

1. **v1.1:** mais decks e categorias, estatísticas locais (jogador com mais acertos, cartas mais puladas).
2. **v1.2:** 3–4 times, modo "contra o relógio" (todas as palavras em 5 min).
3. **v2.0:** salas online (ver seção 16, WebRTC/PeerJS sem backend): passador vê a carta no celular, fiscais veem a mesma carta em outro dispositivo; chat de voz externo.
4. **v2.1:** criador de decks da comunidade com moderação.

---

## 15. Riscos e decisões em aberto

| Tema | Decisão pendente |
|---|---|
| Nome do produto | Definir nome próprio e verificar disponibilidade de domínio/marca. |
| Regra do "Não Pode" | Manter "Clássico" como padrão ou "Suave"? (testar com grupos reais) |
| Fiscalização | Quem toca no botão: sempre o time adversário (aparelho na mesa visível) ou o passador por honestidade? Padrão proposto: o passador segura o aparelho virado para si; botão de "Não Pode!" fica acessível ao fiscal que ele aponta (aparelho apoiado) — validar em playtest. |
| Conteúdo | Quem cria/revisa as 350 cartas (autoria própria vs. geração assistida + revisão humana). |
| Online | Decidido: Duelo 1x1 via PeerJS (seção 16).


---

## 16. Modo Online 1x1 ("Duelo")

Modo extra para jogar à distância, cada pessoa no seu celular, em **duelo 1x1**, com chamada de voz em outro app (WhatsApp/Discord). Feito para ser **bobinho**: sem banco de dados, sem backend próprio, sem login. Vence quem **mais fizer o outro acertar**.

### 16.1 Como funciona (sem servidor)
- `localStorage`/cookies são locais a cada aparelho e **não** sincronizam entre dois celulares. Por isso a conexão é **direta entre os navegadores (WebRTC) via PeerJS**; o broker público do PeerJS só faz o "aperto de mão" inicial, não guarda nada.
- **Quem cria a sala é o anfitrião** (Jogador A). O navegador dele guarda o estado do jogo e é a "fonte da verdade". O Jogador B conecta nele.
- Nada de contas, códigos complexos, chaves ou reivindicação de vaga.

### 16.2 Entrar na sala
1. A abre `/on` e toca **Criar sala**. Aparece um **link** (`/on/<codigo>`) com botão **Copiar link** / **Compartilhar**.
2. A manda o link para B (WhatsApp). B abre e digita só o nome; conecta sozinho.
3. O `<codigo>` é gerado uma vez e guardado no `localStorage` de A, então **o link de A é sempre o mesmo** (dá para fixar nos favoritos). Se A não tiver sala aberta, quem abrir o link vê "Sala não encontrada, peça para ela abrir".
4. Um terceiro aparelho com o link vê "Sala cheia". Sem takeover, sem timeout.

### 16.3 Cache/cookies do navegador (única "persistência")
| Chave `localStorage` | Conteúdo |
|---|---|
| `duel:me` | nome do jogador, papel (`host`/`guest`) e código da sala |
| `duel:settings` | segundos por vez, vezes de cada um, penalidade do Não Pode |
| `duel:state` | (só anfitrião) estado atual da partida, para continuar ao recarregar |

- Recarregar a página do **convidado**: reconecta sozinho no mesmo código e recebe o estado de volta.
- Recarregar a página do **anfitrião**: restaura `duel:state` e reabre a sala com o mesmo código; o convidado reconecta automaticamente.
- Se o anfitrião fechar o app por muito tempo, o convidado vê "Reconectando…" com botão **Tentar de novo**. Limpar o cache = perder a partida (aceitável).
- Botão **Nova partida** limpa `duel:state` e zera o placar.

### 16.4 Cartas diferentes para cada um
- O baralho (`cards.json`) já vem no app, então não precisa de servidor.
- Ao iniciar, o anfitrião embaralha e **divide em dois baralhos sem cartas em comum** (A e B nunca veem a mesma carta).
- O anfitrião só **envia a carta atual** a B quando for a vez de B descrever. Anti-trapaça além disso está **fora de escopo** (é um jogo entre duas pessoas que se gostam).

### 16.5 Fluxo do duelo
1. **Lobby:** os dois veem quem está conectado, marcam **Pronto**. Opções (editáveis pelo anfitrião): segundos por vez (30/45/60), vezes de cada um (padrão 3), penalidade do Não Pode (0 ou −1).
2. **Vez do A:** A vê a carta e descreve por voz. B vê a tela de adivinhação com cronômetro e botões **Acertou!** e **NÃO PODE!**.
   - B toca **Acertou!** → +1 para A, nova carta para A.
   - B toca **NÃO PODE!** → carta descartada, penalidade configurada para A, e a vez continua (modo "Suave" fixo, para ficar simples).
   - A pode tocar **Pular** (sem penalidade).
3. **Vez do B:** papéis trocam.
4. Ao fim das vezes vence quem fez mais pontos. Empate → vale empate mesmo (ou **revanche**).
5. **Revanche** com um toque (novo embaralhamento, mesma sala).

### 16.6 Sincronização
- O anfitrião guarda `turnEndsAt` (timestamp do próprio relógio) e envia ao convidado o **tempo restante** em cada mensagem; cada lado roda o cronômetro localmente e se corrige a cada mensagem. Diferença esperada < 0,5s.
- Ações do convidado (`ready`, `hit`, `naopode`, `skip`) viajam como mensagens para o anfitrião, que atualiza o estado e responde com o novo estado a ambos.

### 16.7 Modelo de dados (vive na memória do anfitrião + `duel:state`)
```ts
type DuelState = {
  settings: { turnSeconds: number; turnsEach: number; naoPodePenalty: 0 | 1 };
  names: { a: string; b?: string };
  ready: { a: boolean; b: boolean };
  phase: "lobby" | "turn" | "finished";
  turn: { index: number; describer: "a" | "b"; endsAt: number | null };
  decks: { a: string[]; b: string[] };   // ids sem cartas em comum
  cursor: { a: number; b: number };
  score: { a: number; b: number };
};
type Msg =
  | { t: "hello"; name: string }
  | { t: "action"; type: "ready" | "hit" | "naopode" | "skip" }
  | { t: "state"; state: PublicState };  // o anfitrião filtra: a carta só vai para quem descreve
```

### 16.8 Páginas
- `/on` — "Criar sala" (anfitrião).
- `/on/<codigo>` — mesma tela, que se comporta como anfitrião ou convidado conforme `duel:me`.

### 16.9 Critérios de aceite do modo online
- [ ] A cria a sala e B entra pelo link em menos de 10s, sem cadastro.
- [ ] Nenhuma carta aparece nos dois baralhos; B só recebe a carta na vez dele descrever.
- [ ] O cronômetro difere no máximo ~0,5s entre os aparelhos.
- [ ] Recarregar a página do convidado ou do anfitrião volta ao mesmo estado.
- [ ] Placar final e vencedor idênticos nos dois aparelhos; revanche funciona.
- [ ] Zero banco de dados e zero rotas de API próprias; deploy continua estático na Vercel.

### 16.10 Limitações aceitas
- O anfitrião precisa manter o app aberto (se bloquear a tela muito tempo, o jogo pausa até voltar). Usar Wake Lock.
- WebRTC pode falhar em algumas redes restritivas (4G de certas operadoras, Wi-Fi corporativo). Se acontecer, a saída é trocar para dados móveis/Wi-Fi em um dos lados; usar o servidor TURN gratuito do PeerJS já cobre a maioria dos casos.
- Voz: o jogo não inclui áudio; usar chamada externa. Futuro: áudio embutido via a mesma conexão WebRTC.
