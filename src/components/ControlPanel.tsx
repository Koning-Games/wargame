import { BadgePlus, Flag, RefreshCcw, Swords, Undo2 } from "lucide-react";
import { territories } from "../data/mapData";
import { useWar } from "../context/WarContext";
import type { Phase } from "../types/game";

const phaseLabels: Record<Phase, string> = {
  reinforce: "Distribuicao",
  attack: "Ataque",
  fortify: "Remanejamento",
  gameOver: "Fim",
};

export function ControlPanel() {
  const { state, currentPlayer, activeTerritories, canTradeCards, actions } = useWar();
  const totalTroops = activeTerritories.reduce((total, territory) => total + territory.state.troops, 0);
  const controlledContinents = Array.from(new Set(territories.map((territory) => territory.continent))).filter((continent) =>
    territories.filter((territory) => territory.continent === continent).every((territory) => state.territories[territory.id]!.owner === currentPlayer.id),
  );

  return (
    <section className="panel rounded-lg p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <span className="phase-pill border-command-brass bg-white/75 text-command-brass">{phaseLabels[state.phase]}</span>
          <h2 className="mt-3 text-2xl font-black">{currentPlayer.name}</h2>
          <p className="text-sm font-semibold text-command-line">{currentPlayer.isBot ? "Bot agressivo em operacao" : "Seu comando"}</p>
        </div>
        <div className="h-12 w-12 rounded-md border-4 border-white shadow" style={{ backgroundColor: currentPlayer.color }} />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Metric label="Territorios" value={activeTerritories.length} />
        <Metric label="Tropas" value={totalTroops} />
        <Metric label="Cartas" value={currentPlayer.cards.length} />
      </div>

      <div className="mt-4 rounded-md border border-command-line/20 bg-white/60 p-3">
        <div className="mb-2 flex items-center justify-between text-sm font-bold">
          <span>Reforcos</span>
          <span>{state.reinforcements}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-command-line/15">
          <div className="h-full bg-command-brass transition-all" style={{ width: `${Math.min(100, state.reinforcements * 12)}%` }} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button className="control-button" onClick={actions.endPhase} disabled={currentPlayer.isBot || state.phase === "gameOver"}>
          {state.phase === "reinforce" ? <Swords size={17} /> : state.phase === "attack" ? <Flag size={17} /> : <Undo2 size={17} />}
          {state.phase === "reinforce" ? "Atacar" : state.phase === "attack" ? "Remanejar" : "Encerrar"}
        </button>
        <button className="control-button" onClick={actions.tradeCards} disabled={currentPlayer.isBot || !canTradeCards || state.phase === "gameOver"}>
          <BadgePlus size={17} />
          Trocar cartas
        </button>
        <button className="control-button" onClick={actions.reset}>
          <RefreshCcw size={17} />
          Reiniciar
        </button>
      </div>

      <div className="mt-4 grid gap-2">
        <InfoLine label="Continentes" value={controlledContinents.length > 0 ? controlledContinents.join(", ") : "Nenhum completo"} />
        <InfoLine label="Baralho" value={`${state.deck.length} cartas restantes`} />
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-command-line/20 bg-white/70 p-2">
      <div className="text-xl font-black">{value}</div>
      <div className="text-[11px] font-bold uppercase text-command-line">{label}</div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 rounded-md bg-white/50 px-3 py-2 text-sm">
      <span className="font-bold text-command-line">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}
