/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type FeedbackTrendsResponse = {
    /**
     * Whether the request was successful
     */
    success?: boolean;
    /**
     * Trend data points
     */
    data?: Array<{
        /**
         * Date for the trend data point
         */
        date?: string;
        /**
         * Number of positive feedback items for this date
         */
        positive?: number;
        /**
         * Number of negative feedback items for this date
         */
        negative?: number;
        /**
         * Total feedback items for this date
         */
        total?: number;
        /**
         * Average rating for this date
         */
        averageRating?: number;
    }>;
    /**
     * Period used for aggregation
     */
    period?: string;
    /**
     * Time range for the trends
     */
    timeRange?: string;
    /**
     * When the trends were generated
     */
    generatedAt?: string;
};

