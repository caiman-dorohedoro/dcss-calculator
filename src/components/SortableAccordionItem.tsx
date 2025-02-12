import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { GripVertical } from "lucide-react";

interface SortableAccordionItemProps {
  id: string;
  title: string;
  content: React.ReactNode;
}

export function SortableAccordionItem({
  id,
  title,
  content,
}: SortableAccordionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <AccordionItem
      ref={setNodeRef}
      value={id}
      style={style}
      className={`relative ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="flex items-center">
        <div
          {...attributes}
          className="cursor-grab active:cursor-grabbing p-2 hover:text-gray-700 touch-none"
          onPointerDown={(e) => {
            e.stopPropagation();
            listeners?.onPointerDown(e);
          }}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <AccordionTrigger headerClassName="grow">{title}</AccordionTrigger>
      </div>
      <AccordionContent>{content}</AccordionContent>
    </AccordionItem>
  );
}
