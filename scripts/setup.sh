#!/bin/bash
# Install native dependencies if node_modules is missing
if [ ! -d "${CLAUDE_PLUGIN_ROOT}/node_modules" ]; then
  cd "${CLAUDE_PLUGIN_ROOT}" && npm install --production 2>/dev/null
fi
