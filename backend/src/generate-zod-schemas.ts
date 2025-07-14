import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Generate using openapi-zod-client CLI
console.log("Generating Zod schemas from OpenAPI spec...");
execSync(
  "npx openapi-zod-client openapi.yaml --output src/generated/temp-client.ts --export-schemas",
  {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
  }
);

// Read the generated file and extract only the schema definitions
const tempFilePath = path.join(__dirname, "./generated/temp-client.ts");
const generatedContent = fs.readFileSync(tempFilePath, "utf-8");

// Extract schema definitions (everything between imports and the API client)
const lines = generatedContent.split("\n");
const schemaLines: string[] = [];
let inSchemas = false;

for (const line of lines) {
  // Skip import of Zodios-specific dependencies, keep only zod import
  if (
    line.includes("import") &&
    !line.includes('from "zod"') &&
    !line.includes("from 'zod'")
  ) {
    continue;
  }

  // Start collecting when we see zod import or first const declaration
  if (line.includes('from "zod"') || line.includes("from 'zod'")) {
    schemaLines.push(line);
    inSchemas = true;
    continue;
  }

  // Stop collecting when we reach the API definition or export
  if (
    inSchemas &&
    (line.includes("makeApi") ||
      line.includes("export const api") ||
      line.includes("export default"))
  ) {
    break;
  }

  // Collect schema definitions
  if (inSchemas) {
    schemaLines.push(line);
  }
}

// Add exports for all the schemas
const schemaContent = schemaLines.join("\n");
const schemaNames = [...schemaContent.matchAll(/^const (\w+) = z\./gm)].map(
  (match) => match[1]
);

const exportsSection =
  schemaNames.length > 0
    ? "\n// Export all schemas\n" +
      schemaNames.map((name) => `export { ${name} };`).join("\n") +
      "\n"
    : "";

const finalContent = schemaContent + exportsSection;

// Write the cleaned up schemas
const outputPath = path.join(__dirname, "./generated/zod-schemas.ts");
fs.writeFileSync(outputPath, finalContent);

// Clean up temporary file
fs.unlinkSync(tempFilePath);

console.log(`✅ Zod schemas generated successfully at ${outputPath}`);
