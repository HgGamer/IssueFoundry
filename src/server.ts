import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import { boardsRouter } from "./routes/boards.js";
import { columnsRouter } from "./routes/columns.js";
import { cardsRouter } from "./routes/cards.js";
import { commentsRouter } from "./routes/comments.js";
import { documentsRouter } from "./routes/documents.js";
import { initWebSocket, broadcast } from "./events.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDir = path.join(__dirname, "..", "client");

const app = express();
app.use(express.json());

app.use("/api/boards", boardsRouter);
app.use("/api/columns", columnsRouter);
app.use("/api/cards", cardsRouter);
app.use("/api/comments", commentsRouter);
app.use("/api/documents", documentsRouter);

// Internal endpoint for MCP process to trigger WebSocket broadcasts
app.post("/api/_notify", (req, res) => {
  const { event } = req.body;
  console.log(`[_notify] received event=${event}`);
  if (event) broadcast(event);
  res.json({ ok: true });
});

// Serve built client files
app.use(express.static(clientDir));
app.get("/{*path}", (_req, res) => {
  res.sendFile(path.join(clientDir, "index.html"));
});

const PORT = parseInt(process.env.PORT || "37696");
const server = app.listen(PORT, () => {
  console.log(`IssueFoundry web UI running at http://localhost:${PORT}`);
});

initWebSocket(server);
