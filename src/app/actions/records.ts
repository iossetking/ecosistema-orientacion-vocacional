"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { getRecordFormSchema, type SessionUser } from "@/types/matrix";
import { buildCreateRow, buildUpdateRow, type AnyRecordFormValues } from "@/lib/records/build-row";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

async function parseInput(input: unknown): Promise<AnyRecordFormValues | null> {
  const dimensionId = z
    .number()
    .int()
    .min(1)
    .max(7)
    .safeParse((input as { dimensionId?: number })?.dimensionId);
  if (!dimensionId.success) return null;
  const parsed = getRecordFormSchema(dimensionId.data).safeParse(input);
  return parsed.success ? (parsed.data as AnyRecordFormValues) : null;
}

export async function createRecord(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "Tu sesión expiró. Vuelve a ingresar." };
  const values = await parseInput(input);
  if (!values) return { ok: false, error: "Datos del registro inválidos o incompletos." };

  const sb = getServerSupabase();
  const row = buildCreateRow(values, user);
  const { data, error } = await sb.from("matrix_records").insert(row).select("id").single();
  if (error || !data) return { ok: false, error: "No se pudo guardar el registro." };

  if (values.dependencyIds.length > 0) {
    const links = values.dependencyIds.map((dependency_id) => ({
      record_id: data.id,
      dependency_id,
    }));
    const { error: linkError } = await sb.from("record_dependencies").insert(links);
    if (linkError) return { ok: false, error: "No se pudo guardar las dependencias del registro." };
  }
  return { ok: true };
}

export async function updateRecord(id: string, input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "Tu sesión expiró. Vuelve a ingresar." };
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Registro inválido." };
  const values = await parseInput(input);
  if (!values) return { ok: false, error: "Datos del registro inválidos o incompletos." };

  const sb = getServerSupabase();
  const row = buildUpdateRow(values, user);
  const { error } = await sb.from("matrix_records").update(row).eq("id", id);
  if (error) return { ok: false, error: "No se pudo actualizar el registro." };

  await sb.from("record_dependencies").delete().eq("record_id", id);
  if (values.dependencyIds.length > 0) {
    const links = values.dependencyIds.map((dependency_id) => ({
      record_id: id,
      dependency_id,
    }));
    const { error: linkError } = await sb.from("record_dependencies").insert(links);
    if (linkError) return { ok: false, error: "No se pudo actualizar las dependencias del registro." };
  }
  return { ok: true };
}

export async function deleteRecord(id: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "Tu sesión expiró. Vuelve a ingresar." };
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Registro inválido." };
  const sb = getServerSupabase();
  const { error } = await sb.from("matrix_records").delete().eq("id", id);
  if (error) return { ok: false, error: "No se pudo eliminar el registro." };
  return { ok: true };
}
