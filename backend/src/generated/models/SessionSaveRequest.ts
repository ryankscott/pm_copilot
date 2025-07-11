/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConversationMessage } from './ConversationMessage';
export type SessionSaveRequest = {
    /**
     * Array of conversation messages to save
     */
    conversation_history: Array<ConversationMessage>;
    /**
     * Session settings and configuration to save
     */
    settings: Record<string, any>;
};

