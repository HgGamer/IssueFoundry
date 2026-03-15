#!/bin/bash
# Resolve plugin root from env or from this script's location
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"

# Install native dependencies if node_modules is missing
if [ ! -d "${PLUGIN_ROOT}/node_modules" ]; then
  cd "${PLUGIN_ROOT}" && npm install --production 2>/dev/null
fi

# Start the web UI if not already running
if ! lsof -iTCP:37696 -sTCP:LISTEN >/dev/null 2>&1; then
  cd "${PLUGIN_ROOT}" && nohup node dist/server/server.js > /tmp/issuefoundry.log 2>&1 &
  echo "IssueFoundry web UI starting at http://localhost:37696"
fi
