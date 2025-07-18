/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type QuestionResponse = {
    /**
     * The AI-generated answer to the question
     */
    answer?: string;
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
     * The AI model used for answering
     */
    model_used?: string;
    /**
     * Time taken to generate answer in seconds
     */
    generation_time?: number;
    /**
     * Sections of the PRD that are most relevant to the question
     */
    related_sections?: Array<string>;
    /**
     * Suggested follow-up questions
     */
    follow_up_questions?: Array<string>;
};

