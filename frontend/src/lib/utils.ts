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

// Utility function to convert simple markdown to HTML
export function markdownToHtml(markdown: string): string {
  return (
    markdown
      // Headers
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      // Bold and italic
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      // Lists
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/^(\d+)\. (.+)$/gm, "<li>$2</li>")
      // Wrap consecutive list items in ul tags
      .replace(/(<li>[\s\S]*?<\/li>)(?!\s*<li>)/g, "<ul>$1</ul>")
      // Paragraphs - split by double newlines and wrap in p tags
      .split(/\n\s*\n/)
      .map((paragraph) => {
        const trimmed = paragraph.trim();
        if (!trimmed) return "";
        // Don't wrap if it's already a heading, list, or other block element
        if (trimmed.match(/^<(h[1-6]|ul|ol|li)/)) {
          return trimmed;
        }
        return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
      })
      .join("\n")
  );
}
