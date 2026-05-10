# War Command

Jogo de estrategia por turnos para navegador, inspirado em WAR/Risk.

## Rodando

```bash
pnpm install
pnpm dev
```

Pelo repositorio raiz:

```bash
pnpm war:dev
pnpm war:build
pnpm war:preview
```

## Multiplayer online

O deploy recomendado e:

- Frontend: Vercel, usando este app Vite.
- Estado em tempo real: Supabase Realtime.

Passos:

1. Crie um projeto no Supabase.
2. Execute `supabase-schema.sql` no SQL editor do Supabase.
3. Copie `.env.example` para `.env.local` em desenvolvimento.
4. Na Vercel, configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
5. Faca deploy da pasta `war-game` ou configure a Vercel com:
   - Root Directory: `war-game`
   - Build Command: `pnpm build`
   - Output Directory: `dist`

## Estrutura

- `src/hooks/useWarEngine.ts`: estado central do jogo, fases, combate, cartas, reforcos e bot.
- `src/components/GameMap.tsx`: mapa-mundi SVG interativo com territorios clicaveis.
- `src/components/ControlPanel.tsx`: fase atual, metricas, cartas e comandos.
- `src/components/OnlinePanel.tsx`: criacao e entrada em salas online.
- `src/components/DicePanel.tsx`: resultado dos dados de ataque e defesa.
- `src/components/EventLog.tsx`: historico de acoes.
- `src/data/mapData.ts`: territorios, vizinhancas e bonus de continentes.

## Regras implementadas

- Reforcos por territorios com minimo de 3 tropas e bonus por continente completo.
- Ataque com ate 3 dados, defesa com ate 3 dados e comparacao ordenada dos maiores resultados.
- Conquista de territorio com ganho de carta ao fim do turno.
- Troca de cartas por conjuntos iguais ou um de cada simbolo.
- Remanejamento tatico entre territorios aliados adjacentes.
- Bots com distribuicao em fronteiras e ataques agressivos quando ha vantagem.
