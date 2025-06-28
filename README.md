# PMCoPilot - AI-Powered Product Requirements Document Manager

A modern React application for creating, editing, and improving Product Requirements Documents (PRDs) with AI assistance. Built with React, TypeScript, Vite, Tailwind CSS, and the Vercel AI SDK.

## Features

### 📝 PRD Management
- **Create**: Start new PRDs with a structured template
- **Edit**: Rich text editor with auto-save functionality
- **Organize**: Sidebar list view with search and filtering
- **Delete**: Remove unwanted PRDs with confirmation

### 🤖 AI Assistant (Multi-Provider Support)
- **Multiple AI Providers**: Choose between OpenAI, Anthropic Claude, Google Gemini, or Ollama
- **Rich Markdown Rendering**: AI responses display with proper formatting, syntax highlighting, and typography
- **Improve Mode**: Enhance your PRD with better structure, missing sections, and professional language
- **Critique Mode**: Get detailed feedback on what's missing and what could be improved
- **Chat Mode**: Interactive Q&A about your PRD and general product management guidance
- **Provider Settings**: Easy switching between AI providers through the settings panel

### 💼 Professional PRD Structure
Automatically suggests and helps you include:
- Executive Summary
- Problem Statement
- Target Audience & User Personas
- Goals & Objectives
- User Stories with Acceptance Criteria
- Functional & Non-functional Requirements
- Success Metrics & KPIs
- Technical Considerations
- Timeline & Milestones
- Risk Assessment
- Dependencies & Assumptions

### 🔐 API Key Management
- **UI-Based Configuration**: Enter API keys directly in the application settings
- **Real-time Validation**: Test API keys to ensure they work before saving
- **Secure Storage**: API keys are stored locally in your browser (localStorage)
- **Privacy-First**: Keys are never sent to our servers - only to the respective AI providers
- **Multi-Provider Support**: Configure keys for OpenAI, Anthropic Claude, Google Gemini, or Ollama
- **Visual Status**: Green indicators show which providers are properly configured
- **No File Management**: No need to create or manage `.env.local` files

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI primitives with custom styling
- **AI Integration**: Vercel AI SDK with multiple provider support:
  - OpenAI (GPT-4, GPT-3.5)
  - Anthropic Claude (Claude 3.5 Sonnet, Haiku)
  - Google Gemini (Gemini Pro, Flash)
  - Ollama (Local models)
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Build Tool**: Vite
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- API key for your chosen AI provider:
  - OpenAI API key (default)
  - Anthropic API key (for Claude)
  - Google API key (for Gemini)
  - Ollama installation (for local models)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AI_SDLC
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start the development server**
   ```bash
   pnpm run dev
   ```

