import express from "express";
import ViteExpress from "vite-express";
import { boardsRouter } from "./routes/boards.js";
import { columnsRouter } from "./routes/columns.js";
import { cardsRouter } from "./routes/cards.js";
import { commentsRouter } from "./routes/comments.js";
import { documentsRouter } from "./routes/documents.js";

const app = express();
app.use(express.json());

app.use("/api/boards", boardsRouter);
app.use("/api/columns", columnsRouter);
app.use("/api/cards", cardsRouter);
app.use("/api/comments", commentsRouter);
app.use("/api/documents", documentsRouter);

const PORT = parseInt(process.env.PORT || "3769");
ViteExpress.listen(app, PORT, () => {
  console.log(`IssueFoundry web UI running at http://localhost:${PORT}`);
});
