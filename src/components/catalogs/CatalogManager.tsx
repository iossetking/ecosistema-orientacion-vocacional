"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useMatrix } from "@/hooks/useRealtimeMatrix";
import {
  createCatalogItem,
  deleteCatalogItem,
  swapCatalogItems,
  updateCatalogItem,
} from "@/app/actions/catalogs";
import type { CatalogKind } from "@/types/matrix";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PanelConfig {
  kind: CatalogKind;
  title: string;
  items: { id: string; name: string; is_active: boolean; sort_order: number }[];
}

export default function CatalogManager() {
  const { snapshot, removeCatalogItem } = useMatrix();
  const [newNames, setNewNames] = useState<Record<string, string>>({});
  const [pendingDelete, setPendingDelete] = useState<{ kind: CatalogKind; id: string; name: string } | null>(null);

  const panels: PanelConfig[] = [
    { kind: "action_types", title: "Tipos de acción o recurso", items: snapshot.actionTypes },
    { kind: "modalities", title: "Modalidades", items: snapshot.modalities },
    { kind: "dependencies", title: "Dependencias participantes", items: snapshot.dependencies },
  ];

  async function handleAdd(kind: CatalogKind) {
    const name = newNames[kind]?.trim();
    if (!name) return;
    await createCatalogItem(kind, { name });
    setNewNames((s) => ({ ...s, [kind]: "" }));
  }

  return (
    <main className="grid gap-4 p-4 lg:grid-cols-3">
      {panels.map((panel) => (
        <section key={panel.kind} className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-slate-900">{panel.title}</h2>

          <ul className="mb-3 space-y-1.5">
            {panel.items.map((item, index) => (
              <li
                key={item.id}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm transition hover:bg-white"
              >
                <span className={`flex-1 ${item.is_active ? "" : "text-slate-400 line-through"}`}>
                  {item.name}
                </span>
                <button
                  type="button"
                  aria-label={`Subir ${item.name}`}
                  disabled={index === 0}
                  className="text-slate-400 transition hover:text-slate-700 disabled:opacity-30"
                  onClick={() =>
                    void swapCatalogItems(panel.kind, item.id, panel.items[index - 1].id)
                  }
                >
                  <ArrowUp className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`Bajar ${item.name}`}
                  disabled={index === panel.items.length - 1}
                  className="text-slate-400 transition hover:text-slate-700 disabled:opacity-30"
                  onClick={() =>
                    void swapCatalogItems(panel.kind, item.id, panel.items[index + 1].id)
                  }
                >
                  <ArrowDown className="size-3.5" />
                </button>
                <Switch
                  checked={item.is_active}
                  onCheckedChange={(checked) =>
                    void updateCatalogItem(panel.kind, {
                      id: item.id,
                      is_active: checked,
                    })
                  }
                  aria-label={`Activar ${item.name}`}
                />
                <button
                  type="button"
                  aria-label={`Eliminar ${item.name}`}
                  className="text-slate-400 transition hover:text-red-600"
                  onClick={() => setPendingDelete({ kind: panel.kind, id: item.id, name: item.name })}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>

          <div className="flex gap-2">
            <Input
              placeholder="Nuevo elemento…"
              value={newNames[panel.kind] ?? ""}
              onChange={(e) =>
                setNewNames((s) => ({ ...s, [panel.kind]: e.target.value }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleAdd(panel.kind);
              }}
            />
            <Button type="button" size="sm" onClick={() => void handleAdd(panel.kind)}>
              <Plus className="size-4" aria-hidden />
              Agregar
            </Button>
          </div>
        </section>
      ))}

      <Dialog open={!!pendingDelete} onOpenChange={(o) => (!o ? setPendingDelete(null) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar este elemento?</DialogTitle>
            <DialogDescription>
              {pendingDelete
                ? `Se eliminará "${pendingDelete.name}" del catálogo. Esta acción no se puede deshacer.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingDelete) {
                  void deleteCatalogItem(pendingDelete.kind, pendingDelete.id);
                  removeCatalogItem?.(pendingDelete.kind, pendingDelete.id);
                }
                setPendingDelete(null);
              }}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
