import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

export interface GeminiConfig {
    apiKey: string;
    model: string;
    temperature: number;
    maxOutputTokens: number;
}

export interface GeminiResponse {
    content: string;
    finishReason: string;
    safetyRatings: any[];
}

/**
 * Gemini AI Client
 */
export class GeminiClient {
    private genAI: GoogleGenerativeAI;
    private config: GeminiConfig;

    constructor(config: GeminiConfig) {
        this.config = config;
        this.genAI = new GoogleGenerativeAI(config.apiKey);
    }

    /**
     * Generates story content from prompt
     */
    async generateStory(prompt: string, retryCount: number = 0): Promise<GeminiResponse> {
        try {
            const model = this.genAI.getGenerativeModel({ 
                model: this.config.model,
                generationConfig: {
                    temperature: retryCount > 0 ? 0.7 : this.config.temperature, // Lower temp for retry
                    maxOutputTokens: this.config.maxOutputTokens,
                },
                safetySettings: [
                    {
                        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                    },
                    {
                        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                    },
                    {
                        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                    },
                    {
                        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                    },
                ],
            });

            const result = await model.generateContent(prompt);
            const response = await result.response;
            
            return {
                content: response.text(),
                finishReason: response.candidates?.[0]?.finishReason || 'STOP',
                safetyRatings: response.candidates?.[0]?.safetyRatings || [],
            };
        } catch (error: any) {
            console.error('Gemini API Error:', error);
            
            // Handle specific error cases
            if (error.message?.includes('SAFETY')) {
                throw new Error('Content was blocked by safety filters');
            }
            
            if (error.message?.includes('QUOTA')) {
                throw new Error('API quota exceeded');
            }
            
            throw new Error(`AI generation failed: ${error.message}`);
        }
    }

    /**
     * Pre-checks content with safety filters
     */
    async checkContentSafety(content: string): Promise<boolean> {
        try {
            const model = this.genAI.getGenerativeModel({ 
                model: 'gemini-pro',
            });

            const prompt = `Bu içerik çocuklar için güvenli mi? Sadece "GÜVENLI" veya "GÜVENLI DEĞİL" yanıtı ver: "${content}"`;
            
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().toUpperCase();
            
            return text.includes('GÜVENLI') && !text.includes('GÜVENLI DEĞİL');
        } catch (error) {
            console.error('Safety check failed:', error);
            return false; // Conservative approach
        }
    }
}

/**
 * Creates Gemini client from environment variables
 */
export function createGeminiClient(): GeminiClient {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is required');
    }

    return new GeminiClient({
        apiKey,
        model: 'gemini-pro',
        temperature: 0.9,
        maxOutputTokens: 1024,
    });
}

/**
 * Validates Gemini API configuration
 */
export function validateGeminiConfig(): boolean {
    return Boolean(process.env.GEMINI_API_KEY);
} 