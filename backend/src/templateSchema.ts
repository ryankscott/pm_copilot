import { z } from "zod";
import { Template } from "./generated";

/**
 * Build a Zod schema based on a Template definition.
 *
 * The schema validates that:
 *  - `sections` is an array of objects with `title` matching one of the template section names.
 *  - All required section titles are present.
 *
 * The root object always contains `title` (string) and an optional `summary` (string).
 */
export const buildSchemaFromTemplate = (template: Template) => {
  if (!template.sections || template.sections.length === 0) {
    // Fallback to a generic schema if the template has no sections defined.
    return z.object({
      title: z.string(),
      summary: z.string().optional(),
      sections: z.array(
        z.object({
          title: z.string(),
          content: z.string(),
        })
      ),
    });
  }

  // Extract section names and which ones are required
  const sectionNames = template.sections.map((s) => s.name);
  const requiredNames = template.sections
    .filter((s) => s.required)
    .map((s) => s.name);

  // Dynamically build an enum for section titles – z.enum needs at least one value.
  const TitleEnum = z.enum(sectionNames as [string, ...string[]]);

  const sectionSchema = z.object({
    title: TitleEnum,
    content: z.string(),
  });

  // Ensure every required section title appears in the output.
  const sectionsArraySchema = z.array(sectionSchema).refine(
    (sections) => {
      const titles = sections.map((s) => s.title);
      return requiredNames.every((req) => titles.includes(req));
    },
    {
      message: "Missing one or more required template sections",
    }
  );

  return z.object({
    title: z.string(),
    summary: z.string().optional(),
    sections: sectionsArraySchema,
  });
};
