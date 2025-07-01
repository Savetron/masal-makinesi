import { z } from 'zod';
import { StoryTheme, StoryLength, ValidationError } from '@masal-makinesi/shared';
import { ValidationConfig } from './types.js';
import { checkContentSafety } from './guard.js';

/**
 * Validation System
 * JSON schema validation, content quality checks, and response validation
 */

// Zod schema for AI response validation
export const StoryResponseSchema = z.object({
    title: z.string()
        .min(5, 'Başlık çok kısa')
        .max(100, 'Başlık çok uzun')
        .refine(val => val.trim().length > 0, 'Başlık boş olamaz'),
    
    content: z.string()
        .min(50, 'İçerik çok kısa (minimum 50 karakter)')
        .max(3000, 'İçerik çok uzun (maksimum 3000 karakter)')
        .refine(val => val.trim().length > 0, 'İçerik boş olamaz'),
    
    wordCount: z.number()
        .min(50, 'Kelime sayısı çok az')
        .max(800, 'Kelime sayısı çok fazla')
        .int('Kelime sayısı tam sayı olmalı'),
    
    theme: z.nativeEnum(StoryTheme, {
        errorMap: () => ({ message: 'Geçersiz tema' })
    }),
    
    language: z.enum(['tr', 'en'], {
        errorMap: () => ({ message: 'Dil Türkçe (tr) veya İngilizce (en) olmalı' })
    }),
});

export type ValidatedStoryResponse = z.infer<typeof StoryResponseSchema>;

const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
    minWordCount: 50,
    maxWordCount: 800,
    requiredFields: ['title', 'content', 'wordCount', 'theme', 'language'],
    schemaRules: {},
    qualityThresholds: {
        minCoherence: 0.7,
        minReadability: 0.6,
        maxRepetition: 0.3,
    },
};

/**
 * Main validation function for AI responses
 */
export function validateStoryResponse(
    rawResponse: string, 
    expectedLength: StoryLength,
    config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): { valid: boolean; data?: ValidatedStoryResponse; errors: ValidationError[] } {
    const errors: ValidationError[] = [];
    
    // Step 1: Try to parse JSON
    let parsedData: any;
    try {
        parsedData = JSON.parse(rawResponse);
    } catch (error) {
        return {
            valid: false,
            errors: [{
                field: 'response',
                message: 'Geçersiz JSON formatı',
                code: 'INVALID_JSON',
            }],
        };
    }
    
    // Step 2: Validate against Zod schema
    const schemaResult = StoryResponseSchema.safeParse(parsedData);
    if (!schemaResult.success) {
        const schemaErrors = schemaResult.error.errors.map(err => ({
            field: err.path.join('.') || 'unknown',
            message: err.message,
            code: 'SCHEMA_VALIDATION_ERROR',
        }));
        errors.push(...schemaErrors);
    }
    
    if (!schemaResult.success) {
        return { valid: false, errors };
    }
    
    const data = schemaResult.data;
    
    // Step 3: Content safety check
    const safetyResult = checkContentSafety(data.content);
    if (!safetyResult.safe) {
        errors.push({
            field: 'content',
            message: `İçerik güvenlik kontrolünden geçemedi: ${safetyResult.categories.join(', ')}`,
            code: 'CONTENT_SAFETY_FAILED',
        });
    }
    
    // Step 4: Word count validation
    const actualWordCount = countWords(data.content);
    const expectedRange = getExpectedWordCountRange(expectedLength);
    
    if (actualWordCount < expectedRange.min || actualWordCount > expectedRange.max) {
        errors.push({
            field: 'wordCount',
            message: `Kelime sayısı beklenen aralıkta değil. Beklenen: ${expectedRange.min}-${expectedRange.max}, Gerçek: ${actualWordCount}`,
            code: 'WORD_COUNT_MISMATCH',
        });
    }
    
    // Step 5: Content quality checks
    const qualityErrors = validateContentQuality(data.content, config);
    errors.push(...qualityErrors);
    
    // Step 6: Turkish language validation
    const languageErrors = validateTurkishContent(data.content);
    errors.push(...languageErrors);
    
    return {
        valid: errors.length === 0,
        data: errors.length === 0 ? data : undefined,
        errors,
    };
}

/**
 * Quick JSON validation without full content checks
 */
export function quickValidateJSON(rawResponse: string): { valid: boolean; data?: any; error?: string } {
    try {
        const data = JSON.parse(rawResponse);
        const result = StoryResponseSchema.safeParse(data);
        
        return {
            valid: result.success,
            data: result.success ? result.data : undefined,
            error: result.success ? undefined : result.error.errors[0]?.message,
        };
    } catch (error) {
        return {
            valid: false,
            error: 'Invalid JSON format',
        };
    }
}

/**
 * Validates content quality
 */
