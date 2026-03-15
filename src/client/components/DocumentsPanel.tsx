import { useState, useEffect } from "react";
import { api, type Document } from "../api/client";

interface Props {
  boardId: number;
}

export function DocumentsPanel({ boardId }: Props) {
  const [docs, setDocs] = useState<Document[]>([]);
  const [selected, setSelected] = useState<Document | null>(null);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    api.listDocuments(boardId).then(setDocs);
  }, [boardId]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const doc = await api.createDocument(boardId, newTitle.trim(), "");
    setNewTitle("");
    setDocs(await api.listDocuments(boardId));
    setSelected(doc);
  };

  const handleSelect = async (id: number) => {
    const doc = await api.getDocument(id);
    setSelected(doc);
  };

  return (
    <div className="w-80 border-l border-gray-800 flex flex-col bg-gray-900/50">
      <div className="p-3 border-b border-gray-800">
        <h2 className="text-sm font-medium text-gray-300 mb-2">Documents</h2>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm placeholder-gray-600"
            placeholder="New document..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Doc list */}
        <div className="p-2 space-y-1">
          {docs.map((doc) => (
            <button
              key={doc.id}
              onClick={() => handleSelect(doc.id)}
              className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${
                selected?.id === doc.id ? "bg-gray-800 text-white" : "text-gray-400 hover:bg-gray-800/50"
              }`}
            >
              {doc.title}
              <span className="block text-[10px] text-gray-600">{doc.author} &middot; {doc.updated_at}</span>
            </button>
          ))}
        </div>

        {/* Doc content */}
        {selected && (
          <div className="p-3 border-t border-gray-800">
            <h3 className="text-sm font-medium mb-2">{selected.title}</h3>
            <pre className="text-xs text-gray-400 whitespace-pre-wrap">{selected.content || "(empty)"}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
