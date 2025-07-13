/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type FeedbackRequest = {
    /**
     * Langfuse trace ID for the generation
     */
    traceId: string;
    /**
     * Langfuse generation ID for the specific response
     */
    generationId: string;
    /**
     * Rating from 1 (poor) to 5 (excellent)
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
};

