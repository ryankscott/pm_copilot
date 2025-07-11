/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CritiqueResponse = {
    /**
     * Executive summary of the critique
     */
    summary?: string;
    /**
     * Number of input tokens used
     */
    input_tokens?: number;
    /**
     * Number of output tokens generated
     */
    output_tokens?: number;
    /**
     * Total number of tokens consumed
     */
    tokens_used?: number;
    /**
     * The AI model used for critique
     */
    model_used?: string;
    /**
     * Time taken to generate critique in seconds
     */
    generation_time?: number;
};

