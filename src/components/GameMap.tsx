import { Crosshair, Shield } from "lucide-react";
import { continentBonuses, territories, territoryById } from "../data/mapData";
import { useWar } from "../context/WarContext";
import type { TerritoryDefinition } from "../types/game";

const continentTint: Record<TerritoryDefinition["continent"], string> = {
  "America do Norte": "#d9ead7",
  "America do Sul": "#f6ddbd",
  Europa: "#d8e2f1",
  Africa: "#ead8be",
  Asia: "#ead2d2",
  Oceania: "#d8eee9",
};

export function GameMap() {
  const { state, currentPlayer, selectedSource, selectedTarget, actions } = useWar();

  return (
    <div className="flex h-full min-h-[620px] flex-col bg-[#c7d7d4]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-command-line/25 bg-command-panel/90 px-4 py-3">
        <div>
          <h1 className="text-xl font-black uppercase text-command-ink sm:text-2xl">War Command</h1>
          <p className="text-sm font-semibold text-command-line">Domine continentes, rompa fronteiras e administre seus reforcos.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(continentBonuses).map(([continent, bonus]) => (
            <span key={continent} className="rounded-md border border-command-line/20 bg-white/70 px-2 py-1 text-xs font-bold">
              {continent}: +{bonus}
            </span>
          ))}
        </div>
      </div>

      <div className="relative flex-1 overflow-auto">
        <svg
          className="min-h-[620px] w-[1180px] max-w-none sm:w-full"
          viewBox="0 0 1700 1240"
          role="img"
          aria-label="Mapa estrategico com territorios clicaveis"
        >
          <rect width="1700" height="1240" fill="#9fb9bd" />
          <path d="M0 1010 C180 970 320 1015 520 984 C768 945 918 1034 1142 1000 C1360 968 1534 1016 1700 960 L1700 1240 L0 1240 Z" fill="#8aabae" opacity="0.35" />
          {territories.map((territory) => {
            const territoryState = state.territories[territory.id]!;
            const owner = state.players.find((player) => player.id === territoryState.owner)!;
            const isSource = selectedSource === territory.id;
            const isTarget = selectedTarget === territory.id;
            const canAct = !currentPlayer.isBot && state.phase !== "gameOver";
            const stroke = isSource ? "#111827" : isTarget ? "#ffffff" : "#4c463c";

            return (
              <g key={territory.id}>
                <path
                  d={territory.path}
                  fill={owner.color}
                  opacity={isSource ? 0.98 : 0.86}
                  stroke={stroke}
                  strokeWidth={isSource ? 8 : 3}
                  className={canAct ? "cursor-pointer transition hover:brightness-110" : ""}
                  onClick={() => actions.selectTerritory(territory.id)}
                />
                <path d={territory.path} fill={continentTint[territory.continent]} opacity="0.18" pointerEvents="none" />
                <TerritoryLabel territory={territory} troops={territoryState.troops} selected={isSource} />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="grid gap-2 border-t border-command-line/20 bg-command-panel/90 px-4 py-3 text-sm sm:grid-cols-2">
        <div className="flex items-center gap-2 font-semibold">
          <Shield size={18} color={currentPlayer.color} />
          <span>{currentPlayer.name}</span>
        </div>
        <div className="flex items-center gap-2 font-semibold sm:justify-end">
          <Crosshair size={18} />
          <span>{selectedSource ? territoryById[selectedSource]!.name : "Selecione um territorio"}</span>
        </div>
      </div>
    </div>
  );
}

function TerritoryLabel({ territory, troops, selected }: { territory: TerritoryDefinition; troops: number; selected: boolean }) {
  return (
    <g pointerEvents="none">
      <circle cx={territory.label.x} cy={territory.label.y - 8} r={selected ? 24 : 20} fill="#fff8e8" stroke="#2f2b25" strokeWidth="3" />
      <text x={territory.label.x} y={territory.label.y} textAnchor="middle" className="fill-command-ink text-[28px] font-black">
        {troops}
      </text>
      <text x={territory.label.x} y={territory.label.y + 31} textAnchor="middle" className="fill-command-ink text-[18px] font-bold">
        {territory.name}
      </text>
    </g>
  );
}
