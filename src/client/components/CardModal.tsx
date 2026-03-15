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
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-12 z-50" onClick={onClose}>
      <div
        className="bg-[#f4f5f7] rounded-xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-3 flex items-start gap-3">
          <svg className="w-5 h-5 text-[#42526e] mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M7 7h10M7 12h10M7 17h4" />
          </svg>
          <div className="flex-1">
            <input
              className="w-full bg-transparent text-xl font-semibold text-[#172b4d] focus:outline-none focus:bg-white focus:border focus:border-amber-500 rounded px-2 py-1 -ml-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
            />
            <p className="text-sm text-[#5e6c84] mt-0.5 ml-0.5">
              in list <span className="underline">{col?.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#42526e] hover:bg-[#dfe1e6] rounded-full w-8 h-8 flex items-center justify-center text-lg transition-colors"
          >
            &times;
          </button>
        </div>

        <div className="px-6 pb-6 space-y-6">
          {/* Description */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-[#42526e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              <h3 className="text-base font-semibold text-[#172b4d]">Description</h3>
            </div>
            <textarea
              className="w-full bg-white border border-[#dfe1e6] rounded-lg p-3 text-sm text-[#172b4d] resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-[#a5adba] min-h-[100px]"
              placeholder="Add a more detailed description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSave}
            />
          </div>

          {/* Activity / Comments */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-[#42526e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="text-base font-semibold text-[#172b4d]">Activity</h3>
            </div>

            {/* Add comment */}
            <div className="flex gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                U
              </div>
              <div className="flex-1">
                <input
                  className="w-full bg-white border border-[#dfe1e6] rounded-lg px-3 py-2 text-sm text-[#172b4d] placeholder-[#a5adba] focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                />
              </div>
            </div>

            {/* Comment list */}
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                    c.author === "agent" ? "bg-purple-600" : "bg-amber-600"
                  }`}>
                    {c.author === "agent" ? "A" : "U"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-[#172b4d]">{c.author}</span>
                      <span className="text-xs text-[#5e6c84]">{c.created_at}</span>
                    </div>
                    <div className="bg-white rounded-lg border border-[#dfe1e6] px-3 py-2">
                      <p className="text-sm text-[#172b4d] whitespace-pre-wrap">{c.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#dfe1e6]">
            <button
              onClick={handleDelete}
              className="text-sm text-[#5e6c84] hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded transition-colors"
            >
              Delete card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
