/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FeedbackHistoryItem } from './FeedbackHistoryItem';
export type FeedbackHistoryResponse = {
    /**
     * Whether the request was successful
     */
    success?: boolean;
    /**
     * Array of feedback history items
     */
    data?: Array<FeedbackHistoryItem>;
    /**
     * Pagination information
     */
    pagination?: {
        /**
         * Number of items per page
         */
        limit?: number;
        /**
         * Number of items skipped
         */
        offset?: number;
        /**
         * Total number of feedback items
         */
        total?: number;
    };
};

