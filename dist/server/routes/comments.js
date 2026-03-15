import { Router } from "express";
import db from "../db.js";
import { broadcast } from "../events.js";
export const commentsRouter = Router();
commentsRouter.get("/", (req, res) => {
    const { card_id } = req.query;
    const comments = db.prepare("SELECT * FROM comments WHERE card_id = ? ORDER BY created_at ASC").all(card_id);
    res.json(comments);
});
commentsRouter.post("/", (req, res) => {
    const { card_id, body, author = "user" } = req.body;
    const info = db.prepare("INSERT INTO comments (card_id, body, author) VALUES (?, ?, ?)").run(card_id, body, author);
    const comment = db.prepare("SELECT * FROM comments WHERE id = ?").get(info.lastInsertRowid);
    broadcast("board-updated");
    res.status(201).json(comment);
});
commentsRouter.delete("/:id", (req, res) => {
    db.prepare("DELETE FROM comments WHERE id = ?").run(req.params.id);
    broadcast("board-updated");
    res.json({ ok: true });
});
