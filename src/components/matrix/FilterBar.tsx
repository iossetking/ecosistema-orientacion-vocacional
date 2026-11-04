import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DIMENSIONS, STAGES, STATUSES } from "@/constants/matrix-config";
import type { MatrixRecord, RecordStatus } from "@/types/matrix";

export interface MatrixFilters {
  search: string;
  status: string;
  stage: string;
  dimension: string;
}

export const emptyFilters: MatrixFilters = {
  search: "",
  status: "all",
  stage: "all",
  dimension: "all",
};

export function filterMatrixRecords(records: MatrixRecord[], filters: MatrixFilters): MatrixRecord[] {
  return records.filter((r) => {
    if (filters.status !== "all" && r.status !== (filters.status as RecordStatus)) return false;
    if (filters.stage !== "all") {
      const stage = Number(filters.stage);
      const inStage = r.primary_stage_id === stage || r.related_stage_ids.includes(stage);
      if (!inStage) return false;
    }
    if (filters.dimension !== "all" && r.dimension_id !== Number(filters.dimension)) return false;
    if (filters.search.trim()) {
      const needle = filters.search.trim().toLowerCase();
      const haystack = `${r.description} ${r.action_name ?? ""} ${r.organizer ?? ""} ${r.executor ?? ""}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

export default function FilterBar({
  filters,
  onChange,
}: {
  filters: MatrixFilters;
  onChange: (filters: MatrixFilters) => void;
}) {
  return (
    <div className="flex flex-1 flex-wrap items-center gap-1.5">
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <Input
          className="pl-8"
          placeholder="Buscar registro…"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>
      <Select value={filters.status} onValueChange={(v) => onChange({ ...filters, status: v })}>
        <SelectTrigger className="w-[170px]" aria-label="Estado">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s.key} value={s.key}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filters.stage} onValueChange={(v) => onChange({ ...filters, stage: v })}>
        <SelectTrigger className="w-[190px]" aria-label="Etapa">
          <SelectValue placeholder="Etapa" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las etapas</SelectItem>
          {STAGES.map((s) => (
            <SelectItem key={s.id} value={String(s.id)}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.dimension}
        onValueChange={(v) => onChange({ ...filters, dimension: v })}
      >
        <SelectTrigger className="w-[210px]" aria-label="Dimensión">
          <SelectValue placeholder="Dimensión" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las dimensiones</SelectItem>
          {DIMENSIONS.map((d) => (
            <SelectItem key={d.id} value={String(d.id)}>
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
