import type { PRD } from "@/types";

export const samplePRDs: PRD[] = [
  {
    id: "0",
    title: "User Authentication System",
    content: `<h1>User Authentication System PRD</h1>

<h2>Problem Statement</h2>
<p>Our application currently lacks a secure user authentication system, preventing us from providing personalized experiences and protecting user data. Users have expressed concerns about data security and the inability to save their work.</p>

<h2>Target Audience</h2>
<ul>
<li>Primary: New users seeking to create accounts</li>
<li>Secondary: Existing users wanting secure access</li>
<li>Tertiary: Administrators managing user access</li>
</ul>

<h2>Goals</h2>
<ul>
<li>Implement secure login/signup functionality</li>
<li>Reduce unauthorized access by 100%</li>
<li>Improve user retention by 30%</li>
<li>Enable personalized user experiences</li>
</ul>

<h2>User Stories</h2>
<ul>
<li>As a new user, I want to create an account so that I can save my work</li>
<li>As a returning user, I want to log in securely so that I can access my data</li>
<li>As an admin, I want to manage user permissions so that I can control access</li>
</ul>

<h2>Functional Requirements</h2>
<ol>
<li>Email/password registration</li>
<li>Social login options (Google, GitHub)</li>
<li>Password reset functionality</li>
<li>Email verification</li>
<li>Session management</li>
</ol>

<h2>Success Metrics</h2>
<ul>
<li>User registration rate: >60% of visitors</li>
<li>Login success rate: >95%</li>
<li>Password reset completion: >80%</li>
</ul>`,
    createdAt: "2024-12-01T00:00:00.000Z",
    updatedAt: "2024-12-15T00:00:00.000Z",
  },
  {
    id: "1",
    title: "Mobile App Dashboard",
    content: `<h1>Mobile App Dashboard PRD</h1>

<h2>Problem Statement</h2>
<p>Users need a centralized view of their key metrics and recent activity when using our mobile application. Currently, information is scattered across multiple screens.</p>

<h2>Target Audience</h2>
<ul>
<li>Mobile app users (primary)</li>
<li>Business users tracking KPIs</li>
<li>Power users managing multiple projects</li>
</ul>

<h2>Goals</h2>
<ul>
<li>Centralize important information in one view</li>
<li>Reduce time to find key metrics by 50%</li>
<li>Improve mobile user engagement by 25%</li>
</ul>

<h2>Features</h2>
<ul>
<li>Customizable widget system</li>
<li>Real-time data updates</li>
<li>Quick action buttons</li>
<li>Offline mode support</li>
</ul>`,
    createdAt: "2024-11-20T00:00:00.000Z",
    updatedAt: "2024-12-10T00:00:00.000Z",
  },
];
