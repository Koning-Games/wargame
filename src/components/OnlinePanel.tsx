import { Cloud, Link2, LogOut, Users } from "lucide-react";
import { useState } from "react";
import { useWar } from "../context/WarContext";

const statusLabel = {
  offline: "Offline",
  "missing-config": "Configurar Supabase",
  connecting: "Conectando",
  connected: "Online",
  error: "Erro",
};

export function OnlinePanel() {
  const { online } = useWar();
  const [joinCode, setJoinCode] = useState("");

  return (
    <section className="panel rounded-lg p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Cloud size={20} />
          <h2 className="text-lg font-black">Multiplayer online</h2>
        </div>
        <span className="rounded-full border border-command-line/20 bg-white/70 px-2 py-1 text-xs font-black uppercase">
          {statusLabel[online.status]}
        </span>
      </div>

      {online.roomCode ? (
        <div className="grid gap-3">
          <div className="rounded-md border border-green-800/20 bg-green-50/80 p-3">
            <div className="text-xs font-black uppercase text-green-900">Codigo da sala</div>
            <div className="mt-1 text-3xl font-black tracking-widest text-green-950">{online.roomCode}</div>
          </div>
          <button className="control-button" onClick={online.leaveRoom}>
            <LogOut size={17} />
            Sair da sala
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          <button className="control-button" onClick={() => void online.createRoom()} disabled={!online.isConfigured || online.status === "connecting"}>
            <Users size={17} />
            Criar sala
          </button>
          <div className="flex gap-2">
            <input
              className="min-w-0 flex-1 rounded-md border border-command-line/25 bg-white/80 px-3 py-2 text-sm font-bold uppercase outline-none focus:border-command-brass"
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value)}
              placeholder="CODIGO"
              maxLength={6}
            />
            <button className="control-button" onClick={() => void online.joinRoom(joinCode)} disabled={!online.isConfigured || online.status === "connecting"}>
              <Link2 size={17} />
              Entrar
            </button>
          </div>
        </div>
      )}

      {online.error ? <p className="mt-3 rounded-md border border-red-800/20 bg-red-50 px-3 py-2 text-sm font-semibold text-red-950">{online.error}</p> : null}
      {!online.isConfigured ? (
        <p className="mt-3 rounded-md border border-command-line/20 bg-white/60 px-3 py-2 text-sm font-semibold text-command-line">
          Defina as variaveis da Vercel para ativar salas online.
        </p>
      ) : null}
    </section>
  );
}
