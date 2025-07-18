/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TemplateSection } from './TemplateSection';
export type Template = {
    /**
     * Unique identifier for the template
     */
    id: string;
    /**
     * Display name of the template
     */
    title: string;
    /**
     * Description of the template
     */
    description: string;
    /**
     * Category of the template
     */
    category: string;
    /**
     * Sections included in this template
     */
    sections: Array<TemplateSection>;
    /**
     * When the template was created
     */
    createdAt?: string;
    /**
     * When the template was last updated
     */
    updatedAt?: string;
    /**
     * Whether this is a user-created template
     */
    isCustom?: boolean;
};

