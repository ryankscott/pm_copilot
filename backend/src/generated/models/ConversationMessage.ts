/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ConversationMessage = {
    /**
     * The role of the message sender
     */
    role: ConversationMessage.role;
    /**
     * The message content
     */
    content: string;
    /**
     * When the message was sent
     */
    timestamp?: string;
    /**
     * Number of input tokens used (for assistant messages)
     */
    input_tokens?: number;
    /**
     * Number of output tokens generated (for assistant messages)
     */
    output_tokens?: number;
    /**
     * Time taken to generate the message in seconds (for assistant messages)
     */
    total_time?: number;
};
export namespace ConversationMessage {
    /**
     * The role of the message sender
     */
    export enum role {
        USER = 'user',
        ASSISTANT = 'assistant',
    }
}

