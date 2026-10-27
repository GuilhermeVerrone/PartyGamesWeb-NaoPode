# Não Pode — instruções do projeto

Party game de palavras proibidas (Vite + React + TS, SPA estática na Vercel) com modo local e duelo online 1x1 via PeerJS. Sem backend, sem banco.

## Fontes de verdade
- Regras e fluxo: `spec.md` (online na seção 16).
- Cartas: `cards.json` (copiado para `src/data/`).
- Processo: `etapas/01-prompt-guide.md` a `04-plano-faseado.md`. Seguir as fases do plano, uma por vez; parar ao fim de cada fase e esperar OK.

## Princípios
- Bobinho: sem banco, sem API, sem login. Persistência só em `localStorage`.
- Online = WebRTC (PeerJS), anfitrião é a fonte da verdade.
- Regras do jogo são funções/reducers puros em `src/game/`, testados com Vitest.
- Sons via Web Audio API (sem arquivos). Sem tutorial. Site com `noindex`.
- Responder ao usuário em português do Brasil.

## Git
- **Um commit a cada alteração concluída**, curto e em **inglês**.
- Formato Conventional Commits (compatível com releases automáticos): `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `perf:`, `style:`, `build:`, `ci:`. Escopo opcional: `feat(timer): ...`.
- Mensagem em uma linha, imperativo, minúscula, sem ponto final. Ex.: `feat: add turn timer hook`.
- **Sem `Co-Authored-By`** e sem nenhuma linha de atribuição/assinatura de IA nos commits.
