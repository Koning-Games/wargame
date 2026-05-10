import { createContext, type ReactNode, useContext } from "react";
import { useWarEngine, type WarEngine } from "../hooks/useWarEngine";
import { useOnlineRoom, type OnlineRoomController } from "../hooks/useOnlineRoom";

type WarContextValue = WarEngine & { online: OnlineRoomController };

const WarContext = createContext<WarContextValue | undefined>(undefined);

export function WarProvider({ children }: { children: ReactNode }) {
  const engine = useWarEngine();
  const online = useOnlineRoom(engine.state, engine.actions.hydrate);
  return <WarContext.Provider value={{ ...engine, online }}>{children}</WarContext.Provider>;
}

export function useWar() {
  const context = useContext(WarContext);
  if (!context) {
    throw new Error("useWar must be used within WarProvider");
  }

  return context;
}
