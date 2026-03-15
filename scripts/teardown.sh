#!/bin/bash
# Kill the IssueFoundry web server if running
PID=$(lsof -iTCP:37696 -sTCP:LISTEN -t 2>/dev/null)
if [ -n "$PID" ]; then
  kill "$PID" 2>/dev/null
fi
