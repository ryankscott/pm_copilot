import { describe, it, expect } from "vitest";
import { buildSchemaFromTemplate } from "../src/templateSchema";
import { Template } from "../src/generated";

const sampleTemplate: Template = {
  id: "sample",
  title: "Feature PRD",
  description: "Template for new feature PRDs",
  category: "product",
  sections: [
    {
      id: "s1",
      name: "Problem Statement",
      description: "Describe the problem we're solving",
      required: true,
      order: 1,
    },
    {
      id: "s2",
      name: "Solution Overview",
      description: "High-level overview of the solution",
      required: true,
      order: 2,
    },
    {
      id: "s3",
      name: "Metrics",
      description: "Success metrics",
      required: false,
      order: 3,
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("buildSchemaFromTemplate", () => {
  it("accepts valid PRD content that satisfies required sections", () => {
    const schema = buildSchemaFromTemplate(sampleTemplate);

    const validData = {
      title: "Login Feature",
      summary: "Enable users to login via email/password",
      sections: [
        { title: "Problem Statement", content: "Users need to authenticate." },
        {
          title: "Solution Overview",
          content: "Implement email/password login.",
        },
        { title: "Metrics", content: ">90% login success rate" },
      ],
    };

    expect(() => schema.parse(validData)).not.toThrow();
  });

  it("rejects content missing required sections", () => {
    const schema = buildSchemaFromTemplate(sampleTemplate);

    const invalidData = {
      title: "Missing Problem Statement",
      sections: [{ title: "Solution Overview", content: "..." }],
    };

    expect(() => schema.parse(invalidData)).toThrow();
  });
});
