// Test script to verify metadata store functionality
import { useMessageMetadataStore } from "./store/message-metadata-store";

// Test the metadata store
console.log("Testing metadata store...");

// Get the store instance
const store = useMessageMetadataStore.getState();

// Add some pending metadata
store.addPendingMetadata({
  inputTokens: 100,
  outputTokens: 200,
  generationTime: 2.5,
  cost: 0.005,
  provider: "OpenAI",
  model: "gpt-4",
  timestamp: new Date(),
  responseContent: "This is a test response for matching...",
});

console.log("Pending metadata:", store.pendingMetadata);

// Try to match it
const matched = store.matchPendingMetadata(
  "test-message-id",
  "This is a test response for matching with more content..."
);
console.log("Matching result:", matched);

// Check if metadata is stored
const metadata = store.getMessageMetadata("test-message-id");
console.log("Retrieved metadata:", metadata);

export {}; // Make this a module
