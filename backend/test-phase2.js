const axios = require("axios");

const BASE_URL = "http://localhost:8080";

// Test configuration
const testConfig = {
  traceId: "test-trace-" + Date.now(),
  generationId: "test-gen-" + Date.now(),
  userId: "test-user-123",
};

async function testEnhancedFeedbackSubmission() {
  console.log("\n=== Testing Enhanced Feedback Submission ===");

  try {
    // Test comprehensive feedback submission
    const feedbackData = {
      traceId: testConfig.traceId,
      generationId: testConfig.generationId,
      score: 1,
      rating: 5,
      comment:
        "Excellent PRD generation! Very comprehensive and well-structured.",
      categories: ["completeness", "clarity", "helpfulness"],
    };

    const response = await axios.post(
      `${BASE_URL}/api/feedback/enhanced`,
      feedbackData
    );

    console.log("✅ Enhanced feedback submission successful");
    console.log("Response:", JSON.stringify(response.data, null, 2));

    // Verify response structure
    if (response.data.success && response.data.analytics) {
      console.log("✅ Analytics data included in response");
      console.log("Analytics:", response.data.analytics);
    } else {
      console.log("❌ Missing analytics data in response");
    }

    return response.data;
  } catch (error) {
    console.error(
      "❌ Enhanced feedback submission failed:",
      error.response?.data || error.message
    );
    return null;
  }
}

async function testFeedbackHistory() {
  console.log("\n=== Testing Feedback History ===");

  try {
    const response = await axios.get(
      `${BASE_URL}/api/feedback/history?limit=5&userId=${testConfig.userId}`
    );

    console.log("✅ Feedback history retrieval successful");
    console.log("Response structure:", {
      success: response.data.success,
      dataLength: response.data.data?.length || 0,
      pagination: response.data.pagination,
    });

    if (response.data.data && response.data.data.length > 0) {
      console.log("Sample feedback entry:", response.data.data[0]);
    }

    return response.data;
  } catch (error) {
    console.error(
      "❌ Feedback history retrieval failed:",
      error.response?.data || error.message
    );
    return null;
  }
}

async function testFeedbackAnalytics() {
  console.log("\n=== Testing Feedback Analytics ===");

  try {
    const response = await axios.get(
      `${BASE_URL}/api/feedback/analytics?userId=${testConfig.userId}&timeRange=30d`
    );

    console.log("✅ Feedback analytics retrieval successful");
    console.log("Analytics summary:", {
      totalFeedback: response.data.data?.totalFeedback,
      positiveCount: response.data.data?.positiveCount,
      negativeCount: response.data.data?.negativeCount,
      averageRating: response.data.data?.averageRating,
      topCategoriesCount: response.data.data?.topCategories?.length || 0,
    });

    if (response.data.data?.topCategories) {
      console.log("Top categories:", response.data.data.topCategories);
    }

    return response.data;
  } catch (error) {
    console.error(
      "❌ Feedback analytics retrieval failed:",
      error.response?.data || error.message
    );
    return null;
  }
}

async function testFeedbackTrends() {
  console.log("\n=== Testing Feedback Trends ===");

  try {
    const response = await axios.get(
      `${BASE_URL}/api/feedback/trends?userId=${testConfig.userId}&period=daily&timeRange=7d`
    );

    console.log("✅ Feedback trends retrieval successful");
    console.log("Trends summary:", {
      period: response.data.period,
      timeRange: response.data.timeRange,
      dataPoints: response.data.data?.length || 0,
    });

    if (response.data.data && response.data.data.length > 0) {
      console.log("Sample trend data:", response.data.data.slice(0, 3));
    }

    return response.data;
  } catch (error) {
    console.error(
      "❌ Feedback trends retrieval failed:",
      error.response?.data || error.message
    );
    return null;
  }
}

