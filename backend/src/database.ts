import sqlite3 from "sqlite3";

// Small promise helpers for sqlite3
const run = (
  db: sqlite3.Database,
  sql: string,
  params: ReadonlyArray<unknown> = []
): Promise<void> =>
  new Promise((resolve, reject) => {
    db.run(sql, params as never, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });

const get = <T>(
  db: sqlite3.Database,
  sql: string,
  params: ReadonlyArray<unknown> = []
): Promise<T> =>
  new Promise((resolve, reject) => {
    db.get(sql, params as never, (err, row) => {
      if (err) return reject(err);
      resolve(row as T);
    });
  });

const openDatabase = (filepath: string): Promise<sqlite3.Database> =>
  new Promise((resolve, reject) => {
    const db = new sqlite3.Database(filepath, (err) => {
      if (err) return reject(err);
      resolve(db);
    });
  });

export const initDB = async (filepath: string): Promise<sqlite3.Database> => {
  const db = await openDatabase(filepath);

  // Keep table creation order identical to original implementation
  await run(
    db,
    `CREATE TABLE IF NOT EXISTS prds (
          id TEXT PRIMARY KEY,
          title TEXT,
          content TEXT,
          template_id TEXT,
          created_at DATETIME,
          updated_at DATETIME,
          FOREIGN KEY (template_id) REFERENCES templates (id) ON DELETE SET NULL
        )`
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS interactive_sessions (
              id TEXT PRIMARY KEY,
              prd_id TEXT,
              conversation_history TEXT,
              settings TEXT,
              created_at DATETIME,
              updated_at DATETIME,
              FOREIGN KEY (prd_id) REFERENCES prds (id) ON DELETE CASCADE
            )`
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS templates (
                        id TEXT PRIMARY KEY,
                        title TEXT NOT NULL,
                        description TEXT NOT NULL,
                        is_custom BOOLEAN DEFAULT FALSE,
                        created_at DATETIME,
                        updated_at DATETIME
                      )`
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS template_sections (
                              id TEXT PRIMARY KEY,
                              template_id TEXT NOT NULL,
                              name TEXT NOT NULL,
                              description TEXT NOT NULL,
                              placeholder TEXT,
                              required BOOLEAN DEFAULT FALSE,
                              order_index INTEGER NOT NULL,
                              FOREIGN KEY (template_id) REFERENCES templates (id) ON DELETE CASCADE
                            )`
  );

  await insertPredefinedTemplates(db);

  return db;
};

// Function to insert predefined templates
const insertPredefinedTemplates = async (
  db: sqlite3.Database
): Promise<void> => {
  // Check if templates already exist
  const row = await get<{ count: number }>(
    db,
    "SELECT COUNT(*) as count FROM templates",
    []
  );

  if (row && row.count > 0) {
    // Templates already exist, skip insertion
    return;
  }

  const now = new Date().toISOString();

  const templates = [
    {
      id: "feature-prd-template",
      title: "Feature PRD Template",
      description: "Comprehensive template for new feature development",
      sections: [
        {
          id: "exec-summary",
          name: "Executive Summary",
          description:
            "Brief overview of the feature, its purpose, and expected impact",
          placeholder: "Provide a high-level summary of the feature...",
          required: true,
          order: 1,
        },
        {
          id: "problem-statement",
          name: "Problem Statement",
          description: "Clear description of the problem this feature solves",
          placeholder: "What specific problem are we trying to solve?",
          required: true,
          order: 2,
        },
        {
          id: "target-audience",
          name: "Target Audience",
          description:
            "Who will use this feature and what are their characteristics",
          placeholder: "Define the primary and secondary users...",
          required: true,
          order: 3,
        },
        {
          id: "success-metrics",
          name: "Success Metrics",
          description:
            "What are the key metrics and values that you want to change by building this feature",
          placeholder: "Define measurable success criteria...",
          required: true,
          order: 4,
        },
        {
          id: "user-stories",
          name: "User Stories",
          description: "Detailed user stories with acceptance criteria",
          placeholder: "As a [user type], I want [goal] so that [benefit]...",
          required: true,
          order: 5,
        },
        {
          id: "functional-requirements",
          name: "Functional Requirements",
          description: "Detailed functional requirements and specifications",
          placeholder: "List all functional requirements...",
          required: true,
          order: 6,
        },
        {
          id: "technical-considerations",
          name: "Technical Considerations",
          description:
            "Technical constraints, dependencies, and implementation details",
          placeholder: "Describe technical requirements and constraints...",
          required: false,
          order: 7,
        },
        {
          id: "timeline",
          name: "Timeline & Milestones",
          description: "Project timeline with key milestones and deliverables",
          placeholder: "Define project phases and timeline...",
          required: false,
          order: 8,
        },
        {
          id: "open-questions",
          name: "Open Questions/Assumptions",
          description:
            "Outstanding questions, assumptions, and items requiring further investigation",
          placeholder: "List open questions and key assumptions...",
          required: false,
          order: 9,
        },
      ],
    },
    {
      id: "api-integration-template",
      title: "API Integration Template",
      description: "Template for API integration and backend service PRDs",
      sections: [
        {
          id: "integration-overview",
          name: "Integration Overview",
          description: "High-level overview of the API integration",
          placeholder: "Describe the API integration purpose and scope...",
          required: true,
          order: 1,
        },
        {
          id: "api-specifications",
          name: "API Specifications",
          description: "Detailed API endpoints, methods, and data structures",
          placeholder: "Document API endpoints and data formats...",
          required: true,
          order: 2,
        },
        {
          id: "authentication",
          name: "Authentication & Security",
          description: "Authentication methods and security considerations",
          placeholder: "Describe authentication requirements...",
          required: true,
          order: 3,
        },
        {
          id: "error-handling",
          name: "Error Handling",
          description: "How errors should be handled and communicated",
          placeholder: "Define error handling strategies...",
          required: true,
          order: 4,
        },
        {
          id: "performance-requirements",
          name: "Performance Requirements",
          description: "Performance expectations and SLA requirements",
          placeholder: "Define performance and reliability requirements...",
          required: true,
          order: 5,
        },
        {
          id: "testing-strategy",
          name: "Testing Strategy",
          description: "Testing approach and validation criteria",
          placeholder: "Describe testing methodology...",
          required: false,
          order: 6,
        },
      ],
    },
    {
      id: "ux-improvement-template",
      title: "UX Improvement Template",
      description: "Template for user experience improvement initiatives",
      sections: [
        {
          id: "current-experience",
          name: "Current Experience",
          description:
            "Analysis of the current user experience and pain points",
          placeholder: "Describe the current user experience...",
          required: true,
          order: 1,
        },
        {
          id: "user-research",
          name: "User Research",
          description: "Research findings and user feedback",
          placeholder: "Summarize user research and insights...",
          required: true,
          order: 2,
        },
        {
          id: "proposed-solution",
          name: "Proposed Solution",
          description: "Detailed description of the proposed UX improvements",
          placeholder: "Describe the proposed UX changes...",
          required: true,
          order: 3,
        },
        {
          id: "design-mockups",
          name: "Design Mockups",
          description: "Visual designs and wireframes",
          placeholder: "Reference design files and mockups...",
          required: false,
          order: 4,
        },
        {
          id: "impact-assessment",
          name: "Impact Assessment",
          description:
            "Expected impact on user satisfaction and business metrics",
          placeholder: "Assess the expected impact...",
          required: true,
          order: 5,
        },
        {
          id: "implementation-plan",
          name: "Implementation Plan",
          description: "Step-by-step implementation approach",
          placeholder: "Define implementation phases...",
          required: true,
          order: 6,
        },
      ],
    },
  ];

  // Insert templates and sections serially for clarity and reliability
  for (const template of templates) {
    await run(
      db,
      "INSERT INTO templates (id, title, description, is_custom, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      [template.id, template.title, template.description, false, now, now]
    );

    for (const section of template.sections) {
      await run(
        db,
        "INSERT INTO template_sections (id, template_id, name, description, placeholder, required, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          section.id,
          template.id,
          section.name,
          section.description,
          section.placeholder,
          section.required,
          section.order,
        ]
      );
    }
  }
};
