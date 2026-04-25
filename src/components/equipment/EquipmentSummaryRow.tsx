import { cn } from "@/lib/utils";

type EquipmentSummaryRowProps = {
  label: string;
  summary: string;
  onOpen: () => void;
  testId: string;
  className?: string;
};

const EquipmentSummaryRow = ({
  label,
  summary,
  onOpen,
  testId,
  className,
}: EquipmentSummaryRowProps) => (
  <button
    type="button"
    data-testid={testId}
    className={cn(
      "flex w-full min-w-0 items-start gap-3 rounded-sm border border-transparent px-1.5 py-0.5 text-left text-sm hover:border-border hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white",
      className
    )}
    onClick={onOpen}
  >
    <span className="shrink-0 text-muted-foreground">{label}:</span>
    <span className="min-w-0 flex-1 break-words font-mono text-[#eaeaea]">
      {summary}
    </span>
  </button>
);

export default EquipmentSummaryRow;
