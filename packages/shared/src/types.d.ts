/**
 * Shared types for Masal Makinesi
 * Used across TypeScript and Swift (via code generation)
 */
export interface StoryRequest {
    /** Child's name to personalize the story */
    childName: string;
    /** Child's age (affects complexity and content) */
    age: number;
    /** Preferred story theme */
    theme: StoryTheme;
    /** Preferred story length */
    length: StoryLength;
    /** Optional specific elements to include */
    elements?: string[];
    /** User's JWT token for authentication */
    token: string;
}
export interface StoryResponse {
    /** Generated story content */
    story: Story;
    /** Generation metadata */
    metadata: StoryMetadata;
    /** Success status */
    success: boolean;
    /** Error message if any */
    error?: string;
}
export interface Story {
    /** Unique story identifier */
    id: string;
    /** Story title */
    title: string;
    /** Main story content */
    content: string;
    /** Child's name (personalized) */
    childName: string;
    /** Story theme */
    theme: StoryTheme;
    /** Story length category */
    length: StoryLength;
    /** Word count */
    wordCount: number;
    /** Creation timestamp */
    createdAt: string;
    /** TTS audio URL (if generated) */
    audioUrl?: string;
}
export interface StoryMetadata {
    /** Generation time in milliseconds */
    generationTime: number;
    /** AI model used */
    model: string;
    /** Content safety score (0-1) */
    safetyScore: number;
    /** Language detected/used */
    language: 'tr' | 'en';
    /** Version of prompt template used */
    promptVersion: string;
}
export declare enum StoryTheme {
    ADVENTURE = "adventure",
    FRIENDSHIP = "friendship",
    LEARNING = "learning",
    FANTASY = "fantasy",
    ANIMALS = "animals",
    FAMILY = "family",
    NATURE = "nature",
    MUSIC = "music"
}
export declare enum StoryLength {
    SHORT = "short",// ~100-200 words
    MEDIUM = "medium",// ~200-400 words  
    LONG = "long"
}
export interface ValidationError {
    field: string;
    message: string;
    code: string;
}
export interface SafetyCheckResult {
    safe: boolean;
    confidence: number;
    categories: string[];
    blockedTerms?: string[];
}
//# sourceMappingURL=types.d.ts.map