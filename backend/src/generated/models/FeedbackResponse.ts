/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type FeedbackResponse = {
    /**
     * Whether the feedback was successfully submitted
     */
    success?: boolean;
    /**
     * Response message
     */
    message?: string;
    /**
     * Analytics data for the submitted feedback
     */
    analytics?: {
        /**
         * The trace ID that was rated
         */
        traceId?: string;
        /**
         * The generation ID that was rated
         */
        generationId?: string;
        /**
         * The rating that was submitted
         */
        rating?: number;
        /**
         * Number of categories selected
         */
        categoriesCount?: number;
    };
};

