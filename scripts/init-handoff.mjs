import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const projectStatePath = path.join(root, "PROJECT_STATE.md");
const decisionsPath = path.join(root, "DECISIONS.md");

function ensureFile(filePath, content) {
  if (fs.existsSync(filePath)) {
    return false;
  }
  fs.writeFileSync(filePath, `${content}\n`, "utf8");
  return true;
}

const now = new Date();
const yyyy = now.getFullYear();
const mm = String(now.getMonth() + 1).padStart(2, "0");
const dd = String(now.getDate()).padStart(2, "0");
const today = `${yyyy}-${mm}-${dd}`;

const projectStateTemplate = `# PROJECT_STATE

## Goal
- Define the concrete project goal.

## Non-Goals
- List what this project intentionally will not do.

## Current Architecture
- Describe active architecture and major components.

## Data Model
- Document key entities/tables/contracts.

## Key Commands
- Install:
- Run:
- Test:
- Lint:

## Files Created/Modified And Why
- Track high-level changes and intent.

## Completed
- Summarize completed milestones.

## Open Tasks (Prioritized)
1. 
2. 
3. 

## Known Issues / Edge Cases
- Record unresolved risks and caveats.

## Next 3 Actions
- [ ] 
- [ ] 
- [ ]`;

const decisionsTemplate = `# DECISIONS

## ${today}
- Initial handoff scaffolding created.
`;

const createdProjectState = ensureFile(projectStatePath, projectStateTemplate);
const createdDecisions = ensureFile(decisionsPath, decisionsTemplate);

if (createdProjectState || createdDecisions) {
  console.log("Handoff scaffolding complete.");
  if (createdProjectState) {
    console.log(`Created ${projectStatePath}`);
  }
  if (createdDecisions) {
    console.log(`Created ${decisionsPath}`);
  }
} else {
  console.log("Handoff files already exist. No changes made.");
}

console.log("Next: run `npm run handoff:prompt` before ending sessions.");
