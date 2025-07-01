import { SafetyCheckResult } from '@masal-makinesi/shared';
import { GuardRule, ContentGuardConfig } from './types.js';

/**
 * Content Guard System
 * Filters inappropriate content using block-lists and regex patterns
 */

const DEFAULT_BLOCKED_TERMS: string[] = [
    // Violence & Fear
    'şiddet', 'kan', 'ölüm', 'öldür', 'kavga', 'savaş', 'silah', 'bıçak',
    'korku', 'korkunç', 'dehşet', 'kabus', 'kötü rüya', 'canavar',
    
    // Inappropriate Content
    'alkol', 'sigara', 'uyuşturucu', 'kumar', 'para', 'zengin', 'fakir',
    'yoksul', 'sınıf', 'ayrımcılık', 'nefret', 'öfke', 'kızgın',
    
    // Adult Themes
    'aşk', 'sevgili', 'öpücük', 'evlilik', 'boşanma', 'cinsellik',
    'dokunma', 'gizli', 'yasak', 'mahrem', 'özel yer',
    
    // Negative Emotions
    'nefret', 'iğrenç', 'tiksinti', 'acı', 'ağlama', 'gözyaşı',
    'üzüntü', 'depresyon', 'kaygı', 'stres', 'endişe',
    
    // Religious/Political
    'din', 'tanrı', 'allah', 'dua', 'namaz', 'kilise', 'camii',
    'politika', 'hükümet', 'başkan', 'seçim', 'parti',
    
    // Scary Creatures
    'şeytan', 'cin', 'hayalet', 'zombi', 'vampir', 'kurt adam',
    'cadı', 'büyücü', 'lanet', 'kara büyü', 'büyü',
];

const DEFAULT_GUARD_RULES: GuardRule[] = [
    {
        id: 'excessive_caps',
        description: 'Excessive capital letters',
        pattern: /[A-ZÇĞıİÖŞÜ]{5,}/g,
        type: 'regex',
        severity: 'warn',
    },
    {
        id: 'repetitive_words',
        description: 'Repetitive words (same word 3+ times)',
        pattern: /\b(\w+)(\s+\1){2,}\b/gi,
        type: 'regex',
        severity: 'warn',
    },
    {
        id: 'violence_keywords',
        description: 'Violence-related keywords',
        pattern: /(vurmak|dövmek|saldırmak|zarar|yaralamak|acı vermek)/gi,
        type: 'regex',
        severity: 'block',
    },
    {
        id: 'fear_keywords',
        description: 'Fear and scary content',
        pattern: /(korkutucu|dehşetli|ürkütücü|karabasan|kâbus)/gi,
        type: 'regex',
        severity: 'block',
    },
    {
        id: 'inappropriate_contact',
        description: 'Inappropriate physical contact',
        pattern: /(dokunmak|ellemek|öpmek|sarılmak) (?:gizli|özel|yasak)/gi,
        type: 'regex',
        severity: 'block',
    },
    {
        id: 'negative_emotions_excessive',
        description: 'Excessive negative emotions',
        pattern: /(çok üzgün|çok korkuyor|çok ağlıyor|dehşete kapılmış)/gi,
        type: 'regex',
        severity: 'warn',
    },
];

const DEFAULT_CONFIG: ContentGuardConfig = {
    blockedTerms: DEFAULT_BLOCKED_TERMS,
    patterns: DEFAULT_GUARD_RULES,
    maxSensitiveReferences: 1,
    enabledGuards: ['blocked_terms', 'regex_patterns', 'length_check', 'repetition_check'],
};

/**
 * Main content guard function
 */
export function checkContentSafety(
    content: string, 
    config: ContentGuardConfig = DEFAULT_CONFIG
): SafetyCheckResult {
    const results: Array<{ safe: boolean; issues: string[]; confidence: number }> = [];
    
    // Check blocked terms
    if (config.enabledGuards.includes('blocked_terms')) {
        results.push(checkBlockedTerms(content, config.blockedTerms));
    }
    
    // Check regex patterns
    if (config.enabledGuards.includes('regex_patterns')) {
        results.push(checkRegexPatterns(content, config.patterns));
    }
    
    // Check content length and quality
    if (config.enabledGuards.includes('length_check')) {
        results.push(checkContentLength(content));
    }
    
    // Check for excessive repetition
    if (config.enabledGuards.includes('repetition_check')) {
        results.push(checkRepetition(content));
    }
    
    // Aggregate results
    const allSafe = results.every(r => r.safe);
    const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    const allIssues = results.flatMap(r => r.issues);
    
    return {
        safe: allSafe,
        confidence: averageConfidence,
        categories: extractCategories(allIssues),
        blockedTerms: extractBlockedTerms(content, config.blockedTerms),
    };
}

