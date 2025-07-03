/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CritiqueSuggestion } from "./CritiqueSuggestion";
export type CritiqueResponse = {
  /**
   * Overall quality score for the PRD (0-10)
   */
  overall_score?: number;
  /**
   * Areas where the PRD excels
   */
  strengths?: Array<string>;
  /**
   * Areas that need improvement
   */
  weaknesses?: Array<string>;
  /**
   * Important sections that are missing from the PRD
   */
  missing_sections?: Array<string>;
  /**
   * Specific improvement suggestions
   */
  suggestions?: Array<CritiqueSuggestion>;
  /**
   * Section-by-section detailed feedback
   */
  detailed_feedback?: Record<string, any>;
  /**
   * Prioritized list of actions to improve the PRD
   */
  action_items?: Array<string>;
  /**
   * Executive summary of the critique
   */
  critique_summary?: string;
};
