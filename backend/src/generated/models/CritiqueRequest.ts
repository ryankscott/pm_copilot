/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LLMProviderConfig } from './LLMProviderConfig';
export type CritiqueRequest = {
    /**
     * Existing content to enhance or build upon
     */
    existing_content?: any;
    /**
     * Specific areas to focus the critique on
     */
    focus_areas?: Array<'completeness' | 'clarity' | 'structure' | 'feasibility' | 'requirements' | 'user_experience' | 'technical' | 'business_value'>;
    /**
     * How detailed the critique should be
     */
    depth?: CritiqueRequest.depth;
    /**
     * Whether to include specific improvement suggestions
     */
    include_suggestions?: boolean;
    /**
     * Any custom criteria or specific aspects to evaluate
     */
    custom_criteria?: string;
    /**
     * LLM provider configuration to use for critique
     */
    provider?: LLMProviderConfig;
    /**
     * Specific model to use for critique
     */
    model?: string;
};
export namespace CritiqueRequest {
    /**
     * How detailed the critique should be
     */
    export enum depth {
        OVERVIEW = 'overview',
        DETAILED = 'detailed',
        COMPREHENSIVE = 'comprehensive',
    }
}

