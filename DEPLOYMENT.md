# 🚀 ChatPRD Deployment Guide

## Quick Deployment to Vercel (Recommended)

### Prerequisites
- GitHub account
- Vercel account (free)
- OpenAI API key

### Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial ChatPRD setup"
   git remote add origin https://github.com/yourusername/chatprd.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect it's a Vite project

3. **Add Environment Variables**
   - In Vercel project settings, go to "Environment Variables"
   - Add: `OPENAI_API_KEY` = `your_openai_api_key_here`
   - Redeploy the project

4. **Update API Endpoint**
   - The API route at `src/app/api/chat/route.ts` will work automatically
   - Update AIAssistant.tsx to use real API instead of mock

### Alternative: Local Development with Backend

1. **Run a local API server**
   ```bash
   npm install express cors dotenv
   ```

2. **Create server.js**
   ```javascript
   const express = require('express');
   const cors = require('cors');
   require('dotenv').config();
   
   const app = express();
   app.use(cors());
   app.use(express.json());
   
   // Your API endpoints here
   
   app.listen(3001, () => {
     console.log('API server running on port 3001');
   });
   ```

3. **Update frontend to use local API**
   ```typescript
   const response = await fetch('http://localhost:3001/api/chat', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ messages, mode, currentContent })
   });
   ```

## Features Included

✅ **Complete PRD Management**
- Create, edit, save, delete PRDs
- Auto-save functionality
- Professional PRD templates

✅ **AI Assistant (Demo Mode)**
- Improve Mode: Enhance PRD content
- Critique Mode: Get detailed feedback  
- Chat Mode: Interactive Q&A
- Mock responses for demonstration

✅ **Modern UI/UX**
- Clean, professional interface
- Responsive design
- Tailwind CSS styling
- Lucide React icons

✅ **Production Ready**
- TypeScript for type safety
- Optimized builds with Vite
- ESLint configuration
- Deployment ready

## Next Steps

1. **Get OpenAI API Key**: https://platform.openai.com/api-keys
2. **Deploy to Vercel**: Follow the deployment guide above
3. **Customize**: Modify prompts and styling to your needs
4. **Scale**: Add user authentication, database storage, etc.

---

**🎉 Your ChatPRD application is ready to use!**
