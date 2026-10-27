# Etapa 4 — Plano Faseado

Cada fase termina com algo **rodando e testável**. Não começo a próxima sem seu OK. Estimativas em esforço relativo (P/M/G).

## Parte A — Jogo local

### Fase 0 — Esqueleto (P)
- `npm create vite` (React + TS), Tailwind, Zustand, react-router, Vitest, ESLint/Prettier.
- Copiar `cards.json` para `src/data/`. `vercel.json`, `robots.txt`, meta `noindex`.
- **Pronto quando:** `npm run dev` abre uma página, `npm test` roda, `npm run build` passa.

### Fase 1 — Dados e regras puras (M)
- `types.ts`, `deck.ts` (Fisher–Yates, filtro por categoria, sem repetir), `rules.ts` (reducer: acertou/pular/não pode/tempo, rotação de passadores, fim de partida, desempate).
- `scripts/validate-cards.ts` (5 proibidas, sem radical da palavra-alvo, sem duplicadas, mínimos por categoria).
- Testes Vitest cobrindo a tabela do §8 e o RF-02.
- **Pronto quando:** testes verdes e `validate:cards` passa (corrigindo cartas que falharem).

### Fase 2 — Fluxo jogável sem polimento (G)
- Store Zustand + persist (`np:game`), telas: Home, Setup (times, jogadores, opções), Passe o aparelho (3-2-1), Jogo (cronômetro por timestamp, 3 botões), Resumo da vez (corrigir resultado), Placar, Resultado.
- `useTimer`, desfazer 1 passo (RF-06), retomar partida (RF-07).
- **Pronto quando:** dá para jogar uma partida inteira local, recarregar no meio e continuar.

### Fase 3 — Polimento do local (M)
- Sons via Web Audio, vibração, confetes leves, animações de carta e "stamp", Wake Lock, gestos de deslizar, tema (roxo/laranja/turquesa), fontes, acessibilidade (aria-live, alvos 48px, reduced-motion).
- Página Sobre (projeto independente).
- **Pronto quando:** visual e feedback conforme §9, sem quebrar os testes.

### Fase 4 — PWA e deploy (P)
- `vite-plugin-pwa` (manifest, ícones, offline), Lighthouse ≥ 90.
- Repositório Git + push, projeto na Vercel, URL pública.
- **Pronto quando:** abre pelo link, instala no celular, funciona em modo avião.
- 🏁 **Marco 1: jogo local no ar.**

## Parte B — Duelo online

### Fase 5 — Núcleo do duelo (M)
- `DuelState` + reducer puro do duelo (divisão de baralhos sem cartas em comum, vez, placar, revanche) com testes Vitest.
- Filtro `PublicState` (carta só para quem descreve).
- **Pronto quando:** testes provam baralhos disjuntos e o filtro de visibilidade.

### Fase 6 — Conexão PeerJS (G)
- `online/host.ts` e `guest.ts` (import dinâmico), mensagens `hello/action/state` com campo de versão, retry com backoff, persistência `duel:*`, reconexão de ambos os lados.
- Telas: `/on` (criar sala + copiar/compartilhar link), `/on/<codigo>` (nome + entrar), mensagens de erro (sala não encontrada, cheia, versão diferente, reconectando).
- **Pronto quando:** dois navegadores (ou aba normal + anônima) conectam e trocam o estado do lobby.

### Fase 7 — Duelo completo (M)
- Lobby (pronto, opções), tela de quem descreve vs quem adivinha, cronômetro sincronizado, Acertou/Não Pode/Pular, placar final, revanche, Wake Lock, sons/vibração reaproveitados.
- **Pronto quando:** partida inteira entre dois aparelhos reais, incluindo recarregar cada lado no meio.

### Fase 8 — Deploy final e teste real (P)
- Deploy, teste celular + celular em 4G/Wi-Fi, verificação dos critérios §16.9 e §13.
- 🏁 **Marco 2: tudo no ar e testado com sua namorada.**

## Ordem e dependências
0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8. A fase 5 só depende da 1; se quiser o online antes do polimento, dá para pular 3 e 4 (não recomendo, pois PWA/deploy ajudam a testar em celular real).

## Pontos de controle
- Ao fim de cada fase eu paro, mostro o que roda e espero seu OK.
- Commits só quando você pedir.

## Decisão para você
Quer **commits automáticos por fase** (precisa de `git init`), ou prefere cuidar do Git? Pergunto agora porque a Fase 0 cria o repositório.
