/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConversationMessage } from './ConversationMessage';
import type { LLMProviderConfig } from './LLMProviderConfig';
export type QuestionRequest = {
    /**
     * The question to ask about the PRD
     */
    question: string;
    /**
     * Additional context for the question
     */
    context?: string;
    /**
     * Previous conversation messages for interactive sessions
     */
    conversation_history?: Array<ConversationMessage>;
    /**
     * LLM provider configuration to use for answering
     */
    provider?: LLMProviderConfig;
    /**
     * Specific model to use for answering
     */
    model?: string;
};

