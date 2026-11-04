import { getStage } from "@/constants/matrix-config";
import { getStageIcon } from "./icon-map";

export default function StageHeader({ stageId }: { stageId: number }) {
  const stage = getStage(stageId);
  if (!stage) return null;
  const Icon = getStageIcon(stage.iconName);
  return (
    <div
      className="flex min-h-24 flex-col justify-between gap-1 rounded-lg p-3 text-slate-900"
      style={{ backgroundColor: stage.color }}
      data-testid={`stage-header-${stage.id}`}
    >
      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-700">
        {stage.level}
      </span>
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
        <div>
          <p className="text-sm font-semibold leading-tight">{stage.name}</p>
          <p className="mt-0.5 text-xs leading-snug text-slate-700">{stage.subtitle}</p>
        </div>
      </div>
    </div>
  );
}
