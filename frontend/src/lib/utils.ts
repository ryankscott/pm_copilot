import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import TurndownService from "turndown";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utility function to export HTML content as markdown file
export function exportToMarkdown(
  htmlContent: string,
  filename: string = "document.md"
) {
  // Configure turndown service with options optimized for PRD content
  const turndownService = new TurndownService({
    headingStyle: "atx", // Use # for headers instead of underlines
    hr: "---", // Use --- for horizontal rules
    bulletListMarker: "-", // Use - for bullet points
    codeBlockStyle: "fenced", // Use ``` for code blocks
    fence: "```", // Use ``` instead of ~~~
    emDelimiter: "*", // Use * for emphasis
    strongDelimiter: "**", // Use ** for strong text
    linkStyle: "inlined", // Use inline links [text](url)
    linkReferenceStyle: "full", // Use full reference style if needed
  });

  // Add custom rules for better table handling
  turndownService.addRule("strikethrough", {
    filter: ["del", "s"],
    replacement: function (content: string) {
      return "~~" + content + "~~";
    },
  });

  // Convert HTML to markdown
  const markdown = turndownService.turndown(htmlContent);

  // Clean up the markdown (remove excessive whitespace)
  const cleanMarkdown = markdown
    .replace(/\n\n\n+/g, "\n\n") // Replace 3+ newlines with 2
    .replace(/^\s+|\s+$/g, "") // Trim start and end
    .replace(/\n\s+\n/g, "\n\n"); // Remove whitespace-only lines

  // Create and download the file
  const blob = new Blob([cleanMarkdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Utility function to sanitize filename
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9]/gi, "_") // Replace non-alphanumeric with underscore
    .replace(/_+/g, "_") // Replace multiple underscores with single
    .replace(/^_|_$/g, "") // Remove leading/trailing underscores
    .toLowerCase();
}
