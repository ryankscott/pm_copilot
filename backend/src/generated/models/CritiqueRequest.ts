/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CritiqueRequest = {
  /**
   * Specific areas to focus the critique on
   */
  focus_areas?: Array<CritiqueRequest.focus_areas>;
  /**
   * How detailed the critique should be
   */
  depth?: CritiqueRequest.depth;
  /**
   * Whether to include specific improvement suggestions
   */
  include_suggestions?: boolean;
  /**
   * Any custom criteria or specific aspects to evaluate
   */
  custom_criteria?: string;
};
export namespace CritiqueRequest {
  /**
   * Specific areas to focus the critique on
   */
  export enum focus_areas {
    COMPLETENESS = "completeness",
    CLARITY = "clarity",
    STRUCTURE = "structure",
    FEASIBILITY = "feasibility",
    REQUIREMENTS = "requirements",
    USER_EXPERIENCE = "user_experience",
    TECHNICAL = "technical",
    BUSINESS_VALUE = "business_value",
  }
  /**
   * How detailed the critique should be
   */
  export enum depth {
    OVERVIEW = "overview",
    DETAILED = "detailed",
    COMPREHENSIVE = "comprehensive",
  }
}
