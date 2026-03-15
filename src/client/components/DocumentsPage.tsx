import { useState, useEffect, useRef, useCallback } from "react";
import { api, type Document, type Board } from "../api/client";

interface Props {
  boardId: number;
  boards: Board[];
}

export function DocumentsPage({ boardId, boards }: Props) {
  const [docs, setDocs] = useState<Document[]>([]);
  const [selected, setSelected] = useState<Document | null>(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const boardName = boards.find((b) => b.id === boardId)?.name ?? "Board";

  const loadDocs = useCallback(async () => {
    const d = await api.listDocuments(boardId);
    setDocs(d);
  }, [boardId]);

  useEffect(() => {
    loadDocs();
    setSelected(null);
  }, [boardId]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const doc = await api.createDocument(boardId, newTitle.trim(), "");
    setNewTitle("");
    setCreating(false);
    await loadDocs();
    setSelected(doc);
    setEditing(true);
    setEditTitle(doc.title);
    setEditContent(doc.content);
  };

  const handleSelect = async (id: number) => {
    if (editing) await handleSave();
    const doc = await api.getDocument(id);
    setSelected(doc);
    setEditing(false);
  };

  const handleEdit = () => {
    if (!selected) return;
    setEditTitle(selected.title);
    setEditContent(selected.content);
    setEditing(true);
    setTimeout(() => contentRef.current?.focus(), 50);
  };

  const handleSave = async () => {
    if (!selected) return;
    const updated = await api.updateDocument(selected.id, {
      title: editTitle,
      content: editContent,
    });
    setSelected(updated);
    setEditing(false);
    await loadDocs();
  };

  const handleDelete = async () => {
    if (!selected) return;
    await api.deleteDocument(selected.id);
    setSelected(null);
    setEditing(false);
    await loadDocs();
  };

  const filteredDocs = searchQuery
    ? docs.filter(
        (d) =>
          d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : docs;

  return (
    <div className="flex h-full bg-white">
      {/* Sidebar - document list */}
      <div className="w-72 border-r border-[#dfe1e6] flex flex-col bg-[#f4f5f7]">
        <div className="p-4 border-b border-[#dfe1e6]">
          <h2 className="text-base font-semibold text-[#172b4d] mb-1">Documents</h2>
          <p className="text-xs text-[#5e6c84] mb-3">{boardName}</p>

          {/* Search */}
          <div className="relative mb-3">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a5adba]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="w-full bg-white border border-[#dfe1e6] rounded-lg pl-8 pr-3 py-1.5 text-sm text-[#172b4d] placeholder-[#a5adba] focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* New document */}
          {creating ? (
            <div>
              <input
                className="w-full bg-white border-2 border-amber-500 rounded-lg px-3 py-2 text-sm text-[#172b4d] placeholder-[#a5adba] outline-none"
                placeholder="Document title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") { setCreating(false); setNewTitle(""); }
                }}
                autoFocus
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handleCreate}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg px-3 py-1.5 transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => { setCreating(false); setNewTitle(""); }}
                  className="text-[#5e6c84] hover:text-[#172b4d] text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg px-3 py-2 transition-colors flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Document
            </button>
          )}
        </div>

        {/* Document list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filteredDocs.length === 0 && (
            <p className="text-sm text-[#a5adba] text-center py-8">
              {searchQuery ? "No documents match your search" : "No documents yet"}
            </p>
          )}
          {filteredDocs.map((doc) => (
            <button
              key={doc.id}
              onClick={() => handleSelect(doc.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors group ${
                selected?.id === doc.id
                  ? "bg-amber-50 border border-amber-200"
                  : "hover:bg-white border border-transparent"
              }`}
            >
              <div className="flex items-start gap-2">
                <svg
                  className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                    selected?.id === doc.id ? "text-amber-600" : "text-[#a5adba]"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    selected?.id === doc.id ? "text-amber-700" : "text-[#172b4d]"
                  }`}>
                    {doc.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                      doc.author === "agent" ? "bg-purple-500" : "bg-amber-500"
                    }`} />
                    <span className="text-[11px] text-[#5e6c84]">{doc.author}</span>
                    <span className="text-[11px] text-[#a5adba]">&middot;</span>
                    <span className="text-[11px] text-[#a5adba]">{doc.updated_at}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selected ? (
          <>
            {/* Document toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-[#dfe1e6] bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                  selected.author === "agent"
                    ? "bg-purple-50 text-purple-700"
                    : "bg-blue-50 text-amber-700"
                }`}>
                  {selected.author}
                </span>
                <span className="text-xs text-[#a5adba]">
                  Updated {selected.updated_at}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {editing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg px-4 py-1.5 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="text-sm text-[#5e6c84] hover:text-[#172b4d] px-3 py-1.5"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleEdit}
                      className="bg-[#ebecf0] hover:bg-[#dfe1e6] text-[#172b4d] text-sm font-medium rounded-lg px-4 py-1.5 transition-colors flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="text-sm text-[#a5adba] hover:text-red-600 hover:bg-red-50 rounded-lg px-3 py-1.5 transition-colors"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Document content */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-8 py-8">
                {editing ? (
                  <>
                    <input
                      className="w-full text-2xl font-bold text-[#172b4d] border-none outline-none bg-transparent placeholder-[#a5adba] mb-4"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Untitled document"
                    />
                    <textarea
                      ref={contentRef}
                      className="w-full text-[15px] leading-relaxed text-[#172b4d] border-none outline-none bg-transparent placeholder-[#a5adba] resize-none min-h-[60vh]"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="Start writing..."
                    />
                  </>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-[#172b4d] mb-6">{selected.title}</h1>
                    {selected.content ? (
                      <div className="text-[15px] leading-relaxed text-[#172b4d] whitespace-pre-wrap">
                        {selected.content}
                      </div>
                    ) : (
                      <p className="text-[#a5adba] italic">
                        No content yet. Click Edit to start writing.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <svg
                className="w-16 h-16 text-[#dfe1e6] mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-[#172b4d] mb-1">Select a document</h3>
              <p className="text-sm text-[#5e6c84]">
                Choose a document from the sidebar or create a new one
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
