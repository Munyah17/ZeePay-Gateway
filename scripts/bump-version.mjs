import { readFileSync, writeFileSync } from "node:fs";

const file = new URL("../version.json", import.meta.url);
const data = JSON.parse(readFileSync(file, "utf8"));
data.version = (Math.round((parseFloat(data.version) + 0.01) * 100) / 100).toFixed(2);
writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
console.log(`version -> ${data.version}`);
