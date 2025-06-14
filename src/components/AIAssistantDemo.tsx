import { useState } from 'react'
import { Button } from './ui/button'
import { X, Send, Sparkles, MessageSquare, CheckCircle } from 'lucide-react'

interface AIAssistantProps {
  currentContent: string
  onImprovement: (content: string) => void
  onClose: () => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

type AssistantMode = 'improve' | 'critique' | 'chat'

export function AIAssistant({ 
  currentContent, 
  onImprovement, 
  onClose, 
  isLoading, 
  setIsLoading 
}: AIAssistantProps) {
  const [mode, setMode] = useState<AssistantMode>('improve')
  const [response, setResponse] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])
  const [customPrompt, setCustomPrompt] = useState('')

  const handleAIRequest = async () => {
    if (!currentContent.trim() && mode !== 'chat') {
      alert('Please add some content to your PRD first')
      return
    }

    setIsLoading(true)
    setResponse('')

    // Simulate AI processing
    setTimeout(() => {
      let mockResponse = ''
      
      switch (mode) {
        case 'improve':
          mockResponse = `# Improved Product Requirements Document

## Executive Summary
This PRD outlines the development of [Product Name], addressing key user needs and business objectives.

## Problem Statement
${currentContent.includes('Problem') ? 'Enhanced problem definition based on your existing content...' : 'Define the core problem this product solves for users and the business.'}

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

## Success Metrics
- User adoption rate: Target X% within Y months
- Task completion rate improvement
- User satisfaction score

## Timeline
- Phase 1: Foundation (Weeks 1-4)
- Phase 2: Core features (Weeks 5-8)
- Phase 3: Launch (Weeks 9-12)

---
${currentContent}`
          break
          
        case 'critique':
          mockResponse = `## PRD Critique

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
Good foundation but needs enhancement in key areas to meet professional PRD standards.`
          break
          
        case 'chat':
          mockResponse = `Great question! Here are some suggestions for your PRD:

**For your current document:**
- Consider adding specific user personas and their pain points
- Define measurable success metrics (e.g., "increase user engagement by 25%")
- Include technical constraints and dependencies
- Add risk assessment with mitigation strategies

**Best Practices:**
- Start with the problem you're solving, not the solution
- Use the MoSCoW method for prioritization
- Include both happy path and edge case scenarios
- Define what success looks like quantitatively

Would you like me to help you elaborate on any of these areas?`
          
          setChatHistory(prev => [
            ...prev,
            { role: 'user', content: customPrompt },
            { role: 'assistant', content: mockResponse }
          ])
          setCustomPrompt('')
          break
      }
      
      setResponse(mockResponse)
      setIsLoading(false)
    }, 2000)
  }

  const applyImprovement = () => {
    if (mode === 'improve' && response) {
      onImprovement(response)
      setResponse('')
    }
  }

  return (
    <div className="w-96 border-l border-gray-200 bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">AI Assistant</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Mode Selection */}
        <div className="flex space-x-1">
          <Button
            variant={mode === 'improve' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('improve')}
          >
            <Sparkles className="w-3 h-3" />
            Improve
          </Button>
          <Button
            variant={mode === 'critique' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('critique')}
          >
            <CheckCircle className="w-3 h-3" />
            Critique
          </Button>
          <Button
            variant={mode === 'chat' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('chat')}
          >
            <MessageSquare className="w-3 h-3" />
            Chat
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4">
        {mode === 'chat' && (
          <div className="flex-1 mb-4 overflow-y-auto">
            <div className="space-y-3">
              {chatHistory.map((message, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg \${
                    message.role === 'user'
                      ? 'bg-blue-100 text-blue-900 ml-4'
                      : 'bg-gray-100 text-gray-900 mr-4'
                  }`}
                >
                  <div className="text-xs font-medium mb-1">
                    {message.role === 'user' ? 'You' : 'AI Assistant'}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {mode === 'chat' && (
          <div className="space-y-2 mb-4">
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Ask me anything about your PRD..."
              className="w-full h-20 p-2 border border-gray-300 rounded resize-none text-sm"
            />
          </div>
        )}

        <Button
          onClick={handleAIRequest}
          disabled={isLoading || (mode === 'chat' && !customPrompt.trim())}
          className="mb-4"
        >
          <Send className="w-4 h-4" />
          {mode === 'improve' && 'Improve PRD'}
          {mode === 'critique' && 'Get Critique'}
          {mode === 'chat' && 'Send Message'}
        </Button>

        {/* Response */}
        {(response || isLoading) && (
          <div className="flex-1 border border-gray-200 rounded-lg p-3 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">Processing...</span>
              </div>
            ) : (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-2">AI Response:</div>
                <div className="text-sm text-gray-900 whitespace-pre-wrap">{response}</div>
                {mode === 'improve' && response && (
                  <Button
                    onClick={applyImprovement}
                    size="sm"
                    className="mt-3"
                  >
                    Apply Changes
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
