/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type FeedbackAnalyticsResponse = {
    /**
     * Whether the request was successful
     */
    success?: boolean;
    /**
     * Analytics data
     */
    data?: {
        /**
         * Total number of feedback items
         */
        totalFeedback?: number;
        /**
         * Number of positive feedback items (rating >= 4)
         */
        positiveCount?: number;
        /**
         * Number of negative feedback items (rating <= 2)
         */
        negativeCount?: number;
        /**
         * Percentage of positive feedback
         */
        positiveRate?: number;
        /**
         * Average rating across all feedback
         */
        averageRating?: number;
        /**
         * Most frequently selected feedback categories
         */
        topCategories?: Array<{
            /**
             * Category name
             */
            category?: string;
            /**
             * Number of times this category was selected
             */
            count?: number;
        }>;
        /**
         * Recent trend in feedback quality
         */
        recentTrend?: FeedbackAnalyticsResponse.recentTrend;
        /**
         * Time range for the analytics
         */
        timeRange?: string;
        /**
         * When the analytics were last updated
         */
        lastUpdated?: string;
    };
    /**
     * When the analytics were generated
     */
    generatedAt?: string;
};
export namespace FeedbackAnalyticsResponse {
    /**
     * Recent trend in feedback quality
     */
    export enum recentTrend {
        UP = 'up',
        DOWN = 'down',
        STABLE = 'stable',
    }
}

