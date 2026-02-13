import os
import re
import subprocess
from datetime import datetime

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CHANGELOG = os.path.join(ROOT, "CHANGELOG.md")

def sh(cmd):
  return subprocess.check_output(cmd, cwd=ROOT, shell=True, text=True).strip()

def ensure_block(text):
  if "## [Unreleased]" not in text:
    text = text.strip() + "\n\n## [Unreleased]\n\n### Commits\n"
  if "### Commits" not in text:
    text = text.replace("## [Unreleased]", "## [Unreleased]\n\n### Commits")
  return text

def main():
  sha = sh("git rev-parse --short HEAD")
  msg = sh("git log -1 --pretty=%s")
  date = datetime.now().strftime("%Y-%m-%d")
  line = f"- {date} {msg} ({sha})"

  if os.path.exists(CHANGELOG):
    text = open(CHANGELOG, "r", encoding="utf-8").read()
  else:
    text = "# Changelog\n\n## [Unreleased]\n\n### Commits\n"

  text = ensure_block(text)
  if f"({sha})" in text:
    return 0

  m = re.search(r"## \[Unreleased\][\s\S]*?### Commits\s*\n", text)
  if not m:
    text = text.replace("## [Unreleased]", "## [Unreleased]\n\n### Commits\n")
    insert_at = text.find("### Commits") + len("### Commits\n")
    text = text[:insert_at] + line + "\n" + text[insert_at:]
  else:
    insert_at = m.end()
    text = text[:insert_at] + line + "\n" + text[insert_at:]

  open(CHANGELOG, "w", encoding="utf-8").write(text)
  print("CHANGELOG synced:", line)
  return 0

if __name__ == "__main__":
  raise SystemExit(main())