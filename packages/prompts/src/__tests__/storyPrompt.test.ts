import { describe, it, expect } from 'vitest';
import { buildStoryPrompt, validatePrompt } from '../storyPrompt.js';
import { StoryTheme, StoryLength } from '../../../shared/src/types.js';

describe('Story Prompt Builder', () => {
    const sampleRequest = {
        childName: 'Ahmet',
        age: 7,
        theme: StoryTheme.ADVENTURE,
        length: StoryLength.SHORT,
        token: 'test-token',
    };

    it('should build a basic story prompt', () => {
        const prompt = buildStoryPrompt(sampleRequest);
        
        expect(prompt).toContain('Ahmet');
        expect(prompt).toContain('7');
        expect(prompt).toContain('Keşif ve macera');
        expect(prompt).toContain('JSON');
    });

    it('should include age-specific modifiers', () => {
        const youngChildRequest = { ...sampleRequest, age: 4 };
        const prompt = buildStoryPrompt(youngChildRequest);
        
        expect(prompt).toContain('Çok basit kelimeler');
    });

    it('should include custom elements', () => {
        const requestWithElements = {
            ...sampleRequest,
            elements: ['köpek', 'orman'],
        };
        const prompt = buildStoryPrompt(requestWithElements);
        
        expect(prompt).toContain('köpek, orman');
    });

    it('should validate prompt correctly', () => {
        const prompt = buildStoryPrompt(sampleRequest);
        const validation = validatePrompt(prompt);
        
        expect(validation.valid).toBe(true);
        expect(validation.errors).toHaveLength(0);
    });

    it('should fail validation for short prompts', () => {
        const validation = validatePrompt('short');
        
        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Prompt çok kısa');
    });
}); 