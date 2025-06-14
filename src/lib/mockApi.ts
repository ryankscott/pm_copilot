// Mock API for development - replace with real backend
export async function POST(request: Request) {
  try {
    const { mode, currentContent } = await request.json();

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    let responseText = "";

    switch (mode) {
      case "improve":
        responseText = `# Improved Product Requirements Document

## Executive Summary
This PRD outlines the requirements for [Product Name], addressing key user needs and business objectives.

## Problem Statement
${
  currentContent.includes("Problem")
    ? "Building upon your existing problem definition..."
    : "Define the core problem this product solves for users and the business."
}

## Target Audience
### Primary Users
- User Segment 1: [Define characteristics and needs]
- User Segment 2: [Define characteristics and needs]

## Goals and Objectives
### Business Objectives
- Increase user engagement by X%
- Drive revenue growth within timeframe
- Reduce operational costs

### User Objectives  
- Improve task completion efficiency
- Enhance user satisfaction
- Reduce friction in workflows

## User Stories
- As a [user type], I want to [action] so that [benefit]
- As a [user type], I want to [action] so that [benefit]

## Functional Requirements
### Core Features
1. **Feature 1**: Description and acceptance criteria
2. **Feature 2**: Description and acceptance criteria

## Non-functional Requirements
- Performance: Response time < 2 seconds
- Security: Data encryption and authentication
- Scalability: Support for concurrent users
- Accessibility: WCAG compliance

## Success Metrics
- User adoption rate
- Task completion rate
- User satisfaction score

## Timeline
- Phase 1: Foundation (Weeks 1-4)
- Phase 2: Core features (Weeks 5-8)
- Phase 3: Launch (Weeks 9-12)

---
${currentContent}`;
        break;

      case "critique":
        responseText = `## PRD Critique

### Strengths ✅
- Clear structure and organization
- Good use of sections and formatting

### Areas for Improvement 📋
1. **Success Metrics**: Add measurable KPIs and success criteria
2. **User Stories**: Include detailed user stories with acceptance criteria  
3. **Technical Requirements**: Define performance, security, and scalability needs
4. **Risk Assessment**: Identify potential risks and mitigation strategies
5. **Dependencies**: List technical and business dependencies

### Missing Elements ⚠️
- Target audience definition
- Competitive analysis
- Resource requirements
- Detailed timeline with milestones

### Recommendations 💡
1. Start with a clear problem statement
2. Define specific user personas
3. Add quantifiable success metrics
4. Include technical architecture considerations
5. Create detailed acceptance criteria for each feature

### Overall Assessment
Good foundation but needs enhancement in key areas to meet professional PRD standards.`;
        break;

      default:
        responseText = `I'm here to help with your PRD! Here are some suggestions:

**For your current document:**
- Consider adding specific user personas
- Define measurable success metrics
- Include technical constraints
- Add risk assessment

**Best Practices:**
- Start with the problem, not the solution
- Use acceptance criteria for features
- Include both functional and non-functional requirements
- Define what success looks like quantitatively

How can I help you improve your PRD further?`;
    }

    // Return streaming response (simplified for demo)
    return new Response(responseText, {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return new Response("Error processing request", { status: 500 });
  }
}
