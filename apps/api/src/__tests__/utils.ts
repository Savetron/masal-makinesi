import { vi } from 'vitest'
import type { StoryRequest } from '@masal-makinesi/shared'
import { StoryTheme, StoryLength } from '@masal-makinesi/shared'
import jwt from 'jsonwebtoken'

// Mock Request/Response utilities
export const createMockRequest = (body?: any, headers?: Record<string, string>) => {
    return {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            ...headers,
        },
        json: vi.fn().mockResolvedValue(body || {}),
    }
}

export const createMockResponse = () => {
    const mockResponse = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        setHeader: vi.fn().mockReturnThis(),
        end: vi.fn().mockReturnThis(),
        headers: {},
        statusCode: 200,
        statusMessage: 'OK',
    }
    return mockResponse
}

// JWT utilities
export const createTestJWT = (payload: any = { userId: 'test-user-id' }) => {
    return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1h' })
}

export const createInvalidJWT = () => {
    return 'invalid.jwt.token'
}

// Test data
export const validStoryRequest: StoryRequest = {
    childName: 'Ahmet',
    age: 7,
    theme: StoryTheme.ADVENTURE,
    length: StoryLength.SHORT,
    elements: ['magical forest', 'brave mouse'],
    token: createTestJWT()
}

export const invalidStoryRequest = {
    childName: 'Ahmet',
    age: 7,
    theme: 'invalid-theme',
    length: 'short'
}

export const blockedContentRequest: StoryRequest = {
    childName: 'Test',
    age: 7,
    theme: StoryTheme.ADVENTURE,
    length: StoryLength.SHORT,
    elements: ['şiddet', 'kavga'],
    token: createTestJWT()
}

// Mock Gemini responses
export const mockGeminiSuccess = {
    response: {
        text: () => JSON.stringify({
            title: 'Ahmet ve Sihirli Orman',
            content: `Bir varmış bir yokmuş, Ahmet adında cesur bir çocuk varmış. Bir gün ormanda gezerken sihirli kapı bulmuş.
            Bu kapıyı açtığında muhteşem dünya çıkmış karşısına. Orada güzel maceralar yaşamış ve arkadaşlar edinmiş.
            Sonunda eve dönerek ailesine maceralarını anlatmış. Herkes çok mutlu olmuş ve gurur duymuş.`,
            wordCount: 55
        })
    }
}

export const mockGeminiInvalidJSON = {
    response: {
        text: () => 'Invalid JSON response'
    }
}

export const mockGeminiError = new Error('Gemini API Error')

// Mock Supabase responses
export const mockSupabaseSuccess = {
    data: [{
        id: 'test-story-id',
        title: 'Ahmet ve Sihirli Orman',
        content: 'Test content...',
        theme: 'adventure',
        age_range: '6-8',
        length: 'short',
        word_count: 150,
        user_id: 'test-user-id',
        created_at: new Date().toISOString()
    }],
    error: null
}

export const mockSupabaseError = {
    data: null,
    error: { message: 'Database error' }
}

export const mockRateLimitExceeded = {
    data: [{ count: 10 }],
    error: null
} 