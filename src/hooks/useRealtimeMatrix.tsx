"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { CatalogKind } from "@/types/matrix";
import {
  rowToRecord,
  type MatrixRecord,
  type MatrixSnapshot,
  type RecordRow,
} from "@/types/matrix";

export type ConnectionStatus = "connecting" | "live" | "offline";

export function applyRecordEvent(
  records: MatrixRecord[],
  event: "INSERT" | "UPDATE" | "DELETE",
  row: Partial<RecordRow> & { id: string },
): MatrixRecord[] {
  if (event === "DELETE") {
    return records.filter((r) => r.id !== row.id);
  }
  const existing = records.find((r) => r.id === row.id);
  const converted = rowToRecord(row as RecordRow, existing?.dependency_ids ?? []);
  if (!existing) return [...records, converted];
  return records.map((r) => (r.id === converted.id ? converted : r));
}

export function applyLinkEvent(
  records: MatrixRecord[],
  event: "INSERT" | "UPDATE" | "DELETE",
  recordId: string,
  dependencyId: string,
): MatrixRecord[] {
  return records.map((r) => {
    if (r.id !== recordId) return r;
    const set = new Set(r.dependency_ids);
    if (event === "DELETE") set.delete(dependencyId);
    else set.add(dependencyId);
    return { ...r, dependency_ids: [...set] };
  });
}

export function applyCatalogEvent<T extends { id: string }>(
  list: T[],
  event: "INSERT" | "UPDATE" | "DELETE",
  row: Partial<T> & { id: string },
): T[] {
  if (event === "DELETE") return list.filter((i) => i.id !== row.id);
  const existing = list.find((i) => i.id === row.id);
  if (!existing) return [...list, row as T];
  return list.map((i) => (i.id === row.id ? (row as T) : i));
}

interface MatrixContextValue {
  snapshot: MatrixSnapshot;
  connection: ConnectionStatus;
  removeRecord: (id: string) => void;
  removeCatalogItem: (kind: CatalogKind, id: string) => void;
}

const MatrixContext = createContext<MatrixContextValue | null>(null);

export function MatrixProvider({
  initial,
  children,
}: {
  initial: MatrixSnapshot;
  children: ReactNode;
}) {
  const [snapshot, setSnapshot] = useState<MatrixSnapshot>(initial);
  const [connection, setConnection] = useState<ConnectionStatus>("connecting");

  useEffect(() => {
    let cancelled = false;
    let channel: RealtimeChannel | null = null;

    (async () => {
      let client;
      try {
        client = getBrowserSupabase();
      } catch {
        setConnection("offline");
        return;
      }

      const res = await fetch("/api/auth/token").catch(() => null);
      if (!res || !res.ok) {
        setConnection("offline");
        return;
      }
      const { token } = (await res.json()) as { token: string };
      if (cancelled) return;
      client.realtime.setAuth(token);

      channel = client.channel("eov-matrix");

      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matrix_records" },
        (payload) => {
          const row = (payload.new ?? payload.old) as RecordRow & { id: string };
          setSnapshot((s) => ({
            ...s,
            records: applyRecordEvent(s.records, payload.eventType as "INSERT" | "UPDATE" | "DELETE", row),
          }));
        },
      );

      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "record_dependencies" },
        (payload) => {
          const row = (payload.new ?? payload.old) as {
            record_id: string;
            dependency_id: string;
          };
          setSnapshot((s) => ({
            ...s,
            records: applyLinkEvent(
              s.records,
              payload.eventType as "INSERT" | "UPDATE" | "DELETE",
              row.record_id,
              row.dependency_id,
            ),
          }));
        },
      );

      const bindCatalog = (table: string, key: keyof MatrixSnapshot) => {
        channel!.on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          (payload) => {
            const row = (payload.new ?? payload.old) as never;
            setSnapshot((s) => ({
              ...s,
              [key]: applyCatalogEvent(s[key] as { id: string }[], payload.eventType as "INSERT" | "UPDATE" | "DELETE", row),
            }));
          },
        );
      };

      bindCatalog("catalog_action_types", "actionTypes");
      bindCatalog("catalog_modalities", "modalities");
      bindCatalog("catalog_dependencies", "dependencies");

      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") setConnection("live");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setConnection("offline");
        else setConnection("connecting");
      });
    })();

    return () => {
      cancelled = true;
      channel?.unsubscribe();
    };
  }, []);

  const removeRecord = (id: string) => {
    setSnapshot((s) => ({ ...s, records: s.records.filter((r) => r.id !== id) }));
  };
  const removeCatalogItem = (kind: CatalogKind, id: string) => {
    const key =
      kind === "action_types" ? "actionTypes" : kind === "modalities" ? "modalities" : "dependencies";
    setSnapshot((s) => ({ ...s, [key]: (s[key] as { id: string }[]).filter((i) => i.id !== id) }));
  };

  const value = useMemo(
    () => ({ snapshot, connection, removeRecord, removeCatalogItem }),
    [snapshot, connection],
  );

  return <MatrixContext.Provider value={value}>{children}</MatrixContext.Provider>;
}

export function useMatrix(): MatrixContextValue {
  const ctx = useContext(MatrixContext);
  if (!ctx) throw new Error("useMatrix debe usarse dentro de MatrixProvider");
  return ctx;
}
