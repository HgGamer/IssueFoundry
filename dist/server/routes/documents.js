import { Router } from "express";
import db from "../db.js";
export const documentsRouter = Router();
documentsRouter.get("/", (req, res) => {
    const { board_id } = req.query;
    const docs = db.prepare("SELECT * FROM documents WHERE board_id = ? ORDER BY updated_at DESC").all(board_id);
    res.json(docs);
});
documentsRouter.post("/", (req, res) => {
    const { board_id, title, content = "", author = "user" } = req.body;
    const info = db.prepare("INSERT INTO documents (board_id, title, content, author) VALUES (?, ?, ?, ?)").run(board_id, title, content, author);
    const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(info.lastInsertRowid);
    res.status(201).json(doc);
});
documentsRouter.get("/:id", (req, res) => {
    const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(req.params.id);
    if (!doc) {
        res.status(404).json({ error: "Not found" });
        return;
    }
    res.json(doc);
});
documentsRouter.patch("/:id", (req, res) => {
    const { title, content } = req.body;
    const updates = [];
    const values = [];
    if (title !== undefined) {
        updates.push("title = ?");
        values.push(title);
    }
    if (content !== undefined) {
        updates.push("content = ?");
        values.push(content);
    }
    if (updates.length > 0) {
        updates.push("updated_at = datetime('now')");
        values.push(req.params.id);
        db.prepare(`UPDATE documents SET ${updates.join(", ")} WHERE id = ?`).run(...values);
    }
    const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(req.params.id);
    res.json(doc);
});
documentsRouter.delete("/:id", (req, res) => {
    db.prepare("DELETE FROM documents WHERE id = ?").run(req.params.id);
    res.json({ ok: true });
});
