/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PRDContent } from './PRDContent';
export type GenerateContentResponse = {
    generated_content?: PRDContent;
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
     * The AI model used for generation
     */
    model_used?: string;
    /**
     * Time taken to generate content in seconds
     */
    generation_time?: number;
    /**
     * Additional suggestions for improving the content
     */
    suggestions?: Array<string>;
};

