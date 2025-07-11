import { Langfuse } from "langfuse";
import "dotenv/config";

let langfuse: Langfuse | null = null;

export const getLangfuseClient = (): Langfuse => {
  if (!langfuse) {
    const secretKey = process.env.LANGFUSE_SECRET_KEY;
    const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
    const baseUrl = process.env.LANGFUSE_BASEURL;

    if (!secretKey || !publicKey) {
      console.warn(
        "Langfuse secret or public key not found in environment variables. Prompts will not be fetched from Langfuse. Ensure LANGFUSE_SECRET_KEY and LANGFUSE_PUBLIC_KEY are set."
      );
      // This error will prevent the application from fully starting if Langfuse is critical.
      // Consider if a less critical failure mode is desired if prompts can have defaults.
      throw new Error(
        "Langfuse API keys not configured. Please set LANGFUSE_SECRET_KEY and LANGFUSE_PUBLIC_KEY."
      );
    }

    langfuse = new Langfuse({
      secretKey,
      publicKey,
      baseUrl: baseUrl || "https://cloud.langfuse.com", // Default to cloud if not specified
    });
    console.log(
      `Langfuse client initialized. Base URL: ${
        baseUrl || "https://cloud.langfuse.com"
      }`
    );
  }
  return langfuse;
};

// Function to explicitly initialize Langfuse on app startup
export const initLangfuse = () => {
  try {
    getLangfuseClient();
  } catch (error) {
    console.error(
      "Failed to initialize Langfuse client during startup:",
      error
    );
    // Depending on application requirements, you might want to exit the process
    // if Langfuse is essential for operation.
    // process.exit(1);
  }
};
