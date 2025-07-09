# Langfuse Integration - Phase 1 Enhancements

This document describes the Phase 1 enhancements to the Langfuse integration for improved monitoring and analytics.

## Overview

Phase 1 focuses on enhancing the existing Langfuse integration with better error handling, session management, and comprehensive tracking capabilities.

## Key Features Implemented

### 1. Enhanced Error Handling

- **Retry Logic**: Automatic retry with exponential backoff for failed Langfuse operations
- **Error Classification**: Categorizes errors (connection, authentication, rate limit, validation, unknown)
- **Graceful Degradation**: Application continues working even if Langfuse is unavailable
- **Detailed Logging**: Comprehensive error logging with stack traces and context

### 2. Health Check System

- **Health Endpoint**: `/health/langfuse` endpoint for monitoring Langfuse connectivity
- **Cached Results**: Efficient health checks with configurable caching
- **Connection Monitoring**: Real-time status of Langfuse connection
- **Configuration Validation**: Checks for required environment variables

### 3. Enhanced Session Management

- **Consistent Session IDs**: Automatic generation of session IDs if not provided
- **Session Metadata**: Extended metadata tracking for user sessions
- **Cross-Request Tracking**: Maintains session context across multiple API calls

### 4. Comprehensive Event Tracking

- **Custom Events**: Track application-specific events (generation started/completed, errors)
- **Performance Metrics**: Detailed timing and token usage tracking
- **User Actions**: Track user interactions and feedback submissions
- **Error Analytics**: Comprehensive error tracking with context

### 5. Enhanced Trace Metadata

- **Rich Context**: Detailed metadata for each trace including model parameters
- **Prompt Analytics**: Track prompt lengths, conversation turns, and content types
- **Provider Information**: Track which AI provider and model was used
- **Timing Information**: Precise timing data for performance analysis

## Configuration

### Environment Variables

```bash
# Required for Langfuse integration
LANGFUSE_PUBLIC_KEY=your_public_key
LANGFUSE_SECRET_KEY=your_secret_key
LANGFUSE_HOST=https://cloud.langfuse.com  # Optional, defaults to cloud

# Optional configuration
NODE_ENV=development  # Enables detailed logging
```

### Configuration Options

The system supports various configuration options:

```typescript
interface LangfuseConfig {
  maxRetries: number;           // Default: 3
  retryDelay: number;          // Default: 1000ms
  healthCheckInterval: number;  // Default: 30000ms
  enableDetailedLogging: boolean; // Default: NODE_ENV === 'development'
}
```

## API Endpoints

### Health Check
```
GET /health/langfuse
```

Returns the current health status of Langfuse integration:

```json
{
  "status": "healthy",
  "enabled": true,
  "healthy": true,
  "lastHealthCheck": "2024-01-01T12:00:00.000Z",
  "configuration": {
    "baseUrl": "https://cloud.langfuse.com",
    "hasPublicKey": true,
    "hasSecretKey": true
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Enhanced Feedback Submission
```
POST /feedback
```

Enhanced feedback submission with performance tracking:

```json
{
  "traceId": "trace_123",
  "generationId": "gen_456",
  "score": 1,
  "comment": "Great response!"
}
```

## Tracked Events

### Automatic Events

1. **prd_generation_started** - When PRD generation begins
2. **prd_generation_completed** - When PRD generation succeeds
3. **prd_generation_error** - When PRD generation fails
4. **prd_critique_started** - When PRD critique begins
5. **prd_critique_completed** - When PRD critique succeeds
6. **prd_critique_error** - When PRD critique fails
7. **feedback_submitted** - When user submits feedback
8. **feedback_submission_error** - When feedback submission fails

### Performance Metrics

1. **generation_time** - Time taken for content generation
2. **critique_time** - Time taken for critique generation
3. **token_usage** - Token consumption metrics
4. **feedback_submission_time** - Time taken to submit feedback

## Usage Examples

### Basic Usage

The enhanced Langfuse integration works automatically with existing code. No changes required for basic functionality.

### Custom Event Tracking

```typescript
import { trackCustomEvent } from './langfuse';

// Track a custom event
await trackCustomEvent('user_action', {
  action: 'prd_created',
  prdId: 'prd_123',
  userId: 'user_456'
}, userId, sessionId);
```

### Performance Metrics

```typescript
import { trackPerformanceMetric } from './langfuse';

// Track a performance metric
await trackPerformanceMetric('api_response_time', 250, 'ms', {
  endpoint: '/api/generate',
  userId: 'user_123'
});
```

## Testing

Use the provided test script to verify the integration:

```bash
node test-langfuse.js
```

This will test:
- Health check endpoint
- PRD generation with Langfuse tracking
- Feedback submission
- Error handling

## Monitoring

### Key Metrics to Monitor

1. **Health Status**: Monitor the `/health/langfuse` endpoint
2. **Error Rates**: Track error events and types
3. **Performance**: Monitor generation times and token usage
4. **User Feedback**: Track feedback scores and comments
5. **Session Analytics**: Monitor user session patterns

### Langfuse Dashboard

In your Langfuse dashboard, you can now monitor:

- **Traces**: Detailed execution traces for each generation
- **Generations**: Individual AI model calls with full context
- **Scores**: User feedback and ratings
- **Events**: Custom application events
- **Performance**: Timing and token usage metrics

## Benefits

1. **Improved Reliability**: Robust error handling and retry logic
2. **Better Monitoring**: Comprehensive health checks and status monitoring
3. **Enhanced Analytics**: Detailed event tracking and performance metrics
4. **User Insights**: Better understanding of user behavior and satisfaction
5. **Operational Excellence**: Proactive monitoring and alerting capabilities

## Next Steps

Phase 1 provides the foundation for advanced monitoring. Future phases will include:

- Phase 2: Enhanced user feedback UI components
- Phase 3: Advanced performance analytics and custom dashboards
- Phase 4: User session analytics and behavior tracking
- Phase 5: A/B testing infrastructure
- Phase 6: Real-time monitoring and alerting systems

## Troubleshooting

### Common Issues

1. **Langfuse not enabled**: Check environment variables
2. **Health check failing**: Verify API keys and network connectivity
3. **Events not appearing**: Check Langfuse dashboard and flush operations
4. **Performance issues**: Monitor retry counts and error rates

### Debug Mode

Enable detailed logging by setting `NODE_ENV=development` to see comprehensive debug information. 