/**
 * Checks for blocked terms
 */
function checkBlockedTerms(content: string, blockedTerms: string[]): { safe: boolean; issues: string[]; confidence: number } {
    const lowerContent = content.toLowerCase();
    const foundTerms: string[] = [];
    
    for (const term of blockedTerms) {
        if (lowerContent.includes(term.toLowerCase())) {
            foundTerms.push(term);
        }
    }
    
    return {
        safe: foundTerms.length === 0,
        issues: foundTerms.map(term => `Blocked term found: ${term}`),
        confidence: foundTerms.length === 0 ? 1.0 : Math.max(0.1, 1 - (foundTerms.length * 0.3)),
    };
}

/**
 * Checks regex patterns
 */
function checkRegexPatterns(content: string, patterns: GuardRule[]): { safe: boolean; issues: string[]; confidence: number } {
    const issues: string[] = [];
    let blockingIssues = 0;
    
    for (const rule of patterns) {
        const matches = content.match(rule.pattern);
        if (matches && matches.length > 0) {
            issues.push(`${rule.description}: ${matches.length} matches found`);
            if (rule.severity === 'block') {
                blockingIssues++;
            }
        }
    }
    
    return {
        safe: blockingIssues === 0,
        issues,
        confidence: blockingIssues === 0 ? Math.max(0.5, 1 - (issues.length * 0.1)) : 0.2,
    };
}

/**
 * Checks content length and basic quality
 */
function checkContentLength(content: string): { safe: boolean; issues: string[]; confidence: number } {
    const wordCount = content.split(/\s+/).length;
    const issues: string[] = [];
    
    if (wordCount < 50) {
        issues.push('Content too short');
    }
    
    if (wordCount > 1000) {
        issues.push('Content too long');
    }
    
    // Check for basic structure
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length < 3) {
        issues.push('Content lacks proper structure');
    }
    
    return {
        safe: issues.length === 0,
        issues,
        confidence: issues.length === 0 ? 0.9 : Math.max(0.3, 1 - (issues.length * 0.2)),
    };
}

/**
 * Checks for excessive repetition
 */
function checkRepetition(content: string): { safe: boolean; issues: string[]; confidence: number } {
    const words = content.toLowerCase().split(/\s+/);
    const wordCount: Record<string, number> = {};
    const issues: string[] = [];
    
    // Count word frequencies
    for (const word of words) {
        if (word.length > 3) { // Only count meaningful words
            wordCount[word] = (wordCount[word] || 0) + 1;
        }
    }
    
    // Find excessive repetitions
    const totalWords = words.length;
    for (const [word, count] of Object.entries(wordCount)) {
        const frequency = count / totalWords;
        if (frequency > 0.1 && count > 5) { // Word appears >10% of time and >5 times
            issues.push(`Excessive repetition of word: ${word}`);
        }
    }
    
    return {
        safe: issues.length === 0,
        issues,
        confidence: issues.length === 0 ? 0.8 : Math.max(0.4, 1 - (issues.length * 0.15)),
    };
}

/**
 * Extracts categories from issues
 */
function extractCategories(issues: string[]): string[] {
    const categories = new Set<string>();
    
    for (const issue of issues) {
        if (issue.includes('Blocked term')) categories.add('inappropriate_content');
        if (issue.includes('violence')) categories.add('violence');
        if (issue.includes('fear') || issue.includes('scary')) categories.add('fear');
        if (issue.includes('repetition')) categories.add('quality_issues');
        if (issue.includes('length') || issue.includes('structure')) categories.add('format_issues');
    }
    
    return Array.from(categories);
}

/**
 * Extracts actual blocked terms found in content
 */
function extractBlockedTerms(content: string, blockedTerms: string[]): string[] {
    const lowerContent = content.toLowerCase();
    return blockedTerms.filter(term => lowerContent.includes(term.toLowerCase()));
}

/**
 * Pre-checks user input before sending to AI
 */
export function preCheckUserInput(input: string): SafetyCheckResult {
    const simpleConfig: ContentGuardConfig = {
        blockedTerms: DEFAULT_BLOCKED_TERMS,
        patterns: DEFAULT_GUARD_RULES.filter(rule => rule.severity === 'block'),
        maxSensitiveReferences: 0, // Stricter for input
        enabledGuards: ['blocked_terms', 'regex_patterns'],
    };
    
    return checkContentSafety(input, simpleConfig);
}

/**
 * Quick safety check for basic content filtering
 */
export function quickSafetyCheck(content: string): boolean {
    return checkContentSafety(content).safe;
}

export { DEFAULT_CONFIG, DEFAULT_BLOCKED_TERMS, DEFAULT_GUARD_RULES }; 