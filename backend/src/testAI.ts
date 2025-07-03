import { aiService } from "./aiService";

async function testAI() {
  console.log("Testing AI service...");

  try {
    const result = await aiService.generateContent({
      prompt:
        "Create a brief overview section for a user authentication feature",
      tone: "professional",
      length: "brief",
    });

    console.log("✅ AI generation successful!");
    console.log("Generated content:", result.content);
    console.log("Tokens used:", result.tokensUsed);
    console.log("Model used:", result.modelUsed);
    console.log("Generation time:", result.generationTime, "seconds");
  } catch (error) {
    console.error("❌ AI generation failed:", error);
  }
}

testAI();
