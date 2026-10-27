# Etapa 3 — Impactos

O que as decisões da etapa 2 mudam no spec, na arquitetura e no risco. Nada aqui é código ainda.

## 1. Impactos no spec (precisam de edição)
| Seção | Ajuste |
|---|---|
| 1, 10 | Stack passa a ser **Vite + React + TS (SPA)**. Next.js, `next-pwa` e `output: "export"` saem. |
| 10 (pastas) | `src/app/*` vira `src/pages/*` + `src/main.tsx`; rotas via `HashRouter`. |
| 11 (Vercel) | Framework preset **Vite**, build `vite build`, saída `dist/`. Sem rewrites, porque o HashRouter dispensa. |
| 16.8 | `/on#codigo` conflita com HashRouter (o hash já é a rota). Ver decisão D1 abaixo. |
| 12 | Nome "Não Pode" mantido ao publicar: ver risco R1. |
| 15 | "Online" deixa de ser decisão em aberto. |

## 2. Decisões técnicas geradas
- **D1 – Rota do online.** Com HashRouter, o link vira `/#/on/<codigo>`. Alternativa: `BrowserRouter` + `vercel.json` com rewrite para `index.html`, e o link fica `/on/<codigo>`. **Recomendo BrowserRouter + rewrite** (link mais limpo, 3 linhas de config, Vercel suporta nativo). O spec 16.8 muda para `/on/<codigo>`.
- **D2 – Lógica de jogo pura e compartilhada.** `game/rules.ts` vira um reducer sem React (`(state, action) => state`). O jogo local o usa via Zustand; o anfitrião online o usa dentro do `host.ts`. Isso é o que torna a Parte B barata: **sem duplicar regras**.
- **D3 – Duelo ≠ jogo de times.** O spec tem `GameState` de times, mas o duelo é 1x1 com baralhos separados e sem fiscais. Modelos diferentes (`GameState` vs `DuelState`), mas compartilham `types.ts` de carta, `deck.ts`, `useTimer` e componentes visuais. Não forçar um modelo único.
- **D4 – Chaves de `localStorage` separadas:** `np:game` (local, Zustand persist) e `duel:*` (online). Sem colisão.

## 3. Impactos na arquitetura
- **Service worker (PWA) × online:** o SW faz cache do app shell; a conexão WebRTC não passa por ele, então não há conflito. Risco real é **versão velha em cache**: os dois jogadores com versões diferentes quebram o protocolo de mensagens. Mitigação: campo `v` (versão do protocolo) no `hello`; se divergir, mostrar "Atualize a página".
- **Bundle:** PeerJS pesa ~90 kB min. Importar com `import()` dinâmico só ao abrir `/on` para manter o inicial < 150 kB gz.
- **Wake Lock / vibração / áudio:** hooks únicos usados pelos dois modos, com fallback para iOS.
- **cards.json:** sem mudança de formato. Um deck de 500 cartas dividido em dois no duelo dá 250 por pessoa, mais que o suficiente.
- **Testes:** a regra pura (D2) permite testar placar/rotação/duelo com Vitest sem navegador. O online precisa de teste manual com dois aparelhos.

## 4. Riscos
| ID | Risco | Impacto | Mitigação |
|---|---|---|---|
| R1 | Publicar com o nome "Não Pode" (marca do jogo físico) | Possível notificação de marca/takedown na Vercel | Você decidiu manter. Colocar página "Sobre" com aviso de projeto independente, sem logo/arte/textos do original (já no spec §12). Se vier problema, trocar o nome é só texto e `manifest`. Sugiro também não indexar (`noindex`) já que é uso pessoal. |
| R2 | Broker PeerJS público fora do ar | Online indisponível | Aceito. Plano B: trocar o host do broker por um próprio depois. |
| R3 | Rede restritiva bloqueia WebRTC | Duelo não conecta | Já listado no spec §16.10. |
| R4 | Anfitrião reconectando com ID ocupado | Falha ao recarregar | Retry com backoff (até ~15s) e mensagem na tela. |
| R5 | Escopo grande (PWA, sons, confetes, online) | Demora | Plano faseado entrega jogo jogável cedo e deixa polimento por último. |
| R6 | Sons/arte originais | Preciso de áudios | Gerar com Web Audio API (osciladores) em vez de arquivos: zero assets, sem direitos autorais. |

## 5. O que NÃO muda
Regras de pontuação (§8), fluxo de telas do local (§4), modelo de carta (§7.1), critérios de aceite do MVP (§13) e do online (§16.9).

## 6. Perguntas
1. **D1:** aprova BrowserRouter + `vercel.json` rewrite (link `/on/<codigo>`)?
2. **R1:** coloco `noindex` no site para não aparecer no Google?
3. **R6:** ok gerar os sons via Web Audio API em vez de arquivos de áudio?

## 7. Respostas (decididas)
1. **D1:** `BrowserRouter` + rewrite no `vercel.json`; link `/on/<codigo>`.
2. **`noindex`:** sim (meta + `robots.txt` + header `X-Robots-Tag`).
3. **Sons:** Web Audio API, sem arquivos de áudio.
Spec já atualizado com essas decisões e a troca para Vite.
