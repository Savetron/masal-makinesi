import { StoryRequest, StoryTheme, StoryLength } from '@masal-makinesi/shared';
import { PromptTemplate, LengthSpec } from './types.js';

/**
 * Story Prompt Template Engine
 * Merges StoryRequest with template to create AI prompts
 */

const DEFAULT_TEMPLATE: PromptTemplate = {
    version: '1.0.0',
    basePrompt: `Sen bir çocuk masalı yazarısın. {childName} adında {age} yaşında bir çocuk için kişiselleştirilmiş bir masal yaz.

Gereksinimler:
- Masal Türkçe olmalı
- Çocuğun yaşına uygun olmalı
- {length} uzunlukta olmalı
- {theme} teması işlenmeli
- Pozitif ve eğitici mesajlar içermeli
- Şiddet, korku veya uygunsuz içerik olmamalı`,
    
    ageModifiers: {
        '3-5': 'Çok basit kelimeler kullan, tekrarlar yap, renkler ve sesler ekle.',
        '6-8': 'Basit kelimeler kullan, kısa cümleler yaz, hayal gücünü geliştir.',
        '9-12': 'Orta seviye kelimeler kullan, daha karmaşık hikaye yapısı kur.',
        '13+': 'Zengin kelime dağarcığı kullan, derin karakterler oluştur.',
    },
    
    themePrompts: {
        [StoryTheme.ADVENTURE]: 'Keşif ve macera dolu bir hikaye anlat. Cesaret ve azmi vurgula.',
        [StoryTheme.FRIENDSHIP]: 'Dostluk, paylaşım ve yardımlaşma konularını işle.',
        [StoryTheme.LEARNING]: 'Öğrenme ve merak konularını eğlenceli şekilde anlat.',
        [StoryTheme.FANTASY]: 'Büyülü kreatürler ve fantastik dünyalar kur.',
        [StoryTheme.ANIMALS]: 'Hayvanlar ve doğa ile ilgili hikaye anlat.',
        [StoryTheme.FAMILY]: 'Aile değerleri ve sevgiyi vurgula.',
        [StoryTheme.NATURE]: 'Doğa sevgisi ve çevre bilincini işle.',
        [StoryTheme.MUSIC]: 'Müzik ve ritim konularını eğlenceli şekilde kur.',
    },
    
    lengthSpecs: {
        [StoryLength.SHORT]: {
            wordCount: 150,
            range: [100, 200],
            complexity: 'simple',
        },
        [StoryLength.MEDIUM]: {
            wordCount: 300,
            range: [200, 400],
            complexity: 'moderate',
        },
        [StoryLength.LONG]: {
            wordCount: 500,
            range: [400, 600],
            complexity: 'advanced',
        },
    },
    
    safetyInstructions: `GÜVENLIK KURALLARI:
- Şiddet, korku veya travma içeren içerik yazma
- Uygunsuz kelimeler veya kavramlar kullanma
- Aile için güvenli ve pozitif mesajlar ver
- Çocuğun yaş grubuna uygun içerik üret`,
};

/**
 * Builds AI prompt from story request
 */
export function buildStoryPrompt(request: StoryRequest, template: PromptTemplate = DEFAULT_TEMPLATE): string {
    const ageGroup = getAgeGroup(request.age);
    const lengthSpec = template.lengthSpecs[request.length];
    const themePrompt = template.themePrompts[request.theme];
    const ageModifier = template.ageModifiers[ageGroup];
    
    let prompt = template.basePrompt
        .replace('{childName}', request.childName)
        .replace('{age}', request.age.toString())
        .replace('{length}', getLengthDescription(request.length, lengthSpec))
        .replace('{theme}', themePrompt);
    
    // Add age-specific instructions
    if (ageModifier) {
        prompt += `\n\nYaş grubu özel talimatları: ${ageModifier}`;
    }
    
    // Add custom elements if provided
    if (request.elements && request.elements.length > 0) {
        prompt += `\n\nHikayede bu öğeleri de dahil et: ${request.elements.join(', ')}`;
    }
    
    // Add length specification
    prompt += `\n\nHikaye uzunluğu: ${lengthSpec.wordCount} kelime civarında (${lengthSpec.range[0]}-${lengthSpec.range[1]} kelime arası).`;
    
    // Add safety instructions
    prompt += `\n\n${template.safetyInstructions}`;
    
    // Add JSON format requirement
    prompt += `\n\nCevabını şu JSON formatında ver:
{
    "title": "Hikaye başlığı",
    "content": "Hikaye içeriği",
    "wordCount": kelime_sayısı,
    "theme": "${request.theme}",
    "language": "tr"
}`;
    
    return prompt;
}

/**
 * Gets age group category
 */
function getAgeGroup(age: number): string {
    if (age <= 5) return '3-5';
    if (age <= 8) return '6-8';
    if (age <= 12) return '9-12';
    return '13+';
}

/**
 * Gets human-readable length description
 */
function getLengthDescription(length: StoryLength, spec: LengthSpec): string {
    const descriptions = {
        [StoryLength.SHORT]: 'kısa',
        [StoryLength.MEDIUM]: 'orta uzunlukta',
        [StoryLength.LONG]: 'uzun',
    };
    
    return `${descriptions[length]} (yaklaşık ${spec.wordCount} kelime)`;
}

/**
 * Creates a retry prompt with adjusted temperature
 */
export function buildRetryPrompt(originalRequest: StoryRequest, previousError: string): string {
    const basePrompt = buildStoryPrompt(originalRequest);
    
    return `${basePrompt}

ÖNCEKI HATA: ${previousError}

Bu hatayı düzelterek, geçerli JSON formatında cevap ver. Daha dikkatli ol ve format kurallarına uy.`;
}

/**
 * Validates prompt length and complexity
 */
export function validatePrompt(prompt: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (prompt.length < 100) {
        errors.push('Prompt çok kısa');
    }
    
    if (prompt.length > 2000) {
        errors.push('Prompt çok uzun');
    }
    
    if (!prompt.includes('JSON')) {
        errors.push('JSON format gereksinimi eksik');
    }
    
    if (!prompt.includes('çocuk') && !prompt.includes('masal')) {
        errors.push('Temel hikaye elemanları eksik');
    }
    
    return {
        valid: errors.length === 0,
        errors,
    };
}

export { DEFAULT_TEMPLATE }; 