4. **Configure AI Provider**
   
   The application now features a modern, user-friendly settings interface:
   
   - Open your browser and navigate to `http://localhost:5173`
   - Click the Settings ⚙️ button in the top-right corner
   - Choose your preferred AI provider
   - Enter your API key for the selected provider
   - Click "Test" to verify your key works with the provider
   - Save your settings - you'll see a green success confirmation
   - Green dots indicate which providers are properly configured
   
   **Supported Providers:**
   - **OpenAI**: Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - **Anthropic Claude**: Get your API key from [Anthropic Console](https://console.anthropic.com/)
   - **Google Gemini**: Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - **Ollama**: Install [Ollama](https://ollama.ai/) locally (no API key required)

   > **Legacy Support**: For server deployments or backwards compatibility, you can still use environment variables by creating a `.env.local` file. The UI configuration takes priority when both are present.

### Building for Production

```bash
pnpm run build
```

## Usage Guide

### Creating Your First PRD

1. **Click "New PRD"** in the sidebar
2. **Add a title** - Be specific about your product or feature
3. **Start with the problem** - What user problem are you solving?
4. **Use the AI Assistant** to expand and improve your content

### AI Assistant Modes

#### 🔮 Improve Mode
- Enhances existing content
- Adds missing sections
- Improves clarity and structure
- Makes language more professional
- Click "Apply Changes" to update your PRD

#### ✅ Critique Mode
- Identifies strengths and weaknesses
- Points out missing sections
- Suggests specific improvements
- Provides actionable recommendations

#### 💬 Chat Mode
- Ask questions about PRD best practices
- Get help with specific sections
- Brainstorm ideas and solutions
- Persistent conversation history

## API Configuration

### Environment Variables

Create a `.env.local` file:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### Changing AI Providers

Click the settings gear icon (⚙️) in the top-right corner to:
- Choose between OpenAI, Claude, Gemini, or Ollama
- View setup instructions for each provider
- Switch providers without restarting the app

**Supported Providers:**
- **OpenAI**: GPT-4, GPT-3.5 models
- **Anthropic Claude**: Claude 3.5 Sonnet, Haiku models  
- **Google Gemini**: Gemini Pro, Flash models
- **Ollama**: Local models (llama3.1, llama2, etc.)

The selected provider is automatically saved to localStorage and used for all AI operations.

### Setting Up Real AI Integration

**The app will automatically use real AI when you:**

1. **Add API keys** to your `.env.local` file
2. **Select a provider** in the settings
3. **Restart the development server**

```bash
# Example .env.local with multiple providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=AI...
OLLAMA_BASE_URL=http://localhost:11434
```

#### Option 1: Deploy with Vercel (Recommended)

1. **Deploy to Vercel**
   ```bash
   npx vercel
   ```

2. **Add your OpenAI API key** in Vercel dashboard:
   - Go to your project settings
   - Add environment variable: `OPENAI_API_KEY=your_key_here`

3. **The API route will work automatically** at `/api/chat`

#### Option 2: Custom Backend Setup

1. **Create a backend API server** (Express.js example):
   ```javascript
   // server.js
   import express from 'express'
   import { openai } from '@ai-sdk/openai'
   import { streamText } from 'ai'
   
   const app = express()
   app.use(express.json())
   
   app.post('/api/chat', async (req, res) => {
     const { messages, mode, currentContent } = req.body
     
     const result = await streamText({
       model: openai('gpt-4o-mini'),
       messages,
       system: getSystemPrompt(mode), // Your custom prompts
     })
     
     result.pipeDataStreamToResponse(res)
   })
   
   app.listen(3001)
   ```

2. **Update the frontend** to point to your backend:
   ```typescript
   // In AIAssistant.tsx, replace the mock with:
   const { messages, input, handleSubmit } = useChat({
     api: 'http://localhost:3001/api/chat', // Your backend
     body: { mode, currentContent }
   })
   ```

#### Option 3: Serverless Functions

Deploy the existing `src/app/api/chat/route.ts` to any serverless platform:
- **Vercel Functions** (recommended)
- **Netlify Functions** 
- **AWS Lambda**
- **Cloudflare Workers**

## Project Structure

```
src/
├── app/api/chat/route.ts        # AI API endpoint
├── components/
│   ├── AIAssistant.tsx          # AI sidebar component
│   ├── PRDEditor.tsx            # Main editor component
│   ├── PRDList.tsx              # Sidebar PRD list
│   └── ui/button.tsx            # UI components
├── App.tsx                      # Main app component
└── main.tsx                     # App entry point
```

## License

MIT License

### 📝 Rich Markdown Rendering

The AI Assistant provides responses with full markdown formatting support:

- **Headers**: H1, H2, H3 with proper hierarchy and styling
- **Lists**: Bulleted and numbered lists with nested support
- **Code Blocks**: Syntax highlighting for JavaScript, Python, CSS, TypeScript, and more
- **Inline Code**: Styled code snippets with `monospace` formatting
- **Emphasis**: **Bold** and *italic* text formatting
- **Links**: Clickable links with hover effects
- **Tables**: Structured data with borders and headers
- **Blockquotes**: Styled quotations with left borders
- **Horizontal Rules**: Section dividers

All AI-generated content maintains proper formatting when applied to your PRD, making it easy to create professional, well-structured documents.

### 🎨 Modern UI & Theme Support

- **Sleek Interface**: A clean, minimalist design for distraction-free writing
- **Dark Mode**: Aesthetic and eye-friendly dark theme
- **Responsive Layout**: Optimized for both desktop and mobile views
- **Customizable Themes**: Switch between multiple pre-defined themes or create your own
- **Smooth Animations**: Subtle animations for transitions and interactions
