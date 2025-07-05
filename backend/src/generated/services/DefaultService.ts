/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CritiqueRequest } from '../models/CritiqueRequest';
import type { CritiqueResponse } from '../models/CritiqueResponse';
import type { GenerateContentRequest } from '../models/GenerateContentRequest';
import type { GenerateContentResponse } from '../models/GenerateContentResponse';
import type { LLMProviderConfig } from '../models/LLMProviderConfig';
import type { PRD } from '../models/PRD';
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
}
