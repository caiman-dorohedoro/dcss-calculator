import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

type EquipmentEditModalProps = {
  title: string;
  children: ReactNode;
  onCancel: () => void;
  onSave: () => void;
};

const overlayClassName =
  "fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-6";
const panelClassName =
  "w-full max-w-2xl border border-white bg-card p-6 text-card-foreground shadow-2xl";
const panelStyle = {
  outline: "1px solid white",
  outlineOffset: "-4px",
} as const;

const EquipmentEditModal = ({
  title,
  children,
  onCancel,
  onSave,
}: EquipmentEditModalProps) =>
  createPortal(
    <div
      data-testid="equipment-edit-modal"
      className={overlayClassName}
      role="dialog"
      aria-modal="true"
    >
      <div className={panelClassName} style={panelStyle}>
        <h2 className="text-lg font-semibold">Equipment Details</h2>
        <p className="mt-1 text-sm text-muted-foreground">{title}</p>
        <div className="mt-4 flex flex-col gap-4">{children}</div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button data-testid="save-equipment-edit" onClick={onSave}>
            Save
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );

export default EquipmentEditModal;
