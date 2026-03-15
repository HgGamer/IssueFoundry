#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getOrCreateProjectBoard } from "./db.js";
import { registerTools } from "./tools.js";
function resolveProject() {
    const args = process.argv.slice(2);
    const idx = args.indexOf("--project");
    if (idx !== -1 && args[idx + 1])
        return args[idx + 1];
    if (process.env.ISSUE_FOUNDRY_PROJECT)
        return process.env.ISSUE_FOUNDRY_PROJECT;
    // Default to cwd so each project gets its own board automatically
    return process.cwd();
}
const projectPath = resolveProject();
let projectBoardId;
if (projectPath) {
    const board = getOrCreateProjectBoard(projectPath);
    projectBoardId = board.id;
    console.error(`IssueFoundry: loaded project "${board.name}" (${board.project_path})`);
}
const server = new McpServer({
    name: "issue-foundry",
    version: "1.0.0",
});
registerTools(server, projectBoardId);
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("IssueFoundry MCP server running on stdio");
