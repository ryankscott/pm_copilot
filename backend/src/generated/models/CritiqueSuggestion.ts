/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CritiqueSuggestion = {
  /**
   * Category of the suggestion
   */
  category?: CritiqueSuggestion.category;
  /**
   * Priority level of the suggestion
   */
  priority?: CritiqueSuggestion.priority;
  /**
   * Brief title of the suggestion
   */
  title?: string;
  /**
   * Detailed description of the suggestion
   */
  description?: string;
  /**
   * Example of how to implement the suggestion
   */
  example?: string;
};
export namespace CritiqueSuggestion {
  /**
   * Category of the suggestion
   */
  export enum category {
    STRUCTURE = "structure",
    CONTENT = "content",
    CLARITY = "clarity",
    REQUIREMENTS = "requirements",
    TECHNICAL = "technical",
    BUSINESS = "business",
  }
  /**
   * Priority level of the suggestion
   */
  export enum priority {
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low",
  }
}
