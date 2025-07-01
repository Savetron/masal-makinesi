import { StoryTheme, StoryLength } from '@masal-makinesi/shared';

export interface PromptTemplate {
    /** Template version identifier */
    version: string;
    /** Base prompt structure */
    basePrompt: string;
    /** Age-specific adjustments */
    ageModifiers: Record<string, string>;
    /** Theme-specific additions */
    themePrompts: Record<StoryTheme, string>;
    /** Length specifications */
    lengthSpecs: Record<StoryLength, LengthSpec>;
    /** Safety instructions */
    safetyInstructions: string;
}

export interface LengthSpec {
    /** Target word count */
    wordCount: number;
    /** Acceptable range */
    range: [number, number];
    /** Complexity level */
    complexity: 'simple' | 'moderate' | 'advanced';
}

export interface GuardRule {
    /** Rule identifier */
    id: string;
    /** Rule description */
    description: string;
    /** Regex pattern or exact match */
    pattern: string | RegExp;
    /** Rule type */
    type: 'regex' | 'exact' | 'contains';
    /** Severity level */
    severity: 'block' | 'warn' | 'flag';
    /** Language specific (optional) */
    language?: 'tr' | 'en';
}

export interface ContentGuardConfig {
    /** List of blocked terms */
    blockedTerms: string[];
    /** Regex patterns to check */
    patterns: GuardRule[];
    /** Maximum allowed mentions of sensitive topics */
    maxSensitiveReferences: number;
    /** Enabled guard types */
    enabledGuards: string[];
}

export interface ValidationConfig {
    /** Minimum story length */
    minWordCount: number;
    /** Maximum story length */
    maxWordCount: number;
    /** Required fields in response */
    requiredFields: string[];
    /** Schema validation rules */
    schemaRules: Record<string, any>;
    /** Content quality thresholds */
    qualityThresholds: {
        minCoherence: number;
        minReadability: number;
        maxRepetition: number;
    };
} 