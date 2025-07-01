import express, { Request, Response } from 'express';
import cors from 'cors';
import { validateGeminiConfig } from './lib/gemini.js';
import { validateSupabaseConfig } from './lib/supabase.js';
import { authenticateToken } from './lib/auth.js';
import { createTestToken } from './lib/auth.js';
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
import { createGeminiClient } from './lib/gemini.js';
import { createSupabaseService } from './lib/supabase.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
    try {
        const checks = {
            gemini: validateGeminiConfig(),
            supabase: validateSupabaseConfig(),
            timestamp: new Date().toISOString(),
        };

        const allHealthy = Object.values(checks).every(check => 
            typeof check === 'boolean' ? check : true
        );

        return res.status(allHealthy ? 200 : 503).json({
            success: allHealthy,
            checks,
            status: allHealthy ? 'healthy' : 'degraded',
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            error: 'Health check failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
});

// Test Token (Development only)
app.post('/api/test-token', (req: Request, res: Response) => {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ 
            success: false, 
            error: 'Not found' 
        });
    }

    try {
        const { userId = 'test-user', email = 'test@example.com' } = req.body || {};
        const token = createTestToken(userId, email);

        return res.status(200).json({
            success: true,
            token,
            userId,
            email,
            expiresIn: '24h',
            note: 'This is a development-only endpoint',
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            error: 'Token generation failed',
            details: error.message,
        });
    }
});

// Story Generation
app.post('/api/story', async (req: Request, res: Response) => {
    const startTime = Date.now();

    try {
        // Step 1: Authenticate user
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
        }

        const token = authHeader.replace('Bearer ', '');
        const authPayload = authenticateToken({ headers: { authorization: authHeader } } as any);
        
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
        
        if (storyCount >= 10) {
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
});

// Helper functions
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
            
            const validation = validateStoryResponse(
                geminiResponse.content, 
                request.length
            );

            if (validation.valid && validation.data) {
                const story: Story = {
                    id: '',
                    title: validation.data.title,
                    content: validation.data.content,
                    childName: request.childName,
                    theme: request.theme,
                    length: request.length,
                    wordCount: validation.data.wordCount,
                    createdAt: '',
                };

                const metadata: StoryMetadata = {
                    generationTime: 0,
                    model: 'gemini-pro',
                    safetyScore: calculateSafetyScore(geminiResponse.safetyRatings),
                    language: validation.data.language,
                    promptVersion: '1.0.0',
                };

                return { success: true, story, metadata };
            } else {
                lastError = validation.errors.map(e => e.message).join(', ');
                
                if (!isRecoverableError(validation.errors)) {
                    break;
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

function calculateSafetyScore(safetyRatings: any[]): number {
    if (!safetyRatings || safetyRatings.length === 0) {
        return 0.8;
    }

    let totalScore = 0;
    let validRatings = 0;

    for (const rating of safetyRatings) {
        if (rating.probability && typeof rating.probability === 'string') {
            const prob = rating.probability.toLowerCase();
            let score = 1.0;
            
            if (prob === 'high') score = 0.2;
            else if (prob === 'medium') score = 0.6;
            else if (prob === 'low') score = 0.9;
            else if (prob === 'negligible') score = 1.0;
            
            totalScore += score;
            validRatings++;
        }
    }

    return validRatings > 0 ? totalScore / validRatings : 0.8;
}

function generateStoryId(): string {
    return `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 404 handler
app.use('*', (req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Not found',
        path: req.originalUrl
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Masal Makinesi API running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
}); 