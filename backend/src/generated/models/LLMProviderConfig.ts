/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type LLMProviderConfig = {
    /**
     * The LLM provider type
     */
    type?: LLMProviderConfig.type;
    /**
     * Display name of the provider
     */
    name?: string;
    /**
     * API key for the provider (if required)
     */
    apiKey?: string;
    /**
     * Base URL for the provider API (for custom deployments)
     */
    baseURL?: string;
    /**
     * Whether the provider is properly configured
     */
    isConfigured?: boolean;
};
export namespace LLMProviderConfig {
    /**
     * The LLM provider type
     */
    export enum type {
        OPENAI = 'openai',
        ANTHROPIC = 'anthropic',
        GOOGLE = 'google',
        OLLAMA = 'ollama',
    }
}

