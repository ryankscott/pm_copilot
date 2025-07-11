/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CritiqueRequest } from '../models/CritiqueRequest';
import type { CritiqueResponse } from '../models/CritiqueResponse';
import type { FeedbackAnalyticsResponse } from '../models/FeedbackAnalyticsResponse';
import type { FeedbackHistoryResponse } from '../models/FeedbackHistoryResponse';
import type { FeedbackRequest } from '../models/FeedbackRequest';
import type { FeedbackResponse } from '../models/FeedbackResponse';
import type { FeedbackTrendsResponse } from '../models/FeedbackTrendsResponse';
import type { GenerateContentRequest } from '../models/GenerateContentRequest';
import type { GenerateContentResponse } from '../models/GenerateContentResponse';
import type { LLMModel } from '../models/LLMModel';
import type { LLMProviderConfig } from '../models/LLMProviderConfig';
import type { PRD } from '../models/PRD';
import type { SessionData } from '../models/SessionData';
import type { SessionSaveRequest } from '../models/SessionSaveRequest';
import type { SessionSaveResponse } from '../models/SessionSaveResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * Get all PRDs
     * @returns PRD A list of PRDs
     * @throws ApiError
     */
    public static getPrds(): CancelablePromise<Array<PRD>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/prds',
        });
    }
    /**
     * Create a new PRD
     * @param requestBody
     * @returns PRD The created PRD
     * @throws ApiError
     */
    public static postPrds(
        requestBody: PRD,
    ): CancelablePromise<PRD> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/prds',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get a PRD by ID
     * @param id
     * @returns PRD The PRD
     * @throws ApiError
     */
    public static getPrds1(
        id: string,
    ): CancelablePromise<PRD> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/prds/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `PRD not found`,
            },
        });
    }
    /**
     * Update a PRD by ID
     * @param id
     * @param requestBody
     * @returns PRD The updated PRD
     * @throws ApiError
     */
    public static putPrds(
        id: string,
        requestBody: PRD,
    ): CancelablePromise<PRD> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/prds/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `PRD not found`,
            },
        });
    }
    /**
     * Delete a PRD by ID
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static deletePrds(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/prds/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `PRD not found`,
            },
        });
    }
    /**
     * Generate AI content for a PRD
     * Generate content for a specific section of a PRD or enhance existing content using AI
     * @param id The ID of the PRD to generate content for
     * @param requestBody
     * @returns GenerateContentResponse Successfully generated content
     * @throws ApiError
     */
    public static postPrdsGenerate(
        id: string,
        requestBody: GenerateContentRequest,
    ): CancelablePromise<GenerateContentResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/prds/{id}/generate',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad request - invalid input parameters`,
                404: `PRD not found`,
                500: `Internal server error - AI generation failed`,
            },
        });
    }
    /**
     * Get AI critique and feedback for a PRD
     * Analyze an existing PRD and provide detailed critique, suggestions, and improvement recommendations
     * @param id The ID of the PRD to critique
     * @param requestBody
     * @returns CritiqueResponse Successfully generated critique
     * @throws ApiError
     */
    public static postPrdsCritique(
        id: string,
        requestBody: CritiqueRequest,
    ): CancelablePromise<CritiqueResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/prds/{id}/critique',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad request - invalid input parameters`,
                404: `PRD not found`,
                500: `Internal server error - AI critique failed`,
            },
        });
    }
    /**
     * Test LLM Provider Connection
     * Test if a provider configuration is working correctly
     * @param requestBody
     * @returns any Provider test successful
     * @throws ApiError
     */
    public static postTestProvider(
        requestBody: {
            provider: LLMProviderConfig;
            /**
             * Specific model to test
             */
            model?: string;
        },
    ): CancelablePromise<{
        /**
         * Whether the test was successful
         */
        success?: boolean;
        /**
         * The provider that was tested
         */
        provider?: string;
        /**
         * The model that was tested
         */
        model?: string;
        /**
         * Response time in seconds
         */
        responseTime?: number;
        /**
         * Success message
         */
        message?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/test-provider',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad request - invalid provider configuration`,
                500: `Provider test failed`,
            },
        });
    }
    /**
     * Get available Ollama models
     * Fetch the list of models available on the local Ollama instance
     * @param baseUrl Base URL for the Ollama API
     * @returns LLMModel Successfully retrieved available models
     * @throws ApiError
     */
    public static getOllamaModels(
        baseUrl: string = 'http://localhost:11434',
    ): CancelablePromise<Array<LLMModel>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/ollama/models',
            query: {
                'baseURL': baseUrl,
            },
            errors: {
                500: `Failed to fetch models from Ollama`,
            },
        });
    }
    /**
     * Submit enhanced feedback for a generation
     * Submit feedback with rating and categories for a specific AI generation
     * @param requestBody
     * @returns FeedbackResponse Feedback submitted successfully
     * @throws ApiError
     */
    public static postApiFeedbackEnhanced(
        requestBody: FeedbackRequest,
    ): CancelablePromise<FeedbackResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/feedback/enhanced',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad request - invalid feedback data`,
                500: `Failed to submit feedback`,
            },
        });
    }
    /**
     * Get feedback history
     * Retrieve paginated feedback history with optional filtering
     * @param limit Number of feedback items to return
     * @param offset Number of feedback items to skip
     * @param userId Filter by user ID
     * @returns FeedbackHistoryResponse Feedback history retrieved successfully
     * @throws ApiError
     */
    public static getApiFeedbackHistory(
        limit: number = 10,
        offset?: number,
        userId?: string,
    ): CancelablePromise<FeedbackHistoryResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/feedback/history',
            query: {
                'limit': limit,
                'offset': offset,
                'userId': userId,
            },
            errors: {
                400: `Bad request - invalid query parameters`,
                500: `Failed to retrieve feedback history`,
            },
        });
    }
    /**
     * Get feedback analytics
     * Retrieve aggregated feedback analytics and metrics
     * @param userId Filter analytics by user ID
     * @param timeRange Time range for analytics
     * @returns FeedbackAnalyticsResponse Feedback analytics retrieved successfully
     * @throws ApiError
     */
    public static getApiFeedbackAnalytics(
        userId?: string,
        timeRange: '24h' | '7d' | '30d' | '90d' = '30d',
    ): CancelablePromise<FeedbackAnalyticsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/feedback/analytics',
            query: {
                'userId': userId,
                'timeRange': timeRange,
            },
            errors: {
                400: `Bad request - invalid query parameters`,
                500: `Failed to retrieve feedback analytics`,
            },
        });
    }
    /**
     * Get feedback trends
     * Retrieve feedback trends over time
     * @param userId Filter trends by user ID
     * @param period Period for trend aggregation
     * @param timeRange Time range for trends
     * @returns FeedbackTrendsResponse Feedback trends retrieved successfully
     * @throws ApiError
     */
    public static getApiFeedbackTrends(
        userId?: string,
        period: 'day' | 'week' | 'month' = 'day',
        timeRange: '24h' | '7d' | '30d' | '90d' = '30d',
    ): CancelablePromise<FeedbackTrendsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/feedback/trends',
            query: {
                'userId': userId,
                'period': period,
                'timeRange': timeRange,
            },
            errors: {
                400: `Bad request - invalid query parameters`,
                500: `Failed to retrieve feedback trends`,
            },
        });
    }
    /**
     * Get PRD session data
     * Retrieve conversation history and settings for a PRD session
     * @param id The ID of the PRD
     * @returns SessionData Session data retrieved successfully
     * @throws ApiError
     */
    public static getPrdsSession(
        id: string,
    ): CancelablePromise<SessionData> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/prds/{id}/session',
            path: {
                'id': id,
            },
            errors: {
                404: `PRD or session not found`,
                500: `Failed to retrieve session data`,
            },
        });
    }
    /**
     * Save PRD session data
     * Save conversation history and settings for a PRD session
     * @param id The ID of the PRD
     * @param requestBody
     * @returns SessionSaveResponse Session data saved successfully
     * @throws ApiError
     */
    public static postPrdsSession(
        id: string,
        requestBody: SessionSaveRequest,
    ): CancelablePromise<SessionSaveResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/prds/{id}/session',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad request - invalid session data`,
                404: `PRD not found`,
                500: `Failed to save session data`,
            },
        });
    }
}
