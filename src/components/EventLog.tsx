import { ScrollText } from "lucide-react";
import { useWar } from "../context/WarContext";

const toneClass = {
  info: "border-command-line/15 bg-white/55",
  success: "border-green-700/25 bg-green-50/80 text-green-950",
  danger: "border-red-800/25 bg-red-50/80 text-red-950",
};

export function EventLog() {
  const { state } = useWar();

  return (
    <section className="panel min-h-[260px] overflow-hidden rounded-lg">
      <div className="flex items-center gap-2 border-b border-command-line/20 px-4 py-3">
        <ScrollText size={19} />
        <h2 className="text-lg font-black">Log de eventos</h2>
      </div>
      <div className="max-h-[34vh] overflow-y-auto p-3 lg:max-h-none">
        <div className="grid gap-2">
          {state.log.map((entry) => (
            <article key={entry.id} className={`rounded-md border px-3 py-2 text-sm font-semibold ${toneClass[entry.tone]}`}>
              {entry.text}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
