import { useState, useEffect, useCallback } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { api, type Board, type BoardFull, type Column, type Card } from "./api/client";
import { KanbanColumn } from "./components/KanbanColumn";
import { CardModal } from "./components/CardModal";
import { DocumentsPanel } from "./components/DocumentsPanel";

export default function App() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [board, setBoard] = useState<BoardFull | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showDocs, setShowDocs] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [newColName, setNewColName] = useState("");

  const loadBoards = useCallback(async () => {
    const b = await api.listBoards();
    setBoards(b);
    if (b.length > 0 && !board) {
      const full = await api.getBoardFull(b[0].id);
      setBoard(full);
    }
  }, [board]);

  useEffect(() => { loadBoards(); }, []);

  const selectBoard = async (id: number) => {
    const full = await api.getBoardFull(id);
    setBoard(full);
  };

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return;
    const b = await api.createBoard(newBoardName.trim());
    setNewBoardName("");
    setShowNewBoard(false);
    await loadBoards();
    await selectBoard(b.id);
  };

  const handleAddCard = async (columnId: number, title: string) => {
    if (!board) return;
    await api.createCard(columnId, title);
    const full = await api.getBoardFull(board.id);
    setBoard(full);
  };

  const handleAddColumn = async () => {
    if (!board || !newColName.trim()) return;
    await api.createColumn(board.id, newColName.trim());
    setNewColName("");
    const full = await api.getBoardFull(board.id);
    setBoard(full);
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !board) return;

    const { source, destination, draggableId } = result;
    const cardId = parseInt(draggableId);
    const srcColId = parseInt(source.droppableId);
    const dstColId = parseInt(destination.droppableId);
    const dstIdx = destination.index;

    // Optimistic update
    const newColumns = board.columns.map((col) => ({ ...col, cards: [...col.cards] }));
    const srcCol = newColumns.find((c) => c.id === srcColId)!;
    const dstCol = newColumns.find((c) => c.id === dstColId)!;
    const [moved] = srcCol.cards.splice(source.index, 1);
    moved.column_id = dstColId;
    dstCol.cards.splice(dstIdx, 0, moved);
    dstCol.cards.forEach((c, i) => (c.position = i));
    setBoard({ ...board, columns: newColumns });

    await api.moveCard(cardId, dstColId, dstIdx);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-3 flex items-center gap-4">
        <h1 className="text-lg font-semibold tracking-tight">IssueFoundry</h1>

        <select
          className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm"
          value={board?.id ?? ""}
          onChange={(e) => selectBoard(Number(e.target.value))}
        >
          {boards.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}{b.project_path ? ` — ${b.project_path}` : ""}
            </option>
          ))}
        </select>

        {showNewBoard ? (
          <div className="flex gap-2">
            <input
              className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm"
              placeholder="Board name"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateBoard()}
              autoFocus
            />
            <button onClick={handleCreateBoard} className="text-sm text-blue-400 hover:text-blue-300">Create</button>
            <button onClick={() => setShowNewBoard(false)} className="text-sm text-gray-500">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setShowNewBoard(true)} className="text-sm text-gray-400 hover:text-gray-200">+ Board</button>
        )}

        <div className="ml-auto">
          <button
            onClick={() => setShowDocs(!showDocs)}
            className={`text-sm px-3 py-1 rounded ${showDocs ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
          >
            Docs
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 53px)" }}>
        {/* Board */}
        {board && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex-1 flex gap-4 p-4 overflow-x-auto">
              {board.columns.map((col) => (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  onAddCard={handleAddCard}
                  onCardClick={setSelectedCard}
                />
              ))}

              {/* Add column */}
              <div className="min-w-[272px] flex-shrink-0">
                <div className="flex gap-2">
                  <input
                    className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm flex-1"
                    placeholder="+ Column"
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddColumn()}
                  />
                  {newColName && (
                    <button onClick={handleAddColumn} className="text-sm text-blue-400">Add</button>
                  )}
                </div>
              </div>
            </div>
          </DragDropContext>
        )}

        {/* Documents panel */}
        {showDocs && board && (
          <DocumentsPanel boardId={board.id} />
        )}
      </div>

      {/* Card modal */}
      {selectedCard && board && (
        <CardModal
          card={selectedCard}
          columns={board.columns}
          onClose={() => setSelectedCard(null)}
          onUpdate={async () => {
            const full = await api.getBoardFull(board.id);
            setBoard(full);
            const updated = full.columns
              .flatMap((c) => c.cards)
              .find((c) => c.id === selectedCard.id);
            if (updated) setSelectedCard(updated);
          }}
        />
      )}
    </div>
  );
}
