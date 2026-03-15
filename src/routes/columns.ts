import { Router } from "express";
import db from "../db.js";
import { broadcast } from "../events.js";

export const columnsRouter = Router();

columnsRouter.get("/", (req, res) => {
  const { board_id } = req.query;
  const columns = db.prepare("SELECT * FROM columns WHERE board_id = ? ORDER BY position").all(board_id);
  res.json(columns);
});

columnsRouter.post("/", (req, res) => {
  const { board_id, name } = req.body;
  const maxPos = db.prepare("SELECT MAX(position) as max FROM columns WHERE board_id = ?").get(board_id) as { max: number | null };
  const position = (maxPos.max ?? -1) + 1;
  const info = db.prepare("INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?)").run(board_id, name, position);
  const col = db.prepare("SELECT * FROM columns WHERE id = ?").get(info.lastInsertRowid);
  broadcast("board-updated");
  res.status(201).json(col);
});

columnsRouter.patch("/:id", (req, res) => {
  const { name, position } = req.body;
  const updates: string[] = [];
  const values: unknown[] = [];
  if (name !== undefined) { updates.push("name = ?"); values.push(name); }
  if (position !== undefined) { updates.push("position = ?"); values.push(position); }
  if (updates.length > 0) {
    values.push(req.params.id);
    db.prepare(`UPDATE columns SET ${updates.join(", ")} WHERE id = ?`).run(...values);
  }
  const col = db.prepare("SELECT * FROM columns WHERE id = ?").get(req.params.id);
  broadcast("board-updated");
  res.json(col);
});

columnsRouter.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM columns WHERE id = ?").run(req.params.id);
  broadcast("board-updated");
  res.json({ ok: true });
});
