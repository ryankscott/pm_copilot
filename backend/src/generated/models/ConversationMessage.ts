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

