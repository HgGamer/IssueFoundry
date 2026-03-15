import { Draggable } from "@hello-pangea/dnd";
import type { Card } from "../api/client";

const LABEL_COLORS = [
  "bg-blue-500/20 text-blue-300",
  "bg-green-500/20 text-green-300",
  "bg-purple-500/20 text-purple-300",
  "bg-amber-500/20 text-amber-300",
  "bg-red-500/20 text-red-300",
  "bg-cyan-500/20 text-cyan-300",
];

interface Props {
  card: Card;
  index: number;
  onClick: () => void;
}

export function KanbanCard({ card, index, onClick }: Props) {
  const labels: string[] = (() => {
    try { return JSON.parse(card.labels); } catch { return []; }
  })();

  return (
    <Draggable draggableId={String(card.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 cursor-pointer hover:border-gray-600 transition-colors ${
            snapshot.isDragging ? "shadow-lg shadow-black/40 border-gray-600" : ""
          }`}
        >
          {labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {labels.map((label, i) => (
                <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded ${LABEL_COLORS[i % LABEL_COLORS.length]}`}>
                  {label}
                </span>
              ))}
            </div>
          )}
          <p className="text-sm font-medium">{card.title}</p>
          {card.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{card.description}</p>
          )}
          {card.due_date && (
            <p className="text-[10px] text-gray-500 mt-1.5">{card.due_date}</p>
          )}
        </div>
      )}
    </Draggable>
  );
}
