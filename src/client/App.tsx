import { useState, useEffect, useCallback } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { api, type Board, type BoardFull, type Card } from "./api/client";
import { KanbanColumn } from "./components/KanbanColumn";
import { CardModal } from "./components/CardModal";
import { DocumentsPage } from "./components/DocumentsPage";

type Page = "board" | "docs";

const BOARD_COLORS = [
  "from-[#2d1b4e] to-[#1a1145]",
  "from-[#1b3a2d] to-[#0f2920]",
  "from-[#3a1b2d] to-[#29101f]",
  "from-[#2d2a1b] to-[#1f1c10]",
  "from-[#1b2d3a] to-[#102029]",
  "from-[#3a2d1b] to-[#291f10]",
];

export default function App() {
  const [page, setPage] = useState<Page>("board");
  const [boards, setBoards] = useState<Board[]>([]);
  const [board, setBoard] = useState<BoardFull | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [newBoardName, setNewBoardName] = useState("");
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [addingColumn, setAddingColumn] = useState(false);

  const loadBoards = useCallback(async () => {
    const b = await api.listBoards();
    setBoards(b);
    if (b.length > 0 && !board) {
      const full = await api.getBoardFull(b[0].id);
      setBoard(full);
    }
  }, [board]);

  useEffect(() => { loadBoards(); }, []);

  // WebSocket live updates — coalescing fetch (immediate, no delay)
  useEffect(() => {
    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${proto}//${location.host}`);
    let fetching = false;
    let pendingRefetch = false;

    const doFetch = () => {
      fetching = true;
      setBoard((prev) => {
        if (prev) {
          api.getBoardFull(prev.id).then((full) => {
            setBoard(full);
            fetching = false;
            if (pendingRefetch) {
              pendingRefetch = false;
              doFetch();
            }
          });
        } else {
          fetching = false;
        }
        return prev;
      });
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.event === "board-updated") {
          if (fetching) {
            pendingRefetch = true;
          } else {
            doFetch();
          }
        }
      } catch {}
    };
    return () => ws.close();
  }, []);

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
    setAddingColumn(false);
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

  const boardColorClass = board ? BOARD_COLORS[(board.id - 1) % BOARD_COLORS.length] : BOARD_COLORS[0];

  return (
    <div className="h-screen flex flex-col">
      {/* Navbar — warm charcoal */}
      <header className="bg-[#1c1917] px-4 py-2 flex items-center gap-3 shadow-md flex-shrink-0">
        <div className="flex items-center gap-2">
          {/* Forge hammer + spark logo */}
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
            {/* Hammer head */}
            <rect x="9" y="3" width="10" height="5" rx="1" fill="#f59e0b" transform="rotate(15 14 5.5)" />
            {/* Handle */}
            <rect x="4" y="10" width="3" height="12" rx="1" fill="#d97706" transform="rotate(-30 5.5 16)" />
            {/* Sparks */}
            <circle cx="19" cy="4" r="1" fill="#fbbf24" />
            <circle cx="21" cy="7" r="0.7" fill="#fcd34d" />
            <circle cx="17" cy="2" r="0.7" fill="#fcd34d" />
          </svg>
          <h1 className="text-white font-bold text-lg tracking-tight">IssueFoundry</h1>
        </div>

        <div className="h-5 w-px bg-white/10 mx-1" />

        {/* Page tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage("board")}
            className={`text-sm font-medium rounded px-3 py-1.5 transition-colors ${
              page === "board"
                ? "bg-amber-500/20 text-amber-300"
                : "text-stone-400 hover:bg-white/10 hover:text-stone-200"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="5" height="18" rx="1" />
                <rect x="10" y="3" width="5" height="13" rx="1" />
                <rect x="17" y="3" width="5" height="9" rx="1" />
              </svg>
              Board
            </span>
          </button>
          <button
            onClick={() => setPage("docs")}
            className={`text-sm font-medium rounded px-3 py-1.5 transition-colors ${
              page === "docs"
                ? "bg-amber-500/20 text-amber-300"
                : "text-stone-400 hover:bg-white/10 hover:text-stone-200"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Docs
            </span>
          </button>
        </div>

        <div className="h-5 w-px bg-white/10 mx-1" />

        {/* Board selector */}
        <select
          className="bg-white/10 hover:bg-white/15 text-stone-200 text-sm font-medium rounded px-3 py-1.5 cursor-pointer border-none outline-none appearance-none"
          value={board?.id ?? ""}
          onChange={(e) => selectBoard(Number(e.target.value))}
        >
          {boards.map((b) => (
            <option key={b.id} value={b.id} className="text-gray-900">
              {b.name}{b.project_path ? ` — ${b.project_path}` : ""}
            </option>
          ))}
        </select>

        {showNewBoard ? (
          <div className="flex gap-2 items-center">
            <input
              className="bg-white rounded px-2 py-1 text-sm text-gray-900 placeholder-gray-400 outline-none"
              placeholder="Board name"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateBoard()}
              autoFocus
            />
            <button onClick={handleCreateBoard} className="text-sm text-amber-300 hover:text-amber-200 font-medium">Create</button>
            <button onClick={() => setShowNewBoard(false)} className="text-sm text-stone-500 hover:text-stone-300">Cancel</button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewBoard(true)}
            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-sm rounded px-3 py-1.5 font-medium transition-colors"
          >
            + Board
          </button>
        )}
      </header>

      {/* Content area — fills remaining space */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {page === "board" && board && (
          <div className={`h-full w-full bg-gradient-to-br ${boardColorClass}`}>
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="h-full flex gap-3 p-3 overflow-x-auto items-start">
                {board.columns.map((col) => (
                  <KanbanColumn
                    key={col.id}
                    column={col}
                    onAddCard={handleAddCard}
                    onCardClick={setSelectedCard}
                  />
                ))}

                {/* Add column */}
                <div className="min-w-[272px] w-[272px] flex-shrink-0">
                  {addingColumn ? (
                    <div className="bg-[#ebecf0] rounded-xl p-2">
                      <input
                        className="w-full bg-white border-2 border-amber-500 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none shadow-sm"
                        placeholder="Enter list title..."
                        value={newColName}
                        onChange={(e) => setNewColName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddColumn();
                          if (e.key === "Escape") { setAddingColumn(false); setNewColName(""); }
                        }}
                        autoFocus
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={handleAddColumn}
                          className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg px-4 py-1.5 transition-colors"
                        >
                          Add list
                        </button>
                        <button
                          onClick={() => { setAddingColumn(false); setNewColName(""); }}
                          className="text-gray-500 hover:text-gray-700 text-lg leading-none px-1"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingColumn(true)}
                      className="w-full bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white/80 font-medium text-sm rounded-xl px-4 py-3 text-left transition-colors"
                    >
                      + Add another list
                    </button>
                  )}
                </div>
              </div>
            </DragDropContext>
          </div>
        )}

        {page === "docs" && board && (
          <DocumentsPage boardId={board.id} boards={boards} />
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
