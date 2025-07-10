import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utility function to convert snake_case objects to camelCase
export function toCamelCase<T extends Record<string, any>>(
  data: T | T[]
): T | T[] {
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => toCamelCase(item)) as T[];
  }

  // Handle objects
  if (data && typeof data === "object" && data !== null) {
    const camelCased: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      // Convert key from snake_case to camelCase
      const camelKey = key.replace(/_([a-z])/g, (_, char) =>
        char.toUpperCase()
      );

      // Recursively handle nested objects/arrays
      camelCased[camelKey] =
        value && typeof value === "object" ? toCamelCase(value) : value;
    }

    return camelCased as T;
  }

  // Return non-object values as is
  return data;
}
