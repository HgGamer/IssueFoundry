import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import db from "./db.js";

function resolveColumn(opts: { column_id?: number; column_name?: string; board_id?: number }) {
  if (opts.column_id) {
    return db.prepare("SELECT * FROM columns WHERE id = ?").get(opts.column_id) as Record<string, unknown> | undefined;
  }
  if (opts.column_name && opts.board_id) {
    return db.prepare("SELECT * FROM columns WHERE board_id = ? AND name = ? COLLATE NOCASE").get(
      opts.board_id,
      opts.column_name
    ) as Record<string, unknown> | undefined;
  }
  return undefined;
}

export function registerTools(server: McpServer, projectBoardId?: number) {
  function getBoardId(explicit?: number): number | undefined {
    return explicit ?? projectBoardId;
  }

  // ── Board context ──

  server.tool(
    "get_board",
    "Get the current project board with all columns and cards",
    { board_id: z.number().optional().describe("Board ID (optional if project is bound)") },
    async ({ board_id }) => {
      const id = getBoardId(board_id);
      if (!id) return { isError: true, content: [{ type: "text" as const, text: "No project bound and no board_id provided" }] };

      const board = db.prepare("SELECT * FROM boards WHERE id = ?").get(id) as Record<string, unknown> | undefined;
      if (!board) return { isError: true, content: [{ type: "text" as const, text: "Board not found" }] };

      const columns = db
        .prepare("SELECT * FROM columns WHERE board_id = ? ORDER BY position")
        .all(id) as Array<Record<string, unknown>>;
      const cards = db
        .prepare(
          `SELECT c.* FROM cards c JOIN columns col ON c.column_id = col.id WHERE col.board_id = ? ORDER BY c.position`
        )
        .all(id) as Array<Record<string, unknown>>;

      const result = {
        ...board,
        columns: columns.map((col) => ({
          ...col,
          cards: cards.filter((c) => c.column_id === col.id),
        })),
      };
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool("list_boards", "List all kanban boards", {}, async () => {
    const boards = db.prepare("SELECT * FROM boards ORDER BY created_at DESC").all();
    return { content: [{ type: "text", text: JSON.stringify(boards, null, 2) }] };
  });

  // ── Cards (Issues) ──

  server.tool(
    "create_card",
    "Create a new card/issue. Use column_name (e.g. 'To Do', 'Backlog') or column_id.",
    {
      title: z.string().describe("Card title"),
      description: z.string().optional().describe("Card description (markdown)"),
      column_name: z.string().optional().describe("Column name (e.g. 'To Do', 'In Progress')"),
      column_id: z.number().optional().describe("Column ID (alternative to column_name)"),
      labels: z.array(z.string()).optional().describe("Labels for the card"),
    },
    async ({ title, description = "", column_name, column_id, labels = [] }) => {
      const boardId = getBoardId();
      const col = resolveColumn({ column_id, column_name, board_id: boardId });
      if (!col) {
        return { isError: true, content: [{ type: "text" as const, text: `Column not found. Provide a valid column_name or column_id.${boardId ? " Available columns: " + (db.prepare("SELECT name FROM columns WHERE board_id = ? ORDER BY position").all(boardId) as Array<{name: string}>).map(c => c.name).join(", ") : ""}` }] };
      }

      const maxPos = db
        .prepare("SELECT MAX(position) as max FROM cards WHERE column_id = ?")
        .get(col.id) as { max: number | null };
      const position = (maxPos.max ?? -1) + 1;
      const info = db
        .prepare("INSERT INTO cards (column_id, title, description, position, labels) VALUES (?, ?, ?, ?, ?)")
        .run(col.id, title, description, position, JSON.stringify(labels));
      const card = db.prepare("SELECT * FROM cards WHERE id = ?").get(info.lastInsertRowid);
      return { content: [{ type: "text", text: JSON.stringify(card, null, 2) }] };
    }
  );

  server.tool(
    "update_card",
    "Update a card's title, description, or labels",
    {
      card_id: z.number().describe("Card ID"),
      title: z.string().optional().describe("New title"),
      description: z.string().optional().describe("New description"),
      labels: z.array(z.string()).optional().describe("New labels"),
    },
    async ({ card_id, title, description, labels }) => {
      const card = db.prepare("SELECT * FROM cards WHERE id = ?").get(card_id);
      if (!card) return { isError: true, content: [{ type: "text" as const, text: "Card not found" }] };

      const updates: string[] = [];
      const values: unknown[] = [];
      if (title !== undefined) { updates.push("title = ?"); values.push(title); }
      if (description !== undefined) { updates.push("description = ?"); values.push(description); }
      if (labels !== undefined) { updates.push("labels = ?"); values.push(JSON.stringify(labels)); }

      if (updates.length > 0) {
        updates.push("updated_at = datetime('now')");
        values.push(card_id);
        db.prepare(`UPDATE cards SET ${updates.join(", ")} WHERE id = ?`).run(...values);
      }
      const updated = db.prepare("SELECT * FROM cards WHERE id = ?").get(card_id);
      return { content: [{ type: "text", text: JSON.stringify(updated, null, 2) }] };
    }
  );

  server.tool(
    "move_card",
    "Move a card to a different column. Use column_name (e.g. 'Done') or column_id.",
    {
      card_id: z.number().describe("Card ID"),
      column_name: z.string().optional().describe("Target column name (e.g. 'In Progress', 'Done')"),
      column_id: z.number().optional().describe("Target column ID (alternative to column_name)"),
      position: z.number().optional().describe("Position in target column (0-indexed, defaults to end)"),
    },
    async ({ card_id, column_name, column_id, position }) => {
      const card = db.prepare("SELECT * FROM cards WHERE id = ?").get(card_id) as Record<string, unknown> | undefined;
      if (!card) return { isError: true, content: [{ type: "text" as const, text: "Card not found" }] };

      const boardId = getBoardId();
      const col = resolveColumn({ column_id, column_name, board_id: boardId });
      if (!col) {
        return { isError: true, content: [{ type: "text" as const, text: `Target column not found. Provide column_name or column_id.${boardId ? " Available columns: " + (db.prepare("SELECT name FROM columns WHERE board_id = ? ORDER BY position").all(boardId) as Array<{name: string}>).map(c => c.name).join(", ") : ""}` }] };
      }

      const targetColId = col.id as number;
      let targetPos = position;
      if (targetPos === undefined) {
        const maxPos = db
          .prepare("SELECT MAX(position) as max FROM cards WHERE column_id = ?")
          .get(targetColId) as { max: number | null };
        targetPos = (maxPos.max ?? -1) + 1;
      }

      db.transaction(() => {
        const oldColumnId = card.column_id as number;
        const oldPosition = card.position as number;

        if (oldColumnId === targetColId) {
          if (targetPos! > oldPosition) {
            db.prepare("UPDATE cards SET position = position - 1 WHERE column_id = ? AND position > ? AND position <= ?")
              .run(targetColId, oldPosition, targetPos!);
          } else if (targetPos! < oldPosition) {
            db.prepare("UPDATE cards SET position = position + 1 WHERE column_id = ? AND position >= ? AND position < ?")
              .run(targetColId, targetPos!, oldPosition);
          }
        } else {
          db.prepare("UPDATE cards SET position = position - 1 WHERE column_id = ? AND position > ?")
            .run(oldColumnId, oldPosition);
          db.prepare("UPDATE cards SET position = position + 1 WHERE column_id = ? AND position >= ?")
            .run(targetColId, targetPos!);
        }
        db.prepare("UPDATE cards SET column_id = ?, position = ?, updated_at = datetime('now') WHERE id = ?")
          .run(targetColId, targetPos!, card_id);
      })();

      const updated = db.prepare("SELECT * FROM cards WHERE id = ?").get(card_id);
      return { content: [{ type: "text", text: JSON.stringify(updated, null, 2) }] };
    }
  );

  server.tool(
    "get_card",
    "Get a card with its comments",
    { card_id: z.number().describe("Card ID") },
    async ({ card_id }) => {
      const card = db.prepare("SELECT * FROM cards WHERE id = ?").get(card_id) as Record<string, unknown> | undefined;
      if (!card) return { isError: true, content: [{ type: "text" as const, text: "Card not found" }] };
      const comments = db.prepare("SELECT * FROM comments WHERE card_id = ? ORDER BY created_at ASC").all(card_id);
      const col = db.prepare("SELECT name FROM columns WHERE id = ?").get(card.column_id) as { name: string } | undefined;
      return { content: [{ type: "text", text: JSON.stringify({ ...card, column_name: col?.name, comments }, null, 2) }] };
    }
  );

  server.tool(
    "search_cards",
    "Search cards by title or description within the current project",
    {
      query: z.string().describe("Search query"),
      board_id: z.number().optional().describe("Board ID (optional if project is bound)"),
    },
    async ({ query, board_id }) => {
      const id = getBoardId(board_id);
      const pattern = `%${query}%`;
      let cards;
      if (id) {
        cards = db
          .prepare(
            `SELECT c.*, col.name as column_name FROM cards c
             JOIN columns col ON c.column_id = col.id
             WHERE col.board_id = ? AND (c.title LIKE ? OR c.description LIKE ?)
             ORDER BY c.updated_at DESC`
          )
          .all(id, pattern, pattern);
      } else {
        cards = db
          .prepare("SELECT * FROM cards WHERE title LIKE ? OR description LIKE ? ORDER BY updated_at DESC")
          .all(pattern, pattern);
      }
      return { content: [{ type: "text", text: JSON.stringify(cards, null, 2) }] };
    }
  );

  server.tool(
    "delete_card",
    "Delete a card/issue",
    { card_id: z.number().describe("Card ID") },
    async ({ card_id }) => {
      const card = db.prepare("SELECT * FROM cards WHERE id = ?").get(card_id) as Record<string, unknown> | undefined;
      if (!card) return { isError: true, content: [{ type: "text" as const, text: "Card not found" }] };
      db.transaction(() => {
        db.prepare("DELETE FROM cards WHERE id = ?").run(card_id);
        db.prepare("UPDATE cards SET position = position - 1 WHERE column_id = ? AND position > ?")
          .run(card.column_id, card.position);
      })();
      return { content: [{ type: "text", text: "Card deleted" }] };
    }
  );

  // ── Comments ──

  server.tool(
    "add_comment",
    "Add a comment to a card",
    {
      card_id: z.number().describe("Card ID"),
      body: z.string().describe("Comment text (markdown)"),
      author: z.string().optional().describe("Author name (defaults to 'agent')"),
    },
    async ({ card_id, body, author = "agent" }) => {
      const card = db.prepare("SELECT id FROM cards WHERE id = ?").get(card_id);
      if (!card) return { isError: true, content: [{ type: "text" as const, text: "Card not found" }] };
      const info = db
        .prepare("INSERT INTO comments (card_id, body, author) VALUES (?, ?, ?)")
        .run(card_id, body, author);
      const comment = db.prepare("SELECT * FROM comments WHERE id = ?").get(info.lastInsertRowid);
      return { content: [{ type: "text", text: JSON.stringify(comment, null, 2) }] };
    }
  );

  server.tool(
    "list_comments",
    "List all comments on a card",
    { card_id: z.number().describe("Card ID") },
    async ({ card_id }) => {
      const comments = db
        .prepare("SELECT * FROM comments WHERE card_id = ? ORDER BY created_at ASC")
        .all(card_id);
      return { content: [{ type: "text", text: JSON.stringify(comments, null, 2) }] };
    }
  );

  // ── Documents ──

  server.tool(
    "create_document",
    "Store a document (documentation, notes, specs) on the project board",
    {
      title: z.string().describe("Document title"),
      content: z.string().describe("Document content (markdown)"),
      author: z.string().optional().describe("Author name (defaults to 'agent')"),
      board_id: z.number().optional().describe("Board ID (optional if project is bound)"),
    },
    async ({ title, content, author = "agent", board_id }) => {
      const id = getBoardId(board_id);
      if (!id) return { isError: true, content: [{ type: "text" as const, text: "No project bound and no board_id provided" }] };
      const info = db
        .prepare("INSERT INTO documents (board_id, title, content, author) VALUES (?, ?, ?, ?)")
        .run(id, title, content, author);
      const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(info.lastInsertRowid);
      return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
    }
  );

  server.tool(
    "update_document",
    "Update a document's title or content",
    {
      document_id: z.number().describe("Document ID"),
      title: z.string().optional().describe("New title"),
      content: z.string().optional().describe("New content"),
    },
    async ({ document_id, title, content }) => {
      const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(document_id);
      if (!doc) return { isError: true, content: [{ type: "text" as const, text: "Document not found" }] };

      const updates: string[] = [];
      const values: unknown[] = [];
      if (title !== undefined) { updates.push("title = ?"); values.push(title); }
      if (content !== undefined) { updates.push("content = ?"); values.push(content); }

      if (updates.length > 0) {
        updates.push("updated_at = datetime('now')");
        values.push(document_id);
        db.prepare(`UPDATE documents SET ${updates.join(", ")} WHERE id = ?`).run(...values);
      }
      const updated = db.prepare("SELECT * FROM documents WHERE id = ?").get(document_id);
      return { content: [{ type: "text", text: JSON.stringify(updated, null, 2) }] };
    }
  );

  server.tool(
    "list_documents",
    "List all documents for the current project",
    { board_id: z.number().optional().describe("Board ID (optional if project is bound)") },
    async ({ board_id }) => {
      const id = getBoardId(board_id);
      if (!id) return { isError: true, content: [{ type: "text" as const, text: "No project bound and no board_id provided" }] };
      const docs = db
        .prepare("SELECT * FROM documents WHERE board_id = ? ORDER BY updated_at DESC")
        .all(id);
      return { content: [{ type: "text", text: JSON.stringify(docs, null, 2) }] };
    }
  );

  server.tool(
    "get_document",
    "Get a document by ID",
    { document_id: z.number().describe("Document ID") },
    async ({ document_id }) => {
      const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(document_id);
      if (!doc) return { isError: true, content: [{ type: "text" as const, text: "Document not found" }] };
      return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
    }
  );

  server.tool(
    "search_documents",
    "Search documents by title or content",
    {
      query: z.string().describe("Search query"),
      board_id: z.number().optional().describe("Board ID (optional if project is bound)"),
    },
    async ({ query, board_id }) => {
      const id = getBoardId(board_id);
      const pattern = `%${query}%`;
      let docs;
      if (id) {
        docs = db
          .prepare("SELECT * FROM documents WHERE board_id = ? AND (title LIKE ? OR content LIKE ?) ORDER BY updated_at DESC")
          .all(id, pattern, pattern);
      } else {
        docs = db.prepare("SELECT * FROM documents WHERE title LIKE ? OR content LIKE ? ORDER BY updated_at DESC")
          .all(pattern, pattern);
      }
      return { content: [{ type: "text", text: JSON.stringify(docs, null, 2) }] };
    }
  );

  // ── Columns ──

  server.tool(
    "create_column",
    "Add a new column to the project board",
    {
      name: z.string().describe("Column name"),
      board_id: z.number().optional().describe("Board ID (optional if project is bound)"),
    },
    async ({ name, board_id }) => {
      const id = getBoardId(board_id);
      if (!id) return { isError: true, content: [{ type: "text" as const, text: "No project bound and no board_id provided" }] };
      const maxPos = db
        .prepare("SELECT MAX(position) as max FROM columns WHERE board_id = ?")
        .get(id) as { max: number | null };
      const position = (maxPos.max ?? -1) + 1;
      const info = db
        .prepare("INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?)")
        .run(id, name, position);
      const col = db.prepare("SELECT * FROM columns WHERE id = ?").get(info.lastInsertRowid);
      return { content: [{ type: "text", text: JSON.stringify(col, null, 2) }] };
    }
  );
}
