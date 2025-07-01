import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Story, StoryMetadata } from '@masal-makinesi/shared';

export interface StoredStory {
    id: string;
    title: string;
    content: string;
    child_name: string;
    theme: string;
    length: string;
    word_count: number;
    user_id: string;
    created_at: string;
    metadata: StoryMetadata;
    audio_url?: string;
}

/**
 * Supabase Database Client
 */
export class SupabaseService {
    private client: SupabaseClient;

    constructor(supabaseUrl: string, supabaseKey: string) {
        this.client = createClient(supabaseUrl, supabaseKey);
    }

    /**
     * Stores a generated story in the database
     */
    async storeStory(story: Story, userId: string, metadata: StoryMetadata): Promise<StoredStory> {
        try {
            const storyData = {
                id: story.id,
                title: story.title,
                content: story.content,
                child_name: story.childName,
                theme: story.theme,
                length: story.length,
                word_count: story.wordCount,
                user_id: userId,
                metadata: metadata,
                audio_url: story.audioUrl || null,
            };

            const { data, error } = await this.client
                .from('stories')
                .insert(storyData)
                .select()
                .single();

            if (error) {
                console.error('Supabase insert error:', error);
                throw new Error(`Failed to store story: ${error.message}`);
            }

            return data as StoredStory;
        } catch (error: any) {
            console.error('Store story error:', error);
            throw new Error(`Database operation failed: ${error.message}`);
        }
    }

    /**
     * Retrieves user's stories
     */
    async getUserStories(userId: string, limit: number = 10): Promise<StoredStory[]> {
        try {
            const { data, error } = await this.client
                .from('stories')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('Supabase select error:', error);
                throw new Error(`Failed to fetch stories: ${error.message}`);
            }

            return data as StoredStory[];
        } catch (error: any) {
            console.error('Get user stories error:', error);
            throw new Error(`Database operation failed: ${error.message}`);
        }
    }

    /**
     * Gets a specific story by ID
     */
    async getStoryById(storyId: string, userId: string): Promise<StoredStory | null> {
        try {
            const { data, error } = await this.client
                .from('stories')
                .select('*')
                .eq('id', storyId)
                .eq('user_id', userId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null; // Not found
                }
                console.error('Supabase select error:', error);
                throw new Error(`Failed to fetch story: ${error.message}`);
            }

            return data as StoredStory;
        } catch (error: any) {
            console.error('Get story by ID error:', error);
            throw new Error(`Database operation failed: ${error.message}`);
        }
    }

    /**
     * Updates story with audio URL
     */
    async updateStoryAudio(storyId: string, userId: string, audioUrl: string): Promise<void> {
        try {
            const { error } = await this.client
                .from('stories')
                .update({ audio_url: audioUrl })
                .eq('id', storyId)
                .eq('user_id', userId);

            if (error) {
                console.error('Supabase update error:', error);
                throw new Error(`Failed to update story audio: ${error.message}`);
            }
        } catch (error: any) {
            console.error('Update story audio error:', error);
            throw new Error(`Database operation failed: ${error.message}`);
        }
    }

    /**
     * Checks database connection
     */
    async healthCheck(): Promise<boolean> {
        try {
            const { error } = await this.client
                .from('stories')
                .select('count')
                .limit(1);

            return !error;
        } catch {
            return false;
        }
    }

    /**
     * Gets user story count for rate limiting
     */
    async getUserStoryCount(userId: string, timeWindow: number = 24): Promise<number> {
        try {
            const cutoffTime = new Date(Date.now() - timeWindow * 60 * 60 * 1000).toISOString();

            const { count, error } = await this.client
                .from('stories')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .gte('created_at', cutoffTime);

            if (error) {
                console.error('Supabase count error:', error);
                return 0;
            }

            return count || 0;
        } catch (error) {
            console.error('Get user story count error:', error);
            return 0;
        }
    }
}

/**
 * Creates Supabase client from environment variables
 */
export function createSupabaseService(): SupabaseService {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
    }

    return new SupabaseService(supabaseUrl, supabaseKey);
}

/**
 * Validates Supabase configuration
 */
export function validateSupabaseConfig(): boolean {
    return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
} 