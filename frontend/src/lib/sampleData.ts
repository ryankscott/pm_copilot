import type { PRD } from "@/types";

export const samplePRDs: PRD[] = [
  {
    id: "0",
    title: "User Authentication System",
    content: `# User Authentication System PRD

## Problem Statement
Our application currently lacks a secure user authentication system, preventing us from providing personalized experiences and protecting user data. Users have expressed concerns about data security and the inability to save their work.

## Target Audience
- Primary: New users seeking to create accounts
- Secondary: Existing users wanting secure access
- Tertiary: Administrators managing user access

## Goals
- Implement secure login/signup functionality
- Reduce unauthorized access by 100%
- Improve user retention by 30%
- Enable personalized user experiences

## User Stories
- As a new user, I want to create an account so that I can save my work
- As a returning user, I want to log in securely so that I can access my data
- As an admin, I want to manage user permissions so that I can control access

## Functional Requirements
1. Email/password registration
2. Social login options (Google, GitHub)
3. Password reset functionality
4. Email verification
5. Session management

## Success Metrics
- User registration rate: >60% of visitors
- Login success rate: >95%
- Password reset completion: >80%`,
    createdAt: "2024-12-01T00:00:00.000Z",
    updatedAt: "2024-12-15T00:00:00.000Z",
  },
  {
    id: "1",
    title: "Mobile App Dashboard",
    content: `# Mobile App Dashboard PRD

## Problem Statement
Users need a centralized view of their key metrics and recent activity when using our mobile application. Currently, information is scattered across multiple screens.

## Target Audience
- Mobile app users (primary)
- Business users tracking KPIs
- Power users managing multiple projects

## Goals
- Centralize important information in one view
- Reduce time to find key metrics by 50%
- Improve mobile user engagement by 25%

## Features
- Customizable widget system
- Real-time data updates
- Quick action buttons
- Offline mode support`,
    createdAt: "2024-11-20T00:00:00.000Z",
    updatedAt: "2024-12-10T00:00:00.000Z",
  },
];
