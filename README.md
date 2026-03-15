# IssueFoundry

MCP server plugin for managing kanban boards, issues, and documents — scoped to the project the agent is working on.

## Install as Claude Code Plugin

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "issue-foundry": {
      "command": "node",
      "args": ["/path/to/IssueFoundry/dist/index.js"]
    }
  }
}
```

The board auto-creates based on the working directory. To bind to a specific project:

```json
{
  "mcpServers": {
    "issue-foundry": {
      "command": "node",
      "args": ["/path/to/IssueFoundry/dist/index.js", "--project", "/path/to/your-project"]
    }
  }
}
```

## Development

```bash
npm install
npm run build
npm run dev   # runs with tsx (no build needed)
```

## How Agents Use It

Agents interact using natural column names — no IDs needed:

```
create_card(title: "Fix login bug", column_name: "To Do", labels: ["bug"])
move_card(card_id: 1, column_name: "In Progress")
add_comment(card_id: 1, body: "Found the root cause")
move_card(card_id: 1, column_name: "Done")
create_document(title: "Auth Architecture", content: "# Auth Flow\n...")
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `get_board` | Get the project board with all columns and cards |
| `list_boards` | List all boards across projects |
| `create_card` | Create a card (use `column_name` like "To Do") |
| `update_card` | Update title, description, or labels |
| `move_card` | Move to another column (use `column_name` like "Done") |
| `get_card` | Get a card with its comments |
| `search_cards` | Search cards by title or description |
| `delete_card` | Delete a card |
| `add_comment` | Comment on a card |
| `list_comments` | List comments on a card |
| `create_document` | Store documentation |
| `update_document` | Update a document |
| `list_documents` | List project documents |
| `get_document` | Get a document by ID |
| `search_documents` | Search documents |
| `create_column` | Add a new column |

## Storage

Database is stored at `~/.issue-foundry/kanban.db` — shared across all projects, with each project getting its own board. Default columns: Backlog, To Do, In Progress, Review, Done.

## Tech Stack

- MCP SDK (stdio transport)
- better-sqlite3 (WAL mode)
- TypeScript
