# Etapa 1 — Prompt Guide (Modo Online "Duelo")

Guia fixo para todas as etapas seguintes. Se algo aqui conflitar com o spec, vale o que está aqui (e o spec deve ser atualizado).

## Objetivo
Permitir que duas pessoas joguem "Não Pode" 1x1 à distância, cada uma no seu celular, enquanto conversam por ligação em outro app.

## Ordem de entrega
Decidido: **A) jogo local completo primeiro, B) modo online depois**, reaproveitando `game/` (regras, deck, tipos) e componentes.

## Princípios (não negociáveis)
1. **Bobinho.** Sem banco de dados, sem backend próprio, sem login, sem rotas de API.
2. **Persistência = navegador.** `localStorage` guarda nome, configurações e estado do anfitrião.
3. **Sync = WebRTC (PeerJS).** Anfitrião é a fonte da verdade; convidado envia ações e recebe estado.
4. **Sem frescura.** Sem anti-trapaça, sem takeover de vaga, sem chaves, sem timeouts de sala.
5. **Deploy estático na Vercel.**

## Escopo
**Dentro (Parte A, jogo local):** MVP completo do spec seções 1–13 (2 times, passando o aparelho, PWA offline, persistência).
**Dentro (Parte B, online):** criar sala por link, lobby, configurações, vez a vez (Acertou / Não Pode / Pular), cronômetro, placar, fim de jogo, revanche, reconexão ao recarregar, Wake Lock.
**Fora:** contas, ranking, mais de 2 jogadores, áudio embutido, TURN próprio, anti-cheat, PWA offline do modo online.

## Fonte de verdade
- Regras e fluxo: `spec.md` seção 16.
- Cartas: `cards.json`.

## Convenções de trabalho
- Responder em português do Brasil.
- Cada etapa gera um arquivo em `etapas/` e termina esperando aprovação antes da próxima.
- Não escrever código antes da etapa 5. Decisões em aberto viram pergunta, não suposição silenciosa.
- Mudança de escopo atualiza este guia e o spec.

## Definição de pronto (etapa 5)
Os critérios de aceite da seção 16.9 do spec, testados com dois navegadores/aparelhos reais.

## Riscos já conhecidos
- WebRTC falhar em redes restritivas.
- Anfitrião bloquear a tela e pausar o jogo.
- Perda de partida se o cache for limpo (aceito).

## Próximas etapas
2. Discovery — ver `02-discovery.md`.
3. Impactos — o que o modo online exige do jogo local/estrutura do projeto.
4. Plano Faseado — fases pequenas e testáveis.
5. Execução — implementar fase a fase.
