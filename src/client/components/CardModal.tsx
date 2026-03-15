import { useState, useEffect } from "react";
import { api, type Card, type Column, type Comment } from "../api/client";

interface Props {
  card: Card;
  columns: Column[];
  onClose: () => void;
  onUpdate: () => void;
}

export function CardModal({ card, columns, onClose, onUpdate }: Props) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    api.getComments(card.id).then(setComments);
  }, [card.id]);

  useEffect(() => {
    setTitle(card.title);
    setDescription(card.description);
  }, [card]);

  const handleSave = async () => {
    await api.updateCard(card.id, { title, description });
    onUpdate();
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await api.addComment(card.id, newComment.trim());
    setNewComment("");
    const c = await api.getComments(card.id);
    setComments(c);
  };

  const handleDelete = async () => {
    await api.deleteCard(card.id);
    onClose();
    onUpdate();
  };

  const col = columns.find((c) => c.id === card.column_id);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center pt-20 z-50" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 space-y-4">
          {/* Column badge */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">{col?.name}</span>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-lg">&times;</button>
          </div>

          {/* Title */}
          <input
            className="w-full bg-transparent text-lg font-semibold focus:outline-none border-b border-transparent focus:border-gray-700 pb-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
          />

          {/* Description */}
          <textarea
            className="w-full bg-gray-800/50 rounded-lg p-3 text-sm resize-none focus:outline-none placeholder-gray-600 min-h-[80px]"
            placeholder="Add a description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleSave}
          />

          {/* Comments */}
          <div>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Comments</h3>
            <div className="space-y-2 mb-3">
              {comments.map((c) => (
                <div key={c.id} className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium ${c.author === "agent" ? "text-purple-400" : "text-blue-400"}`}>
                      {c.author}
                    </span>
                    <span className="text-[10px] text-gray-600">{c.created_at}</span>
                  </div>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{c.body}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm placeholder-gray-600 focus:outline-none focus:border-gray-600"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              />
              <button onClick={handleAddComment} className="text-sm text-blue-400 hover:text-blue-300 px-2">Send</button>
            </div>
          </div>

          {/* Delete */}
          <div className="pt-2 border-t border-gray-800">
            <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-300">Delete card</button>
          </div>
        </div>
      </div>
    </div>
  );
}
