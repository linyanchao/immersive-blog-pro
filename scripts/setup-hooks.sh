#!/usr/bin/env bash
set -e
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
git -C "$ROOT_DIR" config core.hooksPath scripts/githooks
chmod +x "$ROOT_DIR/scripts/githooks/post-commit" || true
echo "OK: git hooksPath -> scripts/githooks"
echo "Now every commit will sync CHANGELOG.md automatically."