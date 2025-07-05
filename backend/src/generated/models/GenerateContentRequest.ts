/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConversationMessage } from './ConversationMessage';
import type { LLMProviderConfig } from './LLMProviderConfig';
export type GenerateContentRequest = {
    /**
     * The prompt or instruction for AI content generation
     */
    prompt: string;
    /**
     * Additional context to help with content generation
     */
    context?: string;
    /**
     * The tone to use for generated content
     */
    tone?: GenerateContentRequest.tone;
    /**
     * The desired length/detail level of generated content
     */
    length?: GenerateContentRequest.length;
    /**
     * Existing content to enhance or build upon
     */
    existing_content?: any;
    /**
     * Previous conversation messages for interactive sessions
     */
    conversation_history?: Array<ConversationMessage>;
    /**
     * LLM provider configuration to use for generation
     */
    provider?: LLMProviderConfig;
    /**
     * Specific model to use for generation
     */
    model?: string;
};
export namespace GenerateContentRequest {
    /**
     * The tone to use for generated content
     */
    export enum tone {
        PROFESSIONAL = 'professional',
        CASUAL = 'casual',
        TECHNICAL = 'technical',
        EXECUTIVE = 'executive',
    }
    /**
     * The desired length/detail level of generated content
     */
    export enum length {
        BRIEF = 'brief',
        STANDARD = 'standard',
        DETAILED = 'detailed',
        COMPREHENSIVE = 'comprehensive',
    }
}

