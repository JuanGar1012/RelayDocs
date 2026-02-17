import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const projectStatePath = path.join(root, "PROJECT_STATE.md");
const decisionsPath = path.join(root, "DECISIONS.md");
const outputPath = path.join(root, "NEXT_SESSION_PROMPT.md");

function readRequired(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required file: ${filePath}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

function extractSection(markdown, heading) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const headingPattern = new RegExp(`^##\\s+${escapedHeading}\\s*$`, "m");
  const headingMatch = headingPattern.exec(markdown);
  if (!headingMatch || headingMatch.index === undefined) {
    return "";
  }

  const sectionStart = headingMatch.index + headingMatch[0].length;
  const afterHeading = markdown.slice(sectionStart);
  const nextHeadingOffset = afterHeading.search(/\r?\n##\s+/);
  const sectionEnd = nextHeadingOffset === -1 ? markdown.length : sectionStart + nextHeadingOffset;
  return markdown.slice(sectionStart, sectionEnd).trim();
}

function cleanListBlock(block) {
  return block
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-") || line.startsWith("1.") || line.startsWith("2.") || line.startsWith("3.") || line.startsWith("4.") || line.startsWith("5.") || line.startsWith("6.") || line.startsWith("7.") || line.startsWith("8.") || line.startsWith("9."))
    .map((line) => line.replace(/^- \[.\]\s*/, "- ").replace(/^\d+\.\s*\[.\]\s*/, ""))
    .join("\n");
}

function buildPrompt(projectState, decisions) {
  const nextActions = cleanListBlock(extractSection(projectState, "Next 3 Actions"));
  const openTasks = cleanListBlock(extractSection(projectState, "Open Tasks (Prioritized)"));
  const knownIssues = cleanListBlock(extractSection(projectState, "Known Issues / Edge Cases"));

  const lastDecisionDateMatch = decisions.match(/##\s+(\d{4}-\d{2}-\d{2})/g);
  const latestDecisionDate = lastDecisionDateMatch
    ? lastDecisionDateMatch[lastDecisionDateMatch.length - 1].replace("## ", "")
    : "unknown";

  return `Use PROJECT_STATE.md as canonical state and DECISIONS.md for rationale. Continue from Next 3 Actions.

Project root: ${root}

Operational context:
- Canonical files: PROJECT_STATE.md, DECISIONS.md
- Latest decision log date: ${latestDecisionDate}

Next 3 Actions:
${nextActions || "- (No explicit next actions found in PROJECT_STATE.md)"}

Open Tasks (Prioritized):
${openTasks || "- (No open tasks section found in PROJECT_STATE.md)"}

Known Issues / Edge Cases:
${knownIssues || "- (No known issues section found in PROJECT_STATE.md)"}

Execution requirements:
- Make small, focused diffs.
- Validate with relevant tests after changes.
- Do not revert unrelated local changes.
- Keep updates concise and continue until the requested task is completed end-to-end.
`;
}

try {
  const projectState = readRequired(projectStatePath);
  const decisions = readRequired(decisionsPath);
  const prompt = buildPrompt(projectState, decisions);

  fs.writeFileSync(outputPath, `${prompt}\n`, "utf8");
  console.log(`Generated: ${outputPath}`);
  console.log(prompt);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
