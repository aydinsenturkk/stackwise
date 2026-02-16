#!/bin/bash
# Block access to .env files in PreToolUse hook
#
# This hook runs before Bash and Read tool calls.
# It checks CLAUDE_TOOL_INPUT for references to .env files
# and exits with code 2 to block the operation if found.
#
# Environment variables available:
#   CLAUDE_TOOL       - The tool being invoked (e.g., "Bash", "Read")
#   CLAUDE_TOOL_INPUT - JSON string of the tool's input parameters

TOOL_INPUT="${CLAUDE_TOOL_INPUT:-}"

if [ -z "$TOOL_INPUT" ]; then
  exit 0
fi

# Check for .env file references in the tool input
# Matches: .env, .env.local, .env.production, .env.development, etc.
if echo "$TOOL_INPUT" | grep -qE '\.env(\.[a-zA-Z]+)*"' 2>/dev/null; then
  echo "BLOCKED: Access to .env files is not allowed. Environment files may contain secrets."
  exit 2
fi

# Also check for common patterns that might access env files indirectly
if echo "$TOOL_INPUT" | grep -qE 'cat.*\.env|less.*\.env|more.*\.env|head.*\.env|tail.*\.env' 2>/dev/null; then
  echo "BLOCKED: Access to .env files is not allowed. Environment files may contain secrets."
  exit 2
fi

exit 0
