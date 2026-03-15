import { useState } from "react";
import { Droppable } from "@hello-pangea/dnd";
import type { Column, Card } from "../api/client";
import { KanbanCard } from "./KanbanCard";

interface Props {
  column: Column;
  onAddCard: (columnId: number, title: string) => void;
  onCardClick: (card: Card) => void;
  onClearColumn: (columnId: number) => void;
}

export function KanbanColumn({ column, onAddCard, onCardClick, onClearColumn }: Props) {
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    onAddCard(column.id, newTitle.trim());
    setNewTitle("");
    setAdding(false);
  };

  return (
    <div className="min-w-[272px] w-[272px] flex-shrink-0 flex flex-col max-h-full bg-[#ebecf0] rounded-xl shadow-sm">
      {/* Column header */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
        <h2 className="text-sm font-semibold text-[#172b4d]">{column.name}</h2>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#5e6c84] font-medium">{column.cards.length}</span>
          {column.cards.length > 0 && (
            <button
              onClick={() => setConfirmClear(true)}
              className="text-[#5e6c84] hover:text-red-600 text-xs p-0.5 rounded transition-colors"
              title="Clear all cards"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* Clear confirmation dialog */}
      {confirmClear && (
        <div className="mx-2 mb-2 p-3 bg-white rounded-lg border border-red-200 shadow-sm">
          <p className="text-sm text-[#172b4d] mb-2">
            Delete all <strong>{column.cards.length}</strong> card{column.cards.length !== 1 ? "s" : ""} in <strong>{column.name}</strong>?
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { onClearColumn(column.id); setConfirmClear(false); }}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded px-3 py-1.5 transition-colors"
            >
              Yes, delete all
            </button>
            <button
              onClick={() => setConfirmClear(false)}
              className="text-gray-500 hover:text-gray-700 text-xs font-medium rounded px-3 py-1.5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Cards area */}
      <Droppable droppableId={String(column.id)}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`column-cards flex-1 overflow-y-auto px-2 pb-1 space-y-2 min-h-[120px] transition-colors ${
              snapshot.isDraggingOver ? "bg-[#e2e4e9]" : ""
            }`}
          >
            {column.cards.map((card, index) => (
              <KanbanCard key={card.id} card={card} index={index} onClick={() => onCardClick(card)} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add card */}
      <div className="px-2 pb-2 pt-1">
        {adding ? (
          <div>
            <textarea
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-[#172b4d] resize-none placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
              placeholder="Enter a title for this card..."
              rows={3}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAdd(); }
                if (e.key === "Escape") { setAdding(false); setNewTitle(""); }
              }}
              autoFocus
            />
            <div className="flex items-center gap-2 mt-1.5">
              <button
                onClick={handleAdd}
                className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg px-4 py-1.5 transition-colors"
              >
                Add card
              </button>
              <button
                onClick={() => { setAdding(false); setNewTitle(""); }}
                className="text-gray-500 hover:text-gray-700 text-lg leading-none px-1"
              >
                &times;
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full text-left text-sm text-[#5e6c84] hover:bg-[#dfe1e6] hover:text-[#172b4d] rounded-lg px-2 py-1.5 transition-colors"
          >
            + Add a card
          </button>
        )}
      </div>
    </div>
  );
}
