/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OKRs } from './OKRs';
/**
 * Context information about the user, company, product, and team
 */
export type UserContext = {
    company?: {
        /**
         * Company name
         */
        name?: string;
        /**
         * Industry or sector the company operates in
         */
        industry?: string;
        /**
         * Overall business strategy, mission, and vision
         */
        business_strategy?: string;
        /**
         * Company's product strategy and approach
         */
        product_strategy?: string;
        /**
         * Current company objectives and key results
         */
        okrs?: OKRs;
        /**
         * Company size or stage
         */
        size?: string;
    };
    product?: {
        /**
         * Product name
         */
        name?: string;
        /**
         * Product description and value proposition
         */
        description?: string;
        /**
         * Target users, market segments, and customer personas
         */
        target_market?: string;
        /**
         * How the product generates revenue
         */
        monetization_strategy?: string;
        /**
         * Main competitors and competitive landscape
         */
        competitors?: string;
        /**
         * Current development stage (MVP, Growth, Mature, etc.)
         */
        current_stage?: string;
    };
    team?: {
        /**
         * Team name
         */
        name?: string;
        /**
         * User's role in the team
         */
        role?: string;
        /**
         * Team responsibilities and ownership
         */
        responsibilities?: string;
        /**
         * Team's current objectives and key results
         */
        okrs?: OKRs;
        /**
         * Team size and composition
         */
        size?: string;
        /**
         * Team structure and organization
         */
        structure?: string;
    };
};