function validateContentQuality(content: string, config: ValidationConfig): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Check for coherence (basic sentence structure)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length < 3) {
        errors.push({
            field: 'content',
            message: 'İçerik yeterli cümle yapısına sahip değil',
            code: 'INSUFFICIENT_STRUCTURE',
        });
    }
    
    // Check for excessive repetition
    const repetitionScore = calculateRepetitionScore(content);
    if (repetitionScore > config.qualityThresholds.maxRepetition) {
        errors.push({
            field: 'content',
            message: 'İçerikte aşırı tekrar var',
            code: 'EXCESSIVE_REPETITION',
        });
    }
    
    // Check for story elements
    const hasDialogue = /["'„""]/.test(content) || /dedi|söyledi|sordu|yanıtladı/.test(content.toLowerCase());
    const hasNarrative = content.split(/[.!?]+/).length > 5;
    
    if (!hasDialogue && !hasNarrative) {
        errors.push({
            field: 'content',
            message: 'İçerik hikaye formatında değil',
            code: 'NOT_STORY_FORMAT',
        });
    }
    
    return errors;
}

/**
 * Validates Turkish language content
 */
function validateTurkishContent(content: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Check for Turkish characters
    const turkishCharPattern = /[çğıİöşüÇĞÖŞÜ]/;
    if (!turkishCharPattern.test(content)) {
        errors.push({
            field: 'content',
            message: 'İçerik Türkçe karakterler içermiyor',
            code: 'NO_TURKISH_CHARACTERS',
        });
    }
    
    // Check for common Turkish words
    const commonTurkishWords = ['bir', 've', 'bu', 'o', 'da', 'de', 'ile', 'için', 'var', 'olan'];
    const lowerContent = content.toLowerCase();
    const foundTurkishWords = commonTurkishWords.filter(word => lowerContent.includes(word));
    
    if (foundTurkishWords.length < 3) {
        errors.push({
            field: 'content',
            message: 'İçerik Türkçe dilinde görünmüyor',
            code: 'NOT_TURKISH_LANGUAGE',
        });
    }
    
    return errors;
}

/**
 * Calculates repetition score (0-1, higher = more repetitive)
 */
function calculateRepetitionScore(content: string): number {
    const words = content.toLowerCase().split(/\s+/);
    const wordCounts: Record<string, number> = {};
    
    for (const word of words) {
        if (word.length > 3) { // Only count meaningful words
            wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
    }
    
    const totalMeaningfulWords = Object.values(wordCounts).reduce((sum, count) => sum + count, 0);
    const repeatedWords = Object.values(wordCounts).filter(count => count > 2).length;
    
    return repeatedWords / Math.max(1, totalMeaningfulWords);
}

/**
 * Counts words in content
 */
function countWords(content: string): number {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Gets expected word count range for story length
 */
function getExpectedWordCountRange(length: StoryLength): { min: number; max: number } {
    switch (length) {
        case StoryLength.SHORT:
            return { min: 80, max: 220 };
        case StoryLength.MEDIUM:
            return { min: 180, max: 420 };
        case StoryLength.LONG:
            return { min: 350, max: 650 };
        default:
            return { min: 80, max: 650 };
    }
}

/**
 * Creates validation error for retry scenarios
 */
export function createRetryValidationError(errors: ValidationError[]): string {
    const errorMessages = errors.map(err => `${err.field}: ${err.message}`);
    return `Validation failed with ${errors.length} error(s):\n${errorMessages.join('\n')}`;
}

/**
 * Checks if error is recoverable for retry
 */
export function isRecoverableError(errors: ValidationError[]): boolean {
    const recoverableCodes = [
        'INVALID_JSON',
        'WORD_COUNT_MISMATCH',
        'INSUFFICIENT_STRUCTURE',
        'NOT_STORY_FORMAT',
    ];
    
    return errors.some(error => recoverableCodes.includes(error.code));
}

/**
 * Pre-validates user request before processing
 */
export function validateUserRequest(request: any): { valid: boolean; errors: ValidationError[] } {
    const errors: ValidationError[] = [];
    
    if (!request.childName || typeof request.childName !== 'string' || request.childName.trim().length === 0) {
        errors.push({
            field: 'childName',
            message: 'Çocuk adı gerekli',
            code: 'MISSING_CHILD_NAME',
        });
    }
    
    if (!request.age || typeof request.age !== 'number' || request.age < 3 || request.age > 18) {
        errors.push({
            field: 'age',
            message: 'Yaş 3-18 arasında olmalı',
            code: 'INVALID_AGE',
        });
    }
    
    if (!Object.values(StoryTheme).includes(request.theme)) {
        errors.push({
            field: 'theme',
            message: 'Geçersiz hikaye teması',
            code: 'INVALID_THEME',
        });
    }
    
    if (!Object.values(StoryLength).includes(request.length)) {
        errors.push({
            field: 'length',
            message: 'Geçersiz hikaye uzunluğu',
            code: 'INVALID_LENGTH',
        });
    }
    
    return {
        valid: errors.length === 0,
        errors,
    };
}

export { DEFAULT_VALIDATION_CONFIG }; 