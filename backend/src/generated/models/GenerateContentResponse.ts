/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type GenerateContentResponse = {
    /**
     * The AI-generated content
     */
    generated_content?: string;
    /**
     * Number of tokens consumed in the generation
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

