/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OKRKeyResult } from './OKRKeyResult';
/**
 * An objective with associated key results
 */
export type OKRObjective = {
    /**
     * Unique identifier for the objective
     */
    id: string;
    /**
     * Title of the objective
     */
    title: string;
    /**
     * Detailed description of the objective
     */
    description?: string;
    /**
     * Key results that measure progress toward this objective
     */
    keyResults: Array<OKRKeyResult>;
};

