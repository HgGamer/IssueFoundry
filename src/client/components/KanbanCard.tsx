import { Draggable } from "@hello-pangea/dnd";
import type { Card } from "../api/client";

const LABEL_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-amber-400",
  "bg-red-500",
  "bg-cyan-500",
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
          className={`bg-white rounded-lg px-3 py-2 cursor-pointer hover:ring-2 hover:ring-amber-400 transition-shadow ${
            snapshot.isDragging ? "shadow-lg rotate-2" : "shadow-sm"
          }`}
        >
          {/* Colored label bars - Trello style */}
          {labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {labels.map((label, i) => (
                <span
                  key={i}
                  className={`h-2 min-w-[40px] rounded-full ${LABEL_COLORS[i % LABEL_COLORS.length]}`}
                  title={label}
                />
              ))}
            </div>
          )}

          <p className="text-sm text-[#172b4d]">{card.title}</p>

          {/* Card badges */}
          <div className="flex items-center gap-2 mt-1.5 empty:mt-0">
            {card.description && (
              <svg className="w-3.5 h-3.5 text-[#5e6c84]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            )}
            {card.due_date && (
              <span className="text-[11px] text-[#5e6c84] bg-[#ebecf0] rounded px-1.5 py-0.5 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {card.due_date}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
