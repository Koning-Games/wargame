import { ControlPanel } from "./components/ControlPanel";
import { DicePanel } from "./components/DicePanel";
import { EventLog } from "./components/EventLog";
import { GameMap } from "./components/GameMap";
import { OnlinePanel } from "./components/OnlinePanel";
import { WarProvider } from "./context/WarContext";

export function App() {
  return (
    <WarProvider>
      <main className="min-h-screen p-3 sm:p-5 lg:p-6">
        <div className="mx-auto grid max-w-[1800px] gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="panel overflow-hidden rounded-lg">
            <GameMap />
          </section>
          <aside className="grid gap-4 lg:max-h-[calc(100vh-3rem)] lg:grid-rows-[auto_auto_auto_minmax(0,1fr)]">
            <ControlPanel />
            <OnlinePanel />
            <DicePanel />
            <EventLog />
          </aside>
        </div>
      </main>
    </WarProvider>
  );
}
