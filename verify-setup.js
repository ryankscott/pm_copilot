#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("🔍 PMCoPilot Setup Verification\n");

// Check if required files exist
const requiredFiles = [
  "src/App.tsx",
  "src/components/AIAssistant.tsx",
  "src/components/PRDEditor.tsx",
  "src/components/PRDList.tsx",
  "src/components/ui/button.tsx",
  "src/lib/sampleData.ts",
  ".env.example",
];

let allFilesExist = true;

requiredFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    console.log("✅", file);
  } else {
    console.log("❌", file, "(missing)");
    allFilesExist = false;
  }
});

// Check if .env.local exists
console.log("\n📋 Environment Setup:");
if (fs.existsSync(".env.local")) {
  console.log("✅ .env.local exists");
  const envContent = fs.readFileSync(".env.local", "utf8");
  if (envContent.includes("your_openai_api_key_here")) {
    console.log("⚠️  Please update .env.local with your actual OpenAI API key");
  } else {
    console.log("✅ OpenAI API key appears to be configured");
  }
} else {
  console.log("⚠️  .env.local not found - copy from .env.example");
}

// Check package.json dependencies
console.log("\n📦 Dependencies:");
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const requiredDeps = [
  "react",
  "typescript",
  "vite",
  "tailwindcss",
  "ai",
  "@ai-sdk/openai",
  "lucide-react",
  "date-fns",
];

requiredDeps.forEach((dep) => {
  if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
    console.log("✅", dep);
  } else {
    console.log("❌", dep, "(missing)");
    allFilesExist = false;
  }
});

console.log("\n🚀 Next Steps:");
if (allFilesExist) {
  console.log("✅ All required files are present");
  console.log("1. Run: pnpm install");
  console.log("2. Run: pnpm run dev");
  console.log("3. Open: http://localhost:5173");
  console.log("4. For real AI: Deploy to Vercel with OpenAI API key");
} else {
  console.log("❌ Some files are missing. Please check the setup.");
}

console.log(
  "\n📖 Documentation: Check README.md for detailed setup instructions"
);
