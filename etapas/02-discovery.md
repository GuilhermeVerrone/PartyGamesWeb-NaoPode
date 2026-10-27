# Etapa 2 — Discovery

## 1. Estado atual do projeto
| Item | Situação |
|---|---|
| Código | Nenhum. Não há `package.json`, nem git. |
| `spec.md` | Completo (22 KB): MVP local (seções 1–13) + Duelo online (16, já simplificado). |
| `cards.json` | 500 cartas, formato igual ao do spec (`id, word, forbidden[5], category, difficulty`). |
| Ambiente | Node 24.7, npm 11.5 disponíveis. |

## 2. Qualidade do `cards.json`
- 500 cartas, 0 palavras-alvo duplicadas, 0 cartas com proibidas repetidas, todas com exatamente 5 proibidas.
- 12 categorias: objetos 56, ações 52, comida 47, lugares 45, animais 43, cultura 43, esportes 40, tecnologia 38, profissões 38, natureza 37, festas 36, **pessoas 25**.
- **Dificuldade desbalanceada:** 400 fáceis, 97 médias, só 3 difíceis. O filtro por dificuldade não vale a pena; fica fora do MVP.
- Falta rodar a regra "proibida não contém a palavra-alvo / mesmo radical" (será o `validate:cards` na execução).
- Categoria `pessoas` está no limite mínimo (25).

## 3. Stack (decisões)
| Camada | Decisão | Motivo |
|---|---|---|
| Framework | **Vite + React + TS (SPA)** em vez de Next.js | App 100% client-side, sem API, sem SSR. Menor, mais simples, PWA fácil, e roteamento por hash casa com `/on#codigo`. Spec aceita ("ou Vite + React"). |
| Estilo | Tailwind CSS | Spec |
| Estado | Zustand + persist | Spec |
| PWA | `vite-plugin-pwa` | Equivalente ao next-pwa |
| Online | **PeerJS 1.5.5** (WebRTC) | Spec seção 16 |
| Testes | Vitest para `game/` (regras puras); Playwright só no fim | Spec |
| Animação | CSS puro + Framer Motion só se precisar | Bundle < 150 kB gz |
| Roteamento | `react-router` com HashRouter | Funciona em hospedagem estática sem rewrites |

⚠️ Mudança em relação ao spec: troca Next.js por Vite. Preciso do seu OK (ver perguntas).

## 4. Pontos técnicos de risco investigados
1. **PeerJS:** broker público `0.peerjs.com` é gratuito, sem garantia de SLA. Aceitável para uso de duas pessoas; dá para trocar o broker depois.
2. **Anfitrião reconectando com o mesmo ID:** o broker pode manter o ID "ocupado" por alguns segundos após recarregar. Precisa de retry com backoff.
3. **iOS Safari:** Wake Lock só a partir do iOS 16.4; `navigator.vibrate` não existe no iOS. Ambos precisam de fallback silencioso.
4. **Cronômetro:** baseado em timestamp (já no spec). No online, anfitrião envia tempo restante a cada mensagem.
5. **Áudio:** sons precisam de um toque do usuário antes de tocar (autoplay). O botão "Estou pronto" já resolve.

## 5. O que dá para reaproveitar entre local e online
- `game/types.ts`, `game/deck.ts` (embaralhar/filtrar), `game/rules.ts` (pontuação), `useTimer`, `useWakeLock`, `useSound`, `useHaptics`, componentes `Card`, `Timer`, `ActionButtons`.
- O que é **novo** no online: `online/host.ts`, `online/guest.ts`, mensagens, tela de lobby/criar sala.

## 6. Perguntas para você (bloqueiam a etapa 3)
1. Aprova **Vite + React SPA** no lugar de Next.js?
2. Nome do produto: mantém "Não Pode" por enquanto (só uso pessoal) ou já escolhe outro?
3. Vai publicar na Vercel já, ou só rodar local por enquanto?
4. A Parte A inclui tudo do MVP (PWA, sons, confetes; sem tutorial) ou quer cortar o que não importa para jogar com sua namorada?

## 7. Respostas (decididas)
1. Vite + React SPA: **aprovado**.
2. Nome: **"Não Pode"** mantido, mesmo publicando.
3. **Publicar na Vercel**.
4. Jogo local: **MVP completo** (PWA, sons, vibração, confetes), **sem tutorial/Como jogar**.
