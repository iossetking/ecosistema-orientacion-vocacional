"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { catalogCreateSchema, type CatalogKind, type SessionUser } from "@/types/matrix";
import { CATALOG_TABLES } from "@/lib/catalogs/tables";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

const kindSchema = z.enum(["action_types", "modalities", "dependencies"]);

export async function createCatalogItem(kind: CatalogKind, input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "Tu sesión expiró. Vuelve a ingresar." };
  if (!kindSchema.safeParse(kind).success) return { ok: false, error: "Catálogo inválido." };
  const parsed = catalogCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "El nombre es obligatorio." };

  const sb = getServerSupabase();
  const { data: maxRows } = await sb
    .from(CATALOG_TABLES[kind])
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextOrder = (maxRows?.[0]?.sort_order ?? 0) + 1;
  const { error } = await sb
    .from(CATALOG_TABLES[kind])
    .insert({ name: parsed.data.name, sort_order: nextOrder });
  if (error) return { ok: false, error: "No se pudo crear el elemento (¿ya existe?)." };
  return { ok: true };
}

export async function updateCatalogItem(kind: CatalogKind, input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "Tu sesión expiró. Vuelve a ingresar." };
  if (!kindSchema.safeParse(kind).success) return { ok: false, error: "Catálogo inválido." };
  const parsed = z
    .object({
      id: z.string().uuid(),
      name: z.string().trim().min(1).max(120).optional(),
      sort_order: z.number().int().optional(),
      is_active: z.boolean().optional(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  const sb = getServerSupabase();
  const { id, ...changes } = parsed.data;
  const cleanChanges = Object.fromEntries(
    Object.entries(changes).filter(([, v]) => v !== undefined),
  );
  const { error } = await sb.from(CATALOG_TABLES[kind]).update(cleanChanges).eq("id", id);
  if (error) return { ok: false, error: "No se pudo actualizar el elemento." };
  return { ok: true };
}

export async function swapCatalogItems(
  kind: CatalogKind,
  idA: string,
  idB: string,
): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "Tu sesión expiró. Vuelve a ingresar." };
  if (!kindSchema.safeParse(kind).success) return { ok: false, error: "Catálogo inválido." };
  const sb = getServerSupabase();
  const table = CATALOG_TABLES[kind];
  const { data } = await sb.from(table).select("id, sort_order").in("id", [idA, idB]);
  const rowA = data?.find((r) => r.id === idA);
  const rowB = data?.find((r) => r.id === idB);
  if (!rowA || !rowB) return { ok: false, error: "Elementos no encontrados." };
  await sb.from(table).update({ sort_order: rowB.sort_order }).eq("id", rowA.id);
  await sb.from(table).update({ sort_order: rowA.sort_order }).eq("id", rowB.id);
  return { ok: true };
}

export async function deleteCatalogItem(kind: CatalogKind, id: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "Tu sesión expiró. Vuelve a ingresar." };
  if (!kindSchema.safeParse(kind).success) return { ok: false, error: "Catálogo inválido." };
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Elemento inválido." };
  const sb = getServerSupabase();
  const { error } = await sb.from(CATALOG_TABLES[kind]).delete().eq("id", id);
  if (error) return { ok: false, error: "No se pudo eliminar el elemento." };
  return { ok: true };
}
