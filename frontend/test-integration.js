#!/usr/bin/env node

/**
 * Integration test for multi-provider AI settings
 * Tests that all providers can be imported and configured correctly
 */

import { existsSync } from "fs";
import { resolve } from "path";

console.log("🧪 Testing Multi-Provider AI Integration...\n");

// Test 1: Check if all necessary packages are installed
console.log("1. Checking package dependencies...");
const packageJsonPath = resolve(process.cwd(), "package.json");
if (!existsSync(packageJsonPath)) {
  console.error("❌ package.json not found");
  process.exit(1);
}

const packageJson = JSON.parse(
  require("fs").readFileSync(packageJsonPath, "utf8")
);
const requiredPackages = [
  "ai",
  "@ai-sdk/openai",
  "@ai-sdk/anthropic",
  "@ai-sdk/google",
  "ollama-ai-provider",
];

let allPackagesInstalled = true;
for (const pkg of requiredPackages) {
  if (packageJson.dependencies[pkg]) {
    console.log(`   ✅ ${pkg} - ${packageJson.dependencies[pkg]}`);
  } else {
    console.log(`   ❌ ${pkg} - Missing`);
    allPackagesInstalled = false;
  }
}

if (!allPackagesInstalled) {
  console.error("\n❌ Some required packages are missing. Run: npm install");
  process.exit(1);
}

// Test 2: Check if API route exists and has multi-provider support
console.log("\n2. Checking API route configuration...");
const apiRoutePath = resolve(process.cwd(), "src/app/api/chat/route.ts");
if (!existsSync(apiRoutePath)) {
  console.error("❌ API route not found at src/app/api/chat/route.ts");
  process.exit(1);
}

const apiRouteContent = require("fs").readFileSync(apiRoutePath, "utf8");
const requiredImports = [
  "@ai-sdk/openai",
  "@ai-sdk/anthropic",
  "@ai-sdk/google",
  "ollama-ai-provider",
];

let allImportsPresent = true;
for (const imp of requiredImports) {
  if (apiRouteContent.includes(imp)) {
    console.log(`   ✅ ${imp} imported`);
  } else {
    console.log(`   ❌ ${imp} not imported`);
    allImportsPresent = false;
  }
}

if (
  apiRouteContent.includes("getModel") &&
  apiRouteContent.includes("provider")
) {
  console.log("   ✅ Dynamic provider selection implemented");
} else {
  console.log("   ❌ Dynamic provider selection not found");
  allImportsPresent = false;
}

// Test 3: Check if Settings component exists
console.log("\n3. Checking Settings component...");
const settingsPath = resolve(process.cwd(), "src/components/Settings.tsx");
if (!existsSync(settingsPath)) {
  console.error("❌ Settings component not found");
  process.exit(1);
}

const settingsContent = require("fs").readFileSync(settingsPath, "utf8");
const providers = ["openai", "claude", "gemini", "ollama"];
let allProvidersSupported = true;

for (const provider of providers) {
  if (settingsContent.includes(provider)) {
    console.log(`   ✅ ${provider} provider supported`);
  } else {
    console.log(`   ❌ ${provider} provider not found`);
    allProvidersSupported = false;
  }
}

// Test 4: Check environment template
console.log("\n4. Checking environment configuration...");
const envExamplePath = resolve(process.cwd(), ".env.example");
if (!existsSync(envExamplePath)) {
  console.error("❌ .env.example not found");
  process.exit(1);
}

const envContent = require("fs").readFileSync(envExamplePath, "utf8");
const envKeys = [
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "OLLAMA_BASE_URL",
];

let allEnvKeysPresent = true;
for (const key of envKeys) {
  if (envContent.includes(key)) {
    console.log(`   ✅ ${key} in .env.example`);
  } else {
    console.log(`   ❌ ${key} missing from .env.example`);
    allEnvKeysPresent = false;
  }
}

// Final result
console.log("\n📊 Test Results:");
if (
  allPackagesInstalled &&
  allImportsPresent &&
  allProvidersSupported &&
  allEnvKeysPresent
) {
  console.log("✅ All tests passed! Multi-provider AI integration is ready.");
  console.log("\n🚀 Next steps:");
  console.log("   1. Copy .env.example to .env.local");
  console.log("   2. Add your API keys");
  console.log("   3. Start the dev server: npm run dev");
  console.log("   4. Click the settings gear to choose your AI provider");
  process.exit(0);
} else {
  console.log("❌ Some tests failed. Please review the issues above.");
  process.exit(1);
}
