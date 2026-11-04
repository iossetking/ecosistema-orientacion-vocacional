"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DIMENSIONS, STAGES, STATUSES } from "@/constants/matrix-config";
import type { MatrixSnapshot } from "@/types/matrix";
import {
  actionsByCatalog,
  countByDependency,
  countByStatus,
  heatCells,
  kpis,
  stageStatusSeries,
} from "@/lib/analysis/aggregate";

export default function ChartsDashboard({ snapshot }: { snapshot: MatrixSnapshot }) {
  const { records, dependencies, actionTypes, modalities } = snapshot;
  const statusData = countByStatus(records);
  const stageData = stageStatusSeries(records);
  const heat = heatCells(records);
  const depData = countByDependency(records, dependencies);
  const typeData = actionsByCatalog(records, "action_type_id", actionTypes);
  const modalityData = actionsByCatalog(records, "modality_id", modalities);
  const k = kpis(records);
  const maxHeat = Math.max(1, ...heat.map((c) => c.count));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-slate-500">Total de registros</p>
          <p className="text-2xl font-semibold">{k.total}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-slate-500">Existe y funciona</p>
          <p className="text-2xl font-semibold text-emerald-600">{k.workingPct}%</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-slate-500">Requiere fortalecimiento</p>
          <p className="text-2xl font-semibold text-blue-600">{k.strengtheningPct}%</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-slate-500">Vacíos o barreras</p>
          <p className="text-2xl font-semibold text-red-600">{k.gaps}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold">Distribución por estado</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={50}
                  outerRadius={80}
                >
                  {statusData.map((s) => (
                    <Cell key={s.key} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold">Registros por etapa y estado</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {STATUSES.map((s) => (
                  <Bar key={s.key} dataKey={s.label} stackId="a" fill={s.color} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 lg:col-span-2">
          <h3 className="mb-2 text-sm font-semibold">Mapa de calor Etapa × Dimensión</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-xs">
              <thead>
                <tr>
                  <th className="p-1 text-left text-slate-500">Dimensión</th>
                  {STAGES.map((s) => (
                    <th key={s.id} className="p-1 text-slate-600">
                      {s.id}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DIMENSIONS.map((d) => (
                  <tr key={d.id}>
                    <td className="p-1 pr-2 text-slate-600">{d.name}</td>
                    {STAGES.map((s) => {
                      const cell = heat.find(
                        (c) => c.stageId === s.id && c.dimensionId === d.id,
                      );
                      const intensity = (cell?.count ?? 0) / maxHeat;
                      return (
                        <td key={s.id} className="p-0.5">
                          <div
                            className="flex h-8 items-center justify-center rounded font-medium text-slate-800"
                            style={{ backgroundColor: `rgba(59, 130, 246, ${intensity * 0.7})` }}
                            title={`${d.name} × ${s.name}: ${cell?.count ?? 0}`}
                          >
                            {cell?.count ?? 0}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold">Participación por dependencia</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={depData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0f2547" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold">
            Acciones por tipo y modalidad (Dimensión 3)
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData}>
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modalityData}>
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
