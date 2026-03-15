#!/bin/bash
# Resolve plugin root from env or from this script's location
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"

# Install native dependencies if node_modules is missing
if [ ! -d "${PLUGIN_ROOT}/node_modules" ]; then
  cd "${PLUGIN_ROOT}" && npm install --production > /tmp/issuefoundry.log 2>&1
fi

# Start the web UI if not already running
if ! curl -s --connect-timeout 1 http://localhost:37696/ > /dev/null 2>&1; then
  cd "${PLUGIN_ROOT}"
  nohup node dist/server/server.js >> /tmp/issuefoundry.log 2>&1 &
  disown
fi

echo "IssueFoundry running on http://localhost:37696"
