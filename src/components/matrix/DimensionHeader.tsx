import { getDimension } from "@/constants/matrix-config";
import { getDimensionIcon } from "./icon-map";

export default function DimensionHeader({ dimensionId }: { dimensionId: number }) {
  const dimension = getDimension(dimensionId);
  if (!dimension) return null;
  const Icon = getDimensionIcon(dimension.iconName);
  return (
    <div
      className="flex min-h-24 flex-col justify-center gap-1 rounded-lg bg-[#0f2547] p-3 text-white"
      data-testid={`dimension-header-${dimension.id}`}
    >
      <div className="flex items-center gap-2">
        <Icon className="size-4 shrink-0" aria-hidden />
        <p className="text-sm font-semibold leading-tight">{dimension.name}</p>
      </div>
      <p className="text-xs italic leading-snug text-slate-300">{dimension.question}</p>
    </div>
  );
}
