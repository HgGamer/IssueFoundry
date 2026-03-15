import { Router } from "express";
import db, { getOrCreateProjectBoard } from "../db.js";
export const boardsRouter = Router();
boardsRouter.get("/", (_req, res) => {
    const boards = db.prepare("SELECT * FROM boards ORDER BY created_at DESC").all();
    res.json(boards);
});
boardsRouter.post("/", (req, res) => {
    const { name, project_path } = req.body;
    if (project_path) {
        const board = getOrCreateProjectBoard(project_path);
        res.status(201).json(board);
        return;
    }
    const info = db.prepare("INSERT INTO boards (name) VALUES (?)").run(name || "New Board");
    const DEFAULT_COLUMNS = ["Backlog", "To Do", "In Progress", "Review", "Done"];
    const insertCol = db.prepare("INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?)");
    DEFAULT_COLUMNS.forEach((col, i) => insertCol.run(info.lastInsertRowid, col, i));
    const board = db.prepare("SELECT * FROM boards WHERE id = ?").get(info.lastInsertRowid);
    res.status(201).json(board);
});
boardsRouter.get("/:id", (req, res) => {
    const board = db.prepare("SELECT * FROM boards WHERE id = ?").get(req.params.id);
    if (!board) {
        res.status(404).json({ error: "Not found" });
        return;
    }
    res.json(board);
});
boardsRouter.get("/:id/full", (req, res) => {
    const board = db.prepare("SELECT * FROM boards WHERE id = ?").get(req.params.id);
    if (!board) {
        res.status(404).json({ error: "Not found" });
        return;
    }
    const columns = db.prepare("SELECT * FROM columns WHERE board_id = ? ORDER BY position").all(req.params.id);
    const cards = db.prepare("SELECT c.* FROM cards c JOIN columns col ON c.column_id = col.id WHERE col.board_id = ? ORDER BY c.position").all(req.params.id);
    res.json({
        ...board,
        columns: columns.map((col) => ({
            ...col,
            cards: cards.filter((c) => c.column_id === col.id),
        })),
    });
});
boardsRouter.delete("/:id", (req, res) => {
    db.prepare("DELETE FROM boards WHERE id = ?").run(req.params.id);
    res.json({ ok: true });
});
