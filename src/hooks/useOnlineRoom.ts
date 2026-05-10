import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GameState } from "../types/game";

type OnlineStatus = "offline" | "missing-config" | "connecting" | "connected" | "error";

interface WarRoomRow {
  room_code: string;
  state: GameState;
  updated_by: string;
  updated_at?: string;
}

export interface OnlineRoomController {
  status: OnlineStatus;
  roomCode?: string;
  error?: string;
  isConfigured: boolean;
  createRoom: () => Promise<void>;
  joinRoom: (roomCode: string) => Promise<void>;
  leaveRoom: () => void;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export function useOnlineRoom(state: GameState, hydrate: (state: GameState) => void): OnlineRoomController {
  const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);
  const supabase = useMemo(() => {
    if (!isConfigured) {
      return undefined;
    }

    return createClient(supabaseUrl!, supabaseAnonKey!, {
      realtime: { params: { eventsPerSecond: 8 } },
    });
  }, [isConfigured]);
  const clientId = useMemo(getClientId, []);
  const [roomCode, setRoomCode] = useState<string>();
  const [status, setStatus] = useState<OnlineStatus>(isConfigured ? "offline" : "missing-config");
  const [error, setError] = useState<string>();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastRemoteStateRef = useRef<string | undefined>(undefined);

  const leaveRoom = useCallback(() => {
    if (channelRef.current && supabase) {
      void supabase.removeChannel(channelRef.current);
    }

    channelRef.current = null;
    setRoomCode(undefined);
    setStatus(isConfigured ? "offline" : "missing-config");
  }, [isConfigured, supabase]);

  const subscribeToRoom = useCallback(
    (client: SupabaseClient, code: string) => {
      if (channelRef.current) {
        void client.removeChannel(channelRef.current);
      }

      const channel = client
        .channel(`war-room-${code}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "war_rooms",
            filter: `room_code=eq.${code}`,
          },
          (payload) => {
            const row = payload.new as WarRoomRow;
            if (!row.state || row.updated_by === clientId) {
              return;
            }

            lastRemoteStateRef.current = JSON.stringify(row.state);
            hydrate(row.state);
          },
        )
        .subscribe((nextStatus) => {
          if (nextStatus === "SUBSCRIBED") {
            setStatus("connected");
          }
        });

      channelRef.current = channel;
    },
    [clientId, hydrate],
  );

  const joinRoom = useCallback(
    async (rawCode: string) => {
      if (!supabase) {
        setStatus("missing-config");
        setError("Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
        return;
      }

      const code = normalizeRoomCode(rawCode);
      if (!code) {
        setError("Informe um codigo de sala valido.");
        return;
      }

      setStatus("connecting");
      setError(undefined);
      const { data, error: selectError } = await supabase.from("war_rooms").select("room_code,state,updated_by").eq("room_code", code).maybeSingle<WarRoomRow>();
      if (selectError || !data) {
        setStatus("error");
        setError(selectError?.message ?? "Sala nao encontrada.");
        return;
      }

      lastRemoteStateRef.current = JSON.stringify(data.state);
      hydrate(data.state);
      setRoomCode(code);
      subscribeToRoom(supabase, code);
    },
    [hydrate, subscribeToRoom, supabase],
  );

  const createRoom = useCallback(async () => {
    if (!supabase) {
      setStatus("missing-config");
      setError("Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
      return;
    }

    const code = createRoomCode();
    setStatus("connecting");
    setError(undefined);
    const { error: insertError } = await supabase.from("war_rooms").insert({
      room_code: code,
      state,
      updated_by: clientId,
    });

    if (insertError) {
      setStatus("error");
      setError(insertError.message);
      return;
    }

    lastRemoteStateRef.current = JSON.stringify(state);
    setRoomCode(code);
    subscribeToRoom(supabase, code);
  }, [clientId, state, subscribeToRoom, supabase]);

  useEffect(() => {
    if (!supabase || !roomCode || status !== "connected") {
      return;
    }

    const serialized = JSON.stringify(state);
    if (serialized === lastRemoteStateRef.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      lastRemoteStateRef.current = serialized;
      void supabase
        .from("war_rooms")
        .update({
          state,
          updated_by: clientId,
          updated_at: new Date().toISOString(),
        })
        .eq("room_code", roomCode)
        .then(({ error: updateError }) => {
          if (updateError) {
            setStatus("error");
            setError(updateError.message);
          }
        });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [clientId, roomCode, state, status, supabase]);

  useEffect(() => leaveRoom, [leaveRoom]);

  return {
    status,
    roomCode,
    error,
    isConfigured,
    createRoom,
    joinRoom,
    leaveRoom,
  };
}

function normalizeRoomCode(code: string): string {
  return code.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 6);
}

function createRoomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

function getClientId(): string {
  const storageKey = "war-command-client-id";
  const existing = window.localStorage.getItem(storageKey);
  if (existing) {
    return existing;
  }

  const created = crypto.randomUUID();
  window.localStorage.setItem(storageKey, created);
  return created;
}
