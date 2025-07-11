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
        "Langfuse secret or public key not found in environment variables. Prompts will not be fetched from Langfuse."
      );
      // Potentially throw an error or handle this case more gracefully
      // For now, we'll allow the app to run but log a warning.
      // A null client could be returned or a mock/dummy client.
      // However, the SDK itself might throw an error if keys are missing.
      // Let's assume for now that if keys are missing, we should not initialize.
      throw new Error("Langfuse API keys not configured.");
    }

    langfuse = new Langfuse({
      secretKey,
      publicKey,
      baseUrl: baseUrl || "https://cloud.langfuse.com", // Default to cloud if not specified
    });
    console.log("Langfuse client initialized.");
  }
  return langfuse;
};

// Optional: A function to explicitly initialize Langfuse on app startup
export const initLangfuse = () => {
  try {
    getLangfuseClient();
  } catch (error) {
    console.error("Failed to initialize Langfuse client:", error);
    // Decide if this should be a fatal error for the application
  }
};

// Example of how to fetch a prompt using this service (will be expanded later)
// export const fetchPrompt = async (promptName: string, variables?: Record<string, any>) => {
//   const client = getLangfuseClient();
//   if (!client) {
//     throw new Error("Langfuse client not available.");
//   }
//   try {
//     const prompt = await client.getPrompt(promptName);
//     if (variables) {
//       return prompt.compile(variables);
//     }
//     return prompt.prompt; // Return raw prompt if no variables
//   } catch (error) {
//     console.error(`Error fetching prompt "${promptName}" from Langfuse:`, error);
//     throw error; // Re-throw the error to be handled by the caller
//   }
// };
