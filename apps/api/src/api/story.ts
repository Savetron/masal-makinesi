import { VercelRequest, VercelResponse } from '@vercel/node';
import { 
    StoryRequest, 
    StoryResponse, 
    Story, 
    StoryMetadata, 
    ValidationError 
} from '@masal-makinesi/shared';
import { 
    buildStoryPrompt, 
    validateStoryResponse, 
    buildRetryPrompt,
    preCheckUserInput,
    validateUserRequest,
    isRecoverableError 
} from '@masal-makinesi/prompts';

import { authenticateToken, AuthPayload } from '../lib/auth.js';
import { createGeminiClient, GeminiClient } from '../lib/gemini.js';
import { createSupabaseService, SupabaseService } from '../lib/supabase.js';

/**
 * Main Story Generation API Endpoint
 * POST /api/story
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed' 
        });
    }

    const startTime = Date.now();

    try {
        // Step 1: Authenticate user
        const authPayload = authenticateToken(req);
        if (!authPayload) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
        }

        // Step 2: Validate request body
        const requestValidation = validateUserRequest(req.body);
        if (!requestValidation.valid) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request',
                details: requestValidation.errors,
            });
        }

        const storyRequest: StoryRequest = req.body;

        // Step 3: Pre-check user input for safety
        const inputSafetyCheck = preCheckUserInput(
            `${storyRequest.childName} ${storyRequest.elements?.join(' ') || ''}`
        );
        
        if (!inputSafetyCheck.safe) {
            return res.status(400).json({
                success: false,
                error: 'Input contains inappropriate content',
                categories: inputSafetyCheck.categories,
            });
        }

        // Step 4: Check rate limiting
        const supabase = createSupabaseService();
        const storyCount = await supabase.getUserStoryCount(authPayload.userId);
        
        if (storyCount >= 10) { // 10 stories per day limit
            return res.status(429).json({
                success: false,
                error: 'Daily story limit reached',
            });
        }

        // Step 5: Generate story
        const storyResult = await generateStoryWithRetry(storyRequest);
        
        if (!storyResult.success) {
            return res.status(500).json({
                success: false,
                error: storyResult.error,
            });
        }

        // Step 6: Store in database
        const story = storyResult.story!;
        const metadata = storyResult.metadata!;
        story.id = generateStoryId();
        story.createdAt = new Date().toISOString();

        await supabase.storeStory(story, authPayload.userId, metadata);

        // Step 7: Return response
        const response: StoryResponse = {
            story,
            metadata: {
                ...metadata,
                generationTime: Date.now() - startTime,
            },
            success: true,
        };

        return res.status(200).json(response);

    } catch (error: any) {
        console.error('Story generation error:', error);
        
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
}

/**
 * Generates story with retry logic
 */
async function generateStoryWithRetry(
    request: StoryRequest
): Promise<{ success: boolean; story?: Story; metadata?: StoryMetadata; error?: string }> {
    const gemini = createGeminiClient();
    let lastError = '';

    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const prompt = attempt === 0 
                ? buildStoryPrompt(request)
                : buildRetryPrompt(request, lastError);

            const geminiResponse = await gemini.generateStory(prompt, attempt);
            
            // Validate AI response
            const validation = validateStoryResponse(
                geminiResponse.content, 
                request.length
            );

            if (validation.valid && validation.data) {
                const story: Story = {
                    id: '', // Will be set later
                    title: validation.data.title,
                    content: validation.data.content,
                    childName: request.childName,
                    theme: request.theme,
                    length: request.length,
                    wordCount: validation.data.wordCount,
                    createdAt: '', // Will be set later
                };

                const metadata: StoryMetadata = {
                    generationTime: 0, // Will be calculated later
                    model: 'gemini-pro',
                    safetyScore: calculateSafetyScore(geminiResponse.safetyRatings),
                    language: validation.data.language,
                    promptVersion: '1.0.0',
                };

                return { success: true, story, metadata };
            } else {
                lastError = validation.errors.map(e => e.message).join(', ');
                
                if (!isRecoverableError(validation.errors)) {
                    break; // Don't retry if error is not recoverable
                }
            }
        } catch (error: any) {
            lastError = error.message;
            console.error(`Story generation attempt ${attempt + 1} failed:`, error);
        }
    }

    return { 
        success: false, 
        error: `Story generation failed after 2 attempts: ${lastError}` 
    };
}

/**
 * Calculates safety score from Gemini safety ratings
 */
function calculateSafetyScore(safetyRatings: any[]): number {
    if (!safetyRatings || safetyRatings.length === 0) {
        return 0.8; // Default safe score
    }

    const safeCategories = safetyRatings.filter(
        rating => rating.probability === 'NEGLIGIBLE' || rating.probability === 'LOW'
    ).length;

    return safeCategories / safetyRatings.length;
}

/**
 * Generates unique story ID
 */
function generateStoryId(): string {
    return `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
} 