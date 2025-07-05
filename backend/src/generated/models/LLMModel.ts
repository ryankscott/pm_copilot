/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type LLMModel = {
    /**
     * Unique identifier for the model
     */
    id?: string;
    /**
     * Display name of the model
     */
    name?: string;
    /**
     * Description of the model's capabilities
     */
    description?: string;
    /**
     * Maximum token limit for the model
     */
    maxTokens?: number;
    /**
     * Whether the model supports streaming responses
     */
    supportsStreaming?: boolean;
    costPer1kTokens?: {
        /**
         * Cost per 1k input tokens
         */
        input?: number;
        /**
         * Cost per 1k output tokens
         */
        output?: number;
    };
};

