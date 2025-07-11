/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConversationMessage } from './ConversationMessage';
export type SessionData = {
    /**
     * Unique session ID
     */
    id?: string;
    /**
     * ID of the associated PRD
     */
    prd_id?: string;
    /**
     * Array of conversation messages
     */
    conversation_history?: Array<ConversationMessage>;
    /**
     * Session settings and configuration
     */
    settings?: Record<string, any>;
    /**
     * When the session was created
     */
    created_at?: string;
    /**
     * When the session was last updated
     */
    updated_at?: string;
};

