# IssueFoundry

A kanban board that lives inside your AI coding agent. Create issues, track progress, and manage documents — all from your terminal or a live web UI.

IssueFoundry runs as a [Claude Code plugin](https://docs.anthropic.com/en/docs/claude-code). When you start a session, your board is ready. Ask Claude to check the board, pick up tasks, or create issues — it works through MCP tools. Open the web UI in your browser to drag cards around, add comments, and watch changes appear in real-time via WebSocket.

## Quick Start

### Install as a Claude Code Plugin (Recommended)

```
/install HgGamer/issue-foundry
```

That's it. The plugin auto-starts a local web server on every session and stops it when you're done.

### Use the `/work-issues` Slash Command

Once installed, type `/work-issues` in Claude Code. Claude will:

1. Fetch your board
2. Pick the top task from "To Do"
3. Move it to "In Progress" and comment its plan
4. Do the work
5. Move it to "Review" when done

### Open the Web UI

Visit **http://localhost:37696** while a session is running. You'll see your kanban board with drag-and-drop cards, comments, and a docs page. Changes made by Claude appear live — no refresh needed.

## Alternative Installation

<details>
<summary>Direct MCP server (no plugin)</summary>

Clone and build:

```bash
git clone https://github.com/HgGamer/IssueFoundry.git
cd IssueFoundry
npm install && npm run build
```

Add to your project's `.mcp.json`:

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

Start the web server manually:

```bash
npm start
```

</details>

<details>
<summary>Global config (all projects)</summary>

Add to `~/.claude/settings.json`:

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

</details>

<details>
<summary>Team distribution</summary>

Add to your project's `.claude/settings.json` so all team members get it automatically:

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

</details>

## How It Works

- Each project gets its own board automatically (based on working directory)
- Default columns: **Backlog** | **To Do** | **In Progress** | **Review** | **Done**
- Data is stored at `~/.issue-foundry/kanban.db` (SQLite, WAL mode)
- The web UI and MCP tools share the same database — changes sync instantly

## MCP Tools

| Tool | Description |
|------|-------------|
| `get_board` | Get the project board with all columns and cards |
| `list_boards` | List all boards across projects |
| `create_card` | Create a card (use `column_name` like "To Do") |
| `update_card` | Update title, description, or labels |
| `move_card` | Move to another column (use `column_name`) |
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

## Development

```bash
npm install
npm run build        # build client + server
npm run dev          # web UI with hot reload
npm run mcp:dev      # MCP server (dev mode)
```

## Tech Stack

- **Plugin:** MCP SDK (stdio transport)
- **Web UI:** React + Tailwind CSS v4 + @hello-pangea/dnd
- **Backend:** Express + WebSocket (ws)
- **Database:** better-sqlite3 (WAL mode)
- **Build:** TypeScript + Vite

## License

MIT
