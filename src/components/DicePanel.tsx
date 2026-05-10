import { Dice5 } from "lucide-react";
import { useWar } from "../context/WarContext";

export function DicePanel() {
  const { state } = useWar();
  const battle = state.latestBattle;

  return (
    <section className="panel rounded-lg p-4">
      <div className="mb-3 flex items-center gap-2">
        <Dice5 size={20} />
        <h2 className="text-lg font-black">Dados de combate</h2>
      </div>

      {battle ? (
        <div className="grid gap-3">
          <DiceRow label="Ataque" dice={battle.attackerRolls} tone="attack" />
          <DiceRow label="Defesa" dice={battle.defenderRolls} tone="defense" />
          <div className="rounded-md border border-command-line/20 bg-white/65 p-3 text-sm font-bold">
            Perdas: ataque {battle.attackerLosses}, defesa {battle.defenderLosses}
            {battle.conquered ? <span className="ml-2 text-green-700">Conquista confirmada.</span> : null}
          </div>
        </div>
      ) : (
        <p className="rounded-md border border-command-line/20 bg-white/60 p-3 text-sm font-semibold text-command-line">
          Os resultados aparecem aqui apos o primeiro ataque.
        </p>
      )}
    </section>
  );
}

function DiceRow({ label, dice, tone }: { label: string; dice: number[]; tone: "attack" | "defense" }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-black uppercase text-command-line">{label}</span>
      <div className="flex gap-2">
        {dice.map((value, index) => (
          <span
            key={`${label}-${index}`}
            className={`grid h-10 w-10 place-items-center rounded-md border text-lg font-black shadow-sm ${
              tone === "attack" ? "border-red-900/30 bg-red-600 text-white" : "border-blue-900/30 bg-blue-600 text-white"
            }`}
          >
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}
