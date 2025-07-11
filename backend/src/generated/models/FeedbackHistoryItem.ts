/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type FeedbackHistoryItem = {
    /**
     * Unique feedback ID
     */
    id?: string;
    /**
     * Langfuse trace ID
     */
    traceId?: string;
    /**
     * Langfuse generation ID
     */
    generationId?: string;
    /**
     * Rating given
     */
    rating?: number;
    /**
     * Optional text feedback
     */
    comment?: string;
    /**
     * Feedback categories
     */
    categories?: Array<string>;
    /**
     * When the feedback was submitted
     */
    timestamp?: string;
    /**
     * AI model that generated the response
     */
    modelUsed?: string;
    /**
     * LLM provider used
     */
    provider?: string;
    /**
     * Preview of the AI response that was rated
     */
    responsePreview?: string;
};

