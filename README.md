# IssueFoundry

MCP server plugin for managing kanban boards, issues, and documents — scoped to the project the agent is working on.

## Installation

### Method 1: Claude Code Plugin Marketplace (Recommended)

Add the marketplace and install:

```
/plugin marketplace add HgGamer/IssueFoundry
/plugin install issue-foundry@HgGamer
```

The plugin auto-starts on every Claude Code session. Dependencies install automatically on first use.

### Method 2: Direct MCP Server

Add as an MCP server in your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "issue-foundry": {
      "command": "node",
      "args": ["/path/to/IssueFoundry/dist/server/index.js"]
    }
  }
}
```

Or add via CLI:

```bash
claude mcp add --transport stdio issue-foundry -- node /path/to/IssueFoundry/dist/server/index.js
```

### Method 3: Global User Config

Add to `~/.claude/settings.json` to make it available in all projects:

```json
{
  "mcpServers": {
    "issue-foundry": {
      "command": "node",
      "args": ["/path/to/IssueFoundry/dist/server/index.js"]
    }
  }
}
```

### Method 4: Team Distribution

Add to your project's `.claude/settings.json` so all team members get it:

```json
{
  "extraKnownMarketplaces": {
    "HgGamer": {
      "source": {
        "source": "github",
        "repo": "HgGamer/IssueFoundry"
      }
    }
  },
  "enabledPlugins": {
    "issue-foundry@HgGamer": true
  }
}
```

## Web UI

Launch the web dashboard to view and manage your boards visually:

```bash
npm run dev          # development (hot reload)
npm run build && npm start  # production
```

Open http://localhost:37696 — drag-and-drop cards, manage comments, browse documents. The web UI and MCP server share the same database, so changes from agents appear in real-time.

## How It Works

Each project gets its own board automatically (based on working directory). Default columns: **Backlog**, **To Do**, **In Progress**, **Review**, **Done**.

All data is stored at `~/.issue-foundry/kanban.db`.

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

## Example Usage

```
create_card(title: "Fix login bug", column_name: "To Do", labels: ["bug"])
move_card(card_id: 1, column_name: "In Progress")
add_comment(card_id: 1, body: "Found the root cause")
move_card(card_id: 1, column_name: "Done")
create_document(title: "Auth Architecture", content: "# Auth Flow\n...")
```

## Development

```bash
npm install
npm run build        # build client + server
npm run dev          # web UI with hot reload
npm run mcp:dev      # MCP server (dev mode)
```

## Tech Stack

- **MCP Plugin:** MCP SDK (stdio transport)
- **Web UI:** React + @hello-pangea/dnd + Tailwind CSS v4
- **Backend:** Express + Vite
- **Database:** better-sqlite3 (WAL mode)
- **Dev:** TypeScript + tsx
