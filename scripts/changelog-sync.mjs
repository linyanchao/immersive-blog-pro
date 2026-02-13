/*
 * @Author: linyc
 * @Date: 2026-02-13 11:38:17
 * @LastEditTime: 2026-02-13 11:38:18
 * @LastEditors: linyc
 * @Description: 
 */
import fs from "fs";
import { execSync } from "child_process";

const file = "CHANGELOG.md";
const sha = execSync("git rev-parse --short HEAD").toString().trim();
const msg = execSync("git log -1 --pretty=%s").toString().trim();
const date = new Date().toISOString().slice(0, 10);
const line = `- ${date} ${msg} (${sha})`;

let content = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "# Changelog\n\n## [Unreleased]\n\n### Commits\n";
if (content.includes(`(${sha})`)) process.exit(0);

if (!content.includes("## [Unreleased]")) {
  content += "\n## [Unreleased]\n\n### Commits\n";
}
if (!content.includes("### Commits")) {
  content = content.replace("## [Unreleased]", "## [Unreleased]\n\n### Commits");
}

content = content.replace(/## \[Unreleased\]\n([\s\S]*?)(?=\n## \[|$)/, (m, body) => {
  if (!body.includes("### Commits")) body = `\n### Commits\n${body}`;
  return `## [Unreleased]\n${body}\n${line}\n`;
});

fs.writeFileSync(file, content, "utf8");
console.log("CHANGELOG synced:", line);