#!/bin/bash
# Auto-format files after Edit/Write operations
# Usage: format-on-save.sh <file_path>
#
# This hook runs as a PostToolUse hook after Edit or Write tool calls.
# It detects the appropriate formatter and runs it on the changed file.

FILE_PATH="$1"

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

if [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

# Get the file extension
EXT="${FILE_PATH##*.}"

# Only format known source file types
case "$EXT" in
  ts|tsx|js|jsx|json|css|scss|html|md|yaml|yml)
    ;;
  *)
    exit 0
    ;;
esac

# Find project root by looking for package.json
DIR="$(dirname "$FILE_PATH")"
PROJECT_ROOT=""
while [ "$DIR" != "/" ]; do
  if [ -f "$DIR/package.json" ]; then
    PROJECT_ROOT="$DIR"
    break
  fi
  DIR="$(dirname "$DIR")"
done

if [ -z "$PROJECT_ROOT" ]; then
  exit 0
fi

# Try prettier first, then fall back to eslint --fix
if [ -f "$PROJECT_ROOT/node_modules/.bin/prettier" ]; then
  "$PROJECT_ROOT/node_modules/.bin/prettier" --write "$FILE_PATH" 2>/dev/null
elif command -v npx &>/dev/null; then
  npx --yes prettier --write "$FILE_PATH" 2>/dev/null
fi

exit 0
