import { useState } from "react";
import { Droppable } from "@hello-pangea/dnd";
import type { Column, Card } from "../api/client";
import { KanbanCard } from "./KanbanCard";

interface Props {
  column: Column;
  onAddCard: (columnId: number, title: string) => void;
  onCardClick: (card: Card) => void;
}

export function KanbanColumn({ column, onAddCard, onCardClick }: Props) {
  const [newTitle, setNewTitle] = useState("");

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    onAddCard(column.id, newTitle.trim());
    setNewTitle("");
  };

  return (
    <div className="min-w-[272px] w-[272px] flex-shrink-0 flex flex-col max-h-full">
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="text-sm font-medium text-gray-300 uppercase tracking-wide">{column.name}</h2>
        <span className="text-xs text-gray-500 bg-gray-800 px-1.5 rounded">{column.cards.length}</span>
      </div>

      <Droppable droppableId={String(column.id)}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto rounded-lg p-1 space-y-1.5 transition-colors ${
              snapshot.isDraggingOver ? "bg-gray-800/50" : ""
            }`}
          >
            {column.cards.map((card, index) => (
              <KanbanCard key={card.id} card={card} index={index} onClick={() => onCardClick(card)} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <div className="mt-2">
        <textarea
          className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1.5 text-sm resize-none placeholder-gray-600 focus:border-gray-600 focus:outline-none"
          placeholder="+ Add card"
          rows={1}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAdd(); }
          }}
        />
      </div>
    </div>
  );
}
