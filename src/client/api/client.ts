const API = "/api";

export interface Board {
  id: number;
  name: string;
  project_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface Column {
  id: number;
  board_id: number;
  name: string;
  position: number;
  created_at: string;
  cards: Card[];
}

export interface Card {
  id: number;
  column_id: number;
  title: string;
  description: string;
  position: number;
  labels: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  card_id: number;
  body: string;
  author: string;
  created_at: string;
}

export interface Document {
  id: number;
  board_id: number;
  title: string;
  content: string;
  author: string;
  created_at: string;
  updated_at: string;
}

export interface BoardFull extends Board {
  columns: Column[];
}

async function json<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...opts });
  return res.json() as T;
}

export const api = {
  listBoards: () => json<Board[]>(`${API}/boards`),
  createBoard: (name: string) => json<Board>(`${API}/boards`, { method: "POST", body: JSON.stringify({ name }) }),
  getBoardFull: (id: number) => json<BoardFull>(`${API}/boards/${id}/full`),
  deleteBoard: (id: number) => json<void>(`${API}/boards/${id}`, { method: "DELETE" }),

  createCard: (column_id: number, title: string) =>
    json<Card>(`${API}/cards`, { method: "POST", body: JSON.stringify({ column_id, title }) }),
  updateCard: (id: number, data: Partial<Card>) =>
    json<Card>(`${API}/cards/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  moveCard: (id: number, column_id: number, position: number) =>
    json<Card>(`${API}/cards/${id}/move`, { method: "POST", body: JSON.stringify({ column_id, position }) }),
  deleteCard: (id: number) => json<void>(`${API}/cards/${id}`, { method: "DELETE" }),

  getComments: (card_id: number) => json<Comment[]>(`${API}/comments?card_id=${card_id}`),
  addComment: (card_id: number, body: string, author = "user") =>
    json<Comment>(`${API}/comments`, { method: "POST", body: JSON.stringify({ card_id, body, author }) }),

  createColumn: (board_id: number, name: string) =>
    json<Column>(`${API}/columns`, { method: "POST", body: JSON.stringify({ board_id, name }) }),

  listDocuments: (board_id: number) => json<Document[]>(`${API}/documents?board_id=${board_id}`),
  createDocument: (board_id: number, title: string, content: string) =>
    json<Document>(`${API}/documents`, { method: "POST", body: JSON.stringify({ board_id, title, content }) }),
  getDocument: (id: number) => json<Document>(`${API}/documents/${id}`),
  updateDocument: (id: number, data: Partial<Pick<Document, "title" | "content">>) =>
    json<Document>(`${API}/documents/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteDocument: (id: number) => json<void>(`${API}/documents/${id}`, { method: "DELETE" }),
};
