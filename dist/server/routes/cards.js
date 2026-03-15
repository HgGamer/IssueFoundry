import { Router } from "express";
import db from "../db.js";
import { broadcast } from "../events.js";
export const cardsRouter = Router();
cardsRouter.get("/", (req, res) => {
    const { column_id } = req.query;
    const cards = db.prepare("SELECT * FROM cards WHERE column_id = ? ORDER BY position").all(column_id);
    res.json(cards);
});
cardsRouter.post("/", (req, res) => {
    const { column_id, title, description = "", labels = [] } = req.body;
    const maxPos = db.prepare("SELECT MAX(position) as max FROM cards WHERE column_id = ?").get(column_id);
    const position = (maxPos.max ?? -1) + 1;
    const info = db.prepare("INSERT INTO cards (column_id, title, description, position, labels) VALUES (?, ?, ?, ?, ?)").run(column_id, title, description, position, JSON.stringify(labels));
    const card = db.prepare("SELECT * FROM cards WHERE id = ?").get(info.lastInsertRowid);
    broadcast("board-updated");
    res.status(201).json(card);
});
cardsRouter.get("/:id", (req, res) => {
    const card = db.prepare("SELECT * FROM cards WHERE id = ?").get(req.params.id);
    if (!card) {
        res.status(404).json({ error: "Not found" });
        return;
    }
    res.json(card);
});
cardsRouter.patch("/:id", (req, res) => {
    const { title, description, labels, due_date } = req.body;
    const updates = [];
    const values = [];
    if (title !== undefined) {
        updates.push("title = ?");
        values.push(title);
    }
    if (description !== undefined) {
        updates.push("description = ?");
        values.push(description);
    }
    if (labels !== undefined) {
        updates.push("labels = ?");
        values.push(JSON.stringify(labels));
    }
    if (due_date !== undefined) {
        updates.push("due_date = ?");
        values.push(due_date);
    }
    if (updates.length > 0) {
        updates.push("updated_at = datetime('now')");
        values.push(req.params.id);
        db.prepare(`UPDATE cards SET ${updates.join(", ")} WHERE id = ?`).run(...values);
    }
    const card = db.prepare("SELECT * FROM cards WHERE id = ?").get(req.params.id);
    broadcast("board-updated");
    res.json(card);
});
cardsRouter.post("/:id/move", (req, res) => {
    const { column_id, position } = req.body;
    const card = db.prepare("SELECT * FROM cards WHERE id = ?").get(req.params.id);
    if (!card) {
        res.status(404).json({ error: "Not found" });
        return;
    }
    const targetColId = column_id;
    let targetPos = position;
    if (targetPos === undefined) {
        const maxPos = db.prepare("SELECT MAX(position) as max FROM cards WHERE column_id = ?").get(targetColId);
        targetPos = (maxPos.max ?? -1) + 1;
    }
    db.transaction(() => {
        const oldColumnId = card.column_id;
        const oldPosition = card.position;
        if (oldColumnId === targetColId) {
            if (targetPos > oldPosition) {
                db.prepare("UPDATE cards SET position = position - 1 WHERE column_id = ? AND position > ? AND position <= ?")
                    .run(targetColId, oldPosition, targetPos);
            }
            else if (targetPos < oldPosition) {
                db.prepare("UPDATE cards SET position = position + 1 WHERE column_id = ? AND position >= ? AND position < ?")
                    .run(targetColId, targetPos, oldPosition);
            }
        }
        else {
            db.prepare("UPDATE cards SET position = position - 1 WHERE column_id = ? AND position > ?")
                .run(oldColumnId, oldPosition);
            db.prepare("UPDATE cards SET position = position + 1 WHERE column_id = ? AND position >= ?")
                .run(targetColId, targetPos);
        }
        db.prepare("UPDATE cards SET column_id = ?, position = ?, updated_at = datetime('now') WHERE id = ?")
            .run(targetColId, targetPos, req.params.id);
    })();
    const updated = db.prepare("SELECT * FROM cards WHERE id = ?").get(req.params.id);
    broadcast("board-updated");
    res.json(updated);
});
cardsRouter.delete("/:id", (req, res) => {
    const card = db.prepare("SELECT * FROM cards WHERE id = ?").get(req.params.id);
    if (!card) {
        res.status(404).json({ error: "Not found" });
        return;
    }
    db.transaction(() => {
        db.prepare("DELETE FROM cards WHERE id = ?").run(req.params.id);
        db.prepare("UPDATE cards SET position = position - 1 WHERE column_id = ? AND position > ?")
            .run(card.column_id, card.position);
    })();
    broadcast("board-updated");
    res.json({ ok: true });
});
