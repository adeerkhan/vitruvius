const fs = require("fs");
const path = require("path");
const text = fs.readFileSync("skills/standards-lookup/SKILL.md", "utf8");
const matches = [...text.matchAll(/references\/([a-z0-9-]+\.md)/g)].map((x) => x[1]);
const unique = [...new Set(matches)];
let missing = [];
for (const f of unique) {
  if (!fs.existsSync(path.join("skills/standards-lookup/references", f))) missing.push(f);
}
console.log(`Referenced: ${unique.length} | Missing: ${missing.length}`);
if (missing.length) console.log("MISSING:", missing.join(", "));
else console.log("All referenced files exist.");
console.log("\nFiles:\n" + unique.sort().join("\n"));