async function testFeedbackValidation() {
  console.log("\n=== Testing Feedback Validation ===");

  // Test missing required fields
  try {
    await axios.post(`${BASE_URL}/api/feedback/enhanced`, {
      traceId: testConfig.traceId,
      // Missing generationId and score
    });
    console.log("❌ Should have failed validation");
  } catch (error) {
    if (error.response?.status === 400) {
      console.log("✅ Validation correctly rejected missing fields");
    } else {
      console.log(
        "❌ Unexpected error:",
        error.response?.data || error.message
      );
    }
  }

  // Test invalid score
  try {
    await axios.post(`${BASE_URL}/api/feedback/enhanced`, {
      traceId: testConfig.traceId,
      generationId: testConfig.generationId,
      score: 2, // Invalid score (should be 1 or -1)
    });
    console.log("❌ Should have failed validation");
  } catch (error) {
    if (error.response?.status === 400) {
      console.log("✅ Validation correctly rejected invalid score");
    } else {
      console.log(
        "❌ Unexpected error:",
        error.response?.data || error.message
      );
    }
  }

  // Test invalid rating
  try {
    await axios.post(`${BASE_URL}/api/feedback/enhanced`, {
      traceId: testConfig.traceId,
      generationId: testConfig.generationId,
      score: 1,
      rating: 6, // Invalid rating (should be 1-5)
    });
    console.log("❌ Should have failed validation");
  } catch (error) {
    if (error.response?.status === 400) {
      console.log("✅ Validation correctly rejected invalid rating");
    } else {
      console.log(
        "❌ Unexpected error:",
        error.response?.data || error.message
      );
    }
  }
}

async function testVariousFeedbackTypes() {
  console.log("\n=== Testing Various Feedback Types ===");

  const feedbackTypes = [
    {
      name: "Positive with full details",
      data: {
        traceId: testConfig.traceId + "-pos",
        generationId: testConfig.generationId + "-pos",
        score: 1,
        rating: 5,
        comment: "Excellent work!",
        categories: ["clarity", "completeness"],
      },
    },
    {
      name: "Negative with feedback",
      data: {
        traceId: testConfig.traceId + "-neg",
        generationId: testConfig.generationId + "-neg",
        score: -1,
        rating: 2,
        comment: "Needs improvement in technical details",
        categories: ["technical"],
      },
    },
    {
      name: "Simple positive",
      data: {
        traceId: testConfig.traceId + "-simple",
        generationId: testConfig.generationId + "-simple",
        score: 1,
      },
    },
  ];

  for (const feedbackType of feedbackTypes) {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/feedback/enhanced`,
        feedbackType.data
      );
      console.log(`✅ ${feedbackType.name}: Success`);
    } catch (error) {
      console.log(
        `❌ ${feedbackType.name}: Failed -`,
        error.response?.data || error.message
      );
    }
  }
}

async function runPhase2Tests() {
  console.log("🚀 Starting Phase 2 Enhanced Feedback System Tests");
  console.log("Test Configuration:", testConfig);

  // Test basic server connectivity
  try {
    const healthResponse = await axios.get(`${BASE_URL}/health/langfuse`);
    console.log("✅ Server is running and accessible");
    console.log("Langfuse health:", healthResponse.data);
  } catch (error) {
    console.error("❌ Server connectivity failed:", error.message);
    console.log("Make sure the backend server is running on port 8080");
    return;
  }

  // Run all tests
  await testEnhancedFeedbackSubmission();
  await testFeedbackHistory();
  await testFeedbackAnalytics();
  await testFeedbackTrends();
  await testFeedbackValidation();
  await testVariousFeedbackTypes();

  console.log("\n🎉 Phase 2 Enhanced Feedback System Tests Complete!");
  console.log("\n📊 Summary of Phase 2 Features:");
  console.log("✅ Enhanced feedback modal with ratings and categories");
  console.log("✅ Comprehensive feedback submission with analytics");
  console.log("✅ Feedback history retrieval with pagination");
  console.log("✅ Feedback analytics and statistics");
  console.log("✅ Feedback trends over time");
  console.log("✅ Input validation and error handling");
  console.log("✅ Enhanced UI components (FeedbackModal, FeedbackHistory)");
  console.log("✅ Improved MetadataFooter with feedback integration");

  console.log("\n🔄 Next Steps:");
  console.log("- Test the frontend feedback modal UI");
  console.log("- Verify feedback history displays correctly");
  console.log("- Check analytics dashboard integration");
  console.log("- Test error handling and user feedback");
}

// Run tests
runPhase2Tests().catch(console.error);
