const fetch = require("node-fetch");

const API_BASE = "http://localhost:8080";

async function testLangfuseHealth() {
  console.log("=== Testing Langfuse Health Check ===");

  try {
    const response = await fetch(`${API_BASE}/health/langfuse`);
    const data = await response.json();

    console.log("Health check response:", JSON.stringify(data, null, 2));

    if (data.healthy) {
      console.log("✅ Langfuse is healthy and connected");
    } else {
      console.log("❌ Langfuse is not healthy");
    }
  } catch (error) {
    console.error("❌ Health check failed:", error.message);
  }
}

async function testPRDGeneration() {
  console.log("\n=== Testing PRD Generation with Langfuse Tracking ===");

  try {
    // First create a test PRD
    const createResponse = await fetch(`${API_BASE}/prds`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "test-user-123",
        "x-session-id": "test-session-456",
      },
      body: JSON.stringify({
        title: "Test PRD for Langfuse",
        content: "This is a test PRD for Langfuse monitoring",
      }),
    });

    const prd = await createResponse.json();
    console.log("Created test PRD:", prd.id);

    // Test generation
    const generateResponse = await fetch(
      `${API_BASE}/prds/${prd.id}/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "test-user-123",
          "x-session-id": "test-session-456",
        },
        body: JSON.stringify({
          prompt:
            "Create a simple PRD for a mobile app that helps users track their daily water intake",
          tone: "professional",
          length: "brief",
          provider: {
            type: "ollama",
            isConfigured: true,
          },
          model: "llama3.2:latest",
        }),
      }
    );

    const result = await generateResponse.json();
    console.log("Generation result keys:", Object.keys(result));
    console.log("Langfuse data:", result.langfuseData);

    if (result.langfuseData) {
      console.log("✅ Langfuse tracking data included");

      // Test feedback submission
      const feedbackResponse = await fetch(`${API_BASE}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "test-user-123",
          "x-session-id": "test-session-456",
        },
        body: JSON.stringify({
          traceId: result.langfuseData.traceId,
          generationId: result.langfuseData.generationId,
          score: 1,
          comment: "Great response!",
        }),
      });

      const feedbackResult = await feedbackResponse.json();
      console.log("Feedback submission:", feedbackResult);

      if (feedbackResult.success) {
        console.log("✅ Feedback submitted successfully");
      } else {
        console.log("❌ Feedback submission failed");
      }
    } else {
      console.log("❌ No Langfuse tracking data found");
    }

    // Clean up - delete test PRD
    await fetch(`${API_BASE}/prds/${prd.id}`, {
      method: "DELETE",
    });
    console.log("Cleaned up test PRD");
  } catch (error) {
    console.error("❌ PRD generation test failed:", error.message);
  }
}

async function runTests() {
  console.log("Starting Langfuse integration tests...\n");

  await testLangfuseHealth();
  await testPRDGeneration();

  console.log("\n=== Tests completed ===");
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { testLangfuseHealth, testPRDGeneration, runTests